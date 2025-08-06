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
    const { id: partyId } = paramsData;

    // 파티 존재 확인
    const { data: party, error: partyError } = await supabaseAdmin
      .from('parties')
      .select(`
        *,
        members:party_members(
          user:users(id, nickname)
        )
      `)
      .eq('id', partyId)
      .single();

    if (partyError || !party) {
      return NextResponse.json({ error: '파티를 찾을 수 없습니다' }, { status: 404 });
    }

    // 사용자가 파티 멤버인지 확인
    const member = (party.members || []).find((m: any) => m.user.id === user.id);
    if (!member) {
      return NextResponse.json({ error: '파티 멤버가 아닙니다' }, { status: 403 });
    }

    // 파티장은 나갈 수 없음 (해산만 가능)
    if (party.leader_id === user.id) {
      return NextResponse.json({ 
        error: '파티장은 나갈 수 없습니다. 파티를 해산하거나 다른 멤버에게 파티장을 넘겨주세요.' 
      }, { status: 403 });
    }

    // 파티에서 나가기 (PartyMember 레코드 삭제)
    const { error: memberDeleteError } = await supabaseAdmin
      .from('party_members')
      .delete()
      .eq('party_id', partyId)
      .eq('user_id', user.id);

    if (memberDeleteError) {
      console.error('파티 멤버 삭제 에러:', memberDeleteError);
      return NextResponse.json({ error: '파티 나가기에 실패했습니다' }, { status: 500 });
    }

    // 해당 파티의 채팅방에서도 자동으로 나가기
    const { data: partyWithChatRoom, error: chatRoomError } = await supabaseAdmin
      .from('parties')
      .select(`
        *,
        chat_room:chat_rooms(*)
      `)
      .eq('id', partyId)
      .single();

    if (chatRoomError) {
      console.error('채팅방 조회 에러:', chatRoomError);
      return NextResponse.json({ error: '파티 나가기에 실패했습니다' }, { status: 500 });
    }

    if (partyWithChatRoom?.chat_room) {
      // 채팅방에서 나가기
      const { error: chatParticipantError } = await supabaseAdmin
        .from('chat_room_participants')
        .delete()
        .eq('chat_room_id', partyWithChatRoom.chat_room.id)
        .eq('user_id', user.id);

      if (chatParticipantError) {
        console.error('채팅방 참가자 삭제 에러:', chatParticipantError);
        // 채팅방 참가자 삭제 실패해도 파티 나가기는 성공으로 처리
      } else {
        console.log('✅ 채팅방 참가자 삭제 성공:', user.id);
      }

      // 시스템 메시지 생성 (사용자가 나감)
      const { error: messageError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          chat_room_id: partyWithChatRoom.chat_room.id,
          user_id: user.id,
          content: 'SYSTEM_LEAVE',
        });

      if (messageError) {
        console.error('시스템 메시지 생성 에러:', messageError);
      }
    }

    return NextResponse.json({ 
      message: '파티에서 나갔습니다',
      partyId 
    });

  } catch (error) {
    console.error('파티 나가기 실패:', error);
    return NextResponse.json({ error: '파티 나가기에 실패했습니다' }, { status: 500 });
  }
} 