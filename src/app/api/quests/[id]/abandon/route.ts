import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth'

// 퀘스트 포기 (수락한 사람만 가능)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request);
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
      .select('*')
      .eq('id', questId)
      .single();

    if (questError || !quest) {
      return NextResponse.json(
        { error: '존재하지 않는 퀘스트입니다.' },
        { status: 404 }
      );
    }

    // 수락한 사용자만 포기할 수 있음
    if (quest.accepted_by_user_id !== user.id) {
      return NextResponse.json({ error: '수락한 사용자만 포기할 수 있습니다' }, { status: 403 });
    }

    // 진행 중인 퀘스트만 포기 가능
    if (quest.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: '포기할 수 없는 퀘스트입니다.' },
        { status: 400 }
      );
    }

    // 퀘스트 포기
    const { error: questUpdateError } = await supabaseAdmin
      .from('quests')
      .update({
        status: 'OPEN',
        accepted_by_user_id: null,
      })
      .eq('id', questId);

    if (questUpdateError) {
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 퀘스트 채팅방에서 참가자 제거
    const { data: questChatRoom, error: chatRoomError } = await supabaseAdmin
      .from('chat_rooms')
      .select('*')
      .eq('quest_id', questId)
      .single();

    if (chatRoomError) {
      // 퀘스트 채팅방 조회 에러 무시
    } else if (questChatRoom) {
      // 채팅방에서 참가자 제거
      const { error: participantError } = await supabaseAdmin
        .from('chat_room_participants')
        .delete()
        .eq('chat_room_id', questChatRoom.id)
        .eq('user_id', user.id);

      if (participantError) {
        // 채팅방 참가자 제거 에러 무시
      }

      // 시스템 메시지 생성 (사용자가 포기)
      const { error: messageError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          chat_room_id: questChatRoom.id,
          user_id: user.id,
          content: 'SYSTEM_ABANDON',
        });

      if (messageError) {
        // 시스템 메시지 생성 에러 무시
      }
    }

    return NextResponse.json({
      message: '퀘스트를 포기했습니다.',
      quest: quest
    })

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 