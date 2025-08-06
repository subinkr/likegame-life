import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSupabase } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

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
      );
    }

    const paramsData = await params;
    const { id } = paramsData;

    // 사용자가 해당 채팅방의 참가자인지 확인
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('chat_room_participants')
      .select('*')
      .eq('chat_room_id', id)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: '채팅방에 참여하고 있지 않습니다.' },
        { status: 404 }
      );
    }

    // 채팅방 정보 조회 (파티 정보 확인용)
    const { data: chatRoom, error: chatRoomError } = await supabaseAdmin
      .from('chat_rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (chatRoomError) {
      console.error('채팅방 조회 에러:', chatRoomError);
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 채팅방 참가자에서 제거
    const { error: leaveError } = await supabaseAdmin
      .from('chat_room_participants')
      .delete()
      .eq('chat_room_id', id)
      .eq('user_id', user.id);

    if (leaveError) {
      console.error('채팅방 나가기 에러:', leaveError);
      return NextResponse.json(
        { error: '채팅방을 나가는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 파티 채팅방인 경우 파티에서도 나가기
    if (chatRoom.party_id) {
      const { error: partyLeaveError } = await supabaseAdmin
        .from('party_members')
        .delete()
        .eq('party_id', chatRoom.party_id)
        .eq('user_id', user.id);

      if (partyLeaveError) {
        console.error('파티 나가기 에러:', partyLeaveError);
        // 파티 나가기 실패해도 채팅방은 나간 상태이므로 경고만 로그
      }
    }

    // 퀘스트 채팅방인 경우 퀘스트 생성자 처리
    if (chatRoom.quest_id) {
      const { data: quest, error: questError } = await supabaseAdmin
        .from('quests')
        .select('creator_id, status')
        .eq('id', chatRoom.quest_id)
        .single();

      if (questError) {
        console.error('퀘스트 조회 에러:', questError);
      } else if (quest && quest.creator_id === user.id) {
        // 완료된 퀘스트는 삭제하지 않음
        if (quest.status === 'COMPLETED') {
          console.log('완료된 퀘스트 채팅방에서 생성자가 나감:', chatRoom.quest_id);
          return NextResponse.json({
            message: '완료된 퀘스트 채팅방을 나갔습니다.'
          });
        }
        
        // 진행 중인 퀘스트 생성자가 나가는 경우 퀘스트 삭제
        console.log('퀘스트 생성자가 채팅방을 나가므로 퀘스트 삭제:', chatRoom.quest_id);
        
        // 퀘스트 삭제
        const { error: questDeleteError } = await supabaseAdmin
          .from('quests')
          .delete()
          .eq('id', chatRoom.quest_id);

        if (questDeleteError) {
          console.error('퀘스트 삭제 에러:', questDeleteError);
        } else {
          console.log('✅ 퀘스트 삭제 성공:', chatRoom.quest_id);
        }

        // 채팅방 메시지 삭제
        const { error: messagesError } = await supabaseAdmin
          .from('chat_messages')
          .delete()
          .eq('chat_room_id', id);

        if (messagesError) {
          console.error('채팅방 메시지 삭제 에러:', messagesError);
        }

        // 채팅방 참가자 삭제
        const { error: participantsError } = await supabaseAdmin
          .from('chat_room_participants')
          .delete()
          .eq('chat_room_id', id);

        if (participantsError) {
          console.error('채팅방 참가자 삭제 에러:', participantsError);
        }

        // 채팅방 삭제
        const { error: chatRoomDeleteError } = await supabaseAdmin
          .from('chat_rooms')
          .delete()
          .eq('id', id);

        if (chatRoomDeleteError) {
          console.error('채팅방 삭제 에러:', chatRoomDeleteError);
        } else {
          console.log('✅ 채팅방 삭제 성공:', id);
        }

        return NextResponse.json({
          message: '퀘스트 생성자가 나가면서 퀘스트와 채팅방이 삭제되었습니다.',
          deletedQuest: true
        });
      }
    }

    return NextResponse.json({
      message: '채팅방을 나갔습니다.'
    });
  } catch (error) {
    console.error('채팅방 나가기 실패:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 