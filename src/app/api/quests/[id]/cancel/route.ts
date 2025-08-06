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
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const paramsData = await params;
    const { id: questId } = paramsData;

    // 퀘스트 존재 확인
    const { data: quest, error: questError } = await supabaseAdmin
      .from('quests')
      .select(`
        *,
        creator:users!creator_id(id, nickname),
        accepted_by_user:users!accepted_by_user_id(id, nickname)
      `)
      .eq('id', questId)
      .single();

    if (questError || !quest) {
      return NextResponse.json({ error: '퀘스트를 찾을 수 없습니다' }, { status: 404 });
    }

    // 퀘스트 생성자만 취소할 수 있음
    if (quest.creator_id !== user.id) {
      return NextResponse.json({ error: '퀘스트 생성자만 취소할 수 있습니다' }, { status: 403 });
    }

    // 이미 완료된 퀘스트는 취소할 수 없음
    if (quest.status === 'COMPLETED') {
      return NextResponse.json({ error: '완료된 퀘스트는 취소할 수 없습니다' }, { status: 400 });
    }

    // 퀘스트 취소 (수락자가 있어도 취소 가능)
    const { error: questUpdateError } = await supabaseAdmin
      .from('quests')
      .update({
        status: 'CANCELLED',
        accepted_by_user_id: null, // 수락자 정보도 초기화
      })
      .eq('id', questId);

    if (questUpdateError) {
      console.error('퀘스트 취소 에러:', questUpdateError);
      return NextResponse.json({ error: '퀘스트 취소에 실패했습니다' }, { status: 500 });
    }

    // 퀘스트 관련 채팅방 삭제
    const { data: questChatRoom, error: chatRoomError } = await supabaseAdmin
      .from('chat_rooms')
      .select('*')
      .eq('quest_id', questId)
      .single();

    if (chatRoomError) {
      console.error('퀘스트 채팅방 조회 에러:', chatRoomError);
    } else if (questChatRoom) {
      // 채팅방 메시지 삭제
      const { error: messagesError } = await supabaseAdmin
        .from('chat_messages')
        .delete()
        .eq('chat_room_id', questChatRoom.id);

      if (messagesError) {
        console.error('채팅방 메시지 삭제 에러:', messagesError);
      }

      // 채팅방 참가자 삭제
      const { error: participantsError } = await supabaseAdmin
        .from('chat_room_participants')
        .delete()
        .eq('chat_room_id', questChatRoom.id);

      if (participantsError) {
        console.error('채팅방 참가자 삭제 에러:', participantsError);
      }

      // 채팅방 삭제
      const { error: chatRoomDeleteError } = await supabaseAdmin
        .from('chat_rooms')
        .delete()
        .eq('id', questChatRoom.id);

      if (chatRoomDeleteError) {
        console.error('채팅방 삭제 에러:', chatRoomDeleteError);
      } else {
        console.log('✅ 퀘스트 채팅방 삭제 성공:', questChatRoom.id);
      }
    }

    return NextResponse.json({ 
      message: '퀘스트가 취소되었습니다',
      quest: {
        ...quest,
        status: 'CANCELLED',
        accepted_by_user_id: null,
      }
    });
  } catch (error) {
    console.error('퀘스트 취소 실패:', error);
    return NextResponse.json({ error: '퀘스트 취소에 실패했습니다' }, { status: 500 });
  }
} 