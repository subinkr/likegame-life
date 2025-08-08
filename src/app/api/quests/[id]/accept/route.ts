import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

// 퀘스트 수락
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const paramsData = await params;
    const { id: questId } = paramsData;

    // 퀘스트 존재 확인
    const { data: quest, error: questError } = await supabaseAdmin
      .from('quests')
      .select(`
        *,
        creator:users!creator_id(id, email, nickname)
      `)
      .eq('id', questId)
      .single();

    if (questError || !quest) {
      return NextResponse.json(
        { error: '존재하지 않는 퀘스트입니다.' },
        { status: 404 }
      );
    }

    // 자신이 만든 퀘스트는 수락할 수 없음
    if (quest.creator_id === user.id) {
      return NextResponse.json(
        { error: '자신이 만든 퀘스트는 수락할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 이미 수락된 퀘스트인지 확인
    if (quest.accepted_by_user_id) {
      return NextResponse.json({ error: '이미 수락된 퀘스트입니다' }, { status: 400 });
    }

    // 퀘스트가 열린 상태이거나 취소된 상태인지 확인
    if (quest.status !== 'OPEN' && quest.status !== 'CANCELLED') {
      return NextResponse.json(
        { error: '수락할 수 없는 퀘스트입니다.' },
        { status: 400 }
      );
    }

    // 퀘스트 수락
    const { data: updatedQuest, error: questUpdateError } = await supabaseAdmin
      .from('quests')
      .update({
        status: 'IN_PROGRESS',
        accepted_by_user_id: user.id,
      })
      .eq('id', questId)
      .select(`
        *,
        creator:users!creator_id(id, email, nickname),
        accepted_by_user:users!accepted_by_user_id(id, email, nickname)
      `)
      .single();

    if (questUpdateError) {
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 기존 퀘스트 채팅방 찾기
    const { data: chatRoom, error: chatRoomError } = await supabaseAdmin
      .from('chat_rooms')
      .select('*')
      .eq('quest_id', questId)
      .single();

    if (chatRoomError || !chatRoom) {
      // 채팅방이 없으면 새로 생성
      const { data: newChatRoom, error: createChatRoomError } = await supabaseAdmin
        .from('chat_rooms')
        .insert({
          quest_id: questId,
          name: `퀘스트: ${quest.title}`,
          type: 'quest'
        })
        .select()
        .single();

      if (createChatRoomError) {
        return NextResponse.json(
          { error: '채팅방 생성에 실패했습니다.' },
          { status: 500 }
        );
      }

      // 생성자와 수락자를 채팅방에 추가 (중복 체크 없이)
      console.log('생성자를 채팅방에 추가합니다:', quest.creator_id);
      const { error: creatorParticipantError } = await supabaseAdmin
        .from('chat_room_participants')
        .upsert({
          chat_room_id: newChatRoom.id,
          user_id: quest.creator_id
        }, { onConflict: 'chat_room_id,user_id' });

      if (creatorParticipantError) {
        console.log('생성자 참가자 추가 실패:', creatorParticipantError);
        return NextResponse.json(
          { error: '채팅방 참가자 추가에 실패했습니다.' },
          { status: 500 }
        );
      }

      console.log('생성자 참가자 추가 성공');

      // 수락자를 채팅방에 추가 (중복 체크 없이)
      console.log('수락자를 채팅방에 추가합니다:', user.id);
      const { error: participantError } = await supabaseAdmin
        .from('chat_room_participants')
        .upsert({
          chat_room_id: newChatRoom.id,
          user_id: user.id
        }, { onConflict: 'chat_room_id,user_id' });

      if (participantError) {
        console.log('수락자 참가자 추가 실패:', participantError);
        return NextResponse.json(
          { error: '서버 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      console.log('수락자 참가자 추가 성공');

      // 시스템 메시지 생성
      const { error: messageError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          chat_room_id: newChatRoom.id,
          user_id: user.id,
          content: `${user.nickname || user.email?.split('@')[0]}님이 퀘스트를 수락했습니다!`,
        });

      if (messageError) {
        // 시스템 메시지 생성 에러 무시
      }

      return NextResponse.json({
        message: '퀘스트를 수락했습니다.',
        quest: updatedQuest
      });
    }

    // 퀘스트 수락자를 채팅방에 추가 (중복 체크 없이)
    console.log('기존 채팅방에 수락자를 추가합니다:', user.id);
    const { error: participantError } = await supabaseAdmin
      .from('chat_room_participants')
      .upsert({
        chat_room_id: chatRoom.id,
        user_id: user.id
      }, { onConflict: 'chat_room_id,user_id' });

    if (participantError) {
      console.log('수락자 참가자 추가 실패:', participantError);
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    console.log('수락자 참가자 추가 성공');

    // 시스템 메시지 생성 (수락자가 참가)
    const { error: messageError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        chat_room_id: chatRoom.id,
        user_id: user.id,
        content: `${user.nickname || user.email?.split('@')[0]}님이 퀘스트를 수락했습니다!`,
      });

    if (messageError) {
      // 시스템 메시지 생성 에러 무시
    }

    return NextResponse.json({
      message: '퀘스트를 수락했습니다.',
      quest: updatedQuest
    });

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 