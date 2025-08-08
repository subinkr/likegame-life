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

    const { id: partyId } = await params;

    // 파티 ID로 채팅방 찾기
    const { data: chatRoom, error } = await supabaseAdmin
      .from('chat_rooms')
      .select(`
        *,
        participants:chat_room_participants(
          user:users(id, nickname)
        )
      `)
      .eq('party_id', partyId)
      .single();

    if (error || !chatRoom) {
      return NextResponse.json({ roomId: null });
    }

    const formattedChatRoom = {
      roomId: chatRoom.id,
      id: chatRoom.id,
      name: chatRoom.name,
      type: chatRoom.type,
      participants: (chatRoom.participants || []).map((p: any) => p.user),
    };

    return NextResponse.json(formattedChatRoom);
  } catch (error) {
    return NextResponse.json({ error: '채팅방 정보를 불러오는데 실패했습니다' }, { status: 500 });
  }
} 