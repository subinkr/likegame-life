import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSupabase } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { id: questId } = await params;
    
    console.log('퀘스트 ID로 채팅방 조회:', {
      questId,
      userId: user.id
    });

    // 퀘스트 ID로 채팅방 찾기
    const { data: chatRoom, error } = await supabaseAdmin
      .from('chat_rooms')
      .select(`
        *,
        participants:chat_room_participants(
          user:users(id, nickname)
        )
      `)
      .eq('quest_id', questId)
      .single();

    if (error || !chatRoom) {
      console.log('퀘스트 채팅방을 찾을 수 없음:', {
        questId,
        userId: user.id
      });
      return NextResponse.json({ error: '채팅방을 찾을 수 없습니다' }, { status: 404 });
    }

    const formattedChatRoom = {
      id: chatRoom.id,
      name: chatRoom.name,
      type: chatRoom.type,
      participants: (chatRoom.participants || []).map((p: any) => p.user),
    };

    console.log('퀘스트 채팅방 찾음:', {
      chatRoomId: chatRoom.id,
      questId
    });

    return NextResponse.json(formattedChatRoom);
  } catch (error) {
    console.error('퀘스트 채팅방 조회 실패:', error);
    return NextResponse.json({ error: '채팅방 정보를 불러오는데 실패했습니다' }, { status: 500 });
  }
} 