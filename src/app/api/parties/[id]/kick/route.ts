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
    const { memberId, confirmed } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: '추방할 멤버 ID가 필요합니다' }, { status: 400 });
    }

    // 확인 절차
    if (!confirmed) {
      return NextResponse.json({ error: '멤버 추방을 확인해주세요' }, { status: 400 });
    }

    // 파티 존재 확인
    const { data: party, error: partyError } = await supabaseAdmin
      .from('parties')
      .select(`
        *,
        leader:users!leader_id(id, nickname),
        members:party_members(
          user_id,
          user:users(id, nickname)
        )
      `)
      .eq('id', partyId)
      .single();

    if (partyError || !party) {
      console.error('파티 조회 에러:', partyError);
      return NextResponse.json({ error: '파티를 찾을 수 없습니다' }, { status: 404 });
    }

    console.log('파티 정보:', { partyId, members: party.members, memberId });

    // 파티장만 추방할 수 있음
    if (party.leader_id !== user.id) {
      return NextResponse.json({ error: '파티장만 멤버를 추방할 수 있습니다' }, { status: 403 });
    }

    // 자신을 추방할 수 없음
    if (memberId === user.id) {
      return NextResponse.json({ error: '자신을 추방할 수 없습니다' }, { status: 400 });
    }

    // 멤버가 존재하는지 확인
    const member = (party.members || []).find((m: any) => {
      const userId = m.user?.id || m.user_id;
      return userId === memberId;
    });
    
    if (!member) {
      console.error('멤버를 찾을 수 없음:', { 
        memberId, 
        members: party.members,
        memberIds: party.members?.map((m: any) => m.user?.id || m.user_id)
      });
      return NextResponse.json({ error: '추방할 멤버를 찾을 수 없습니다' }, { status: 404 });
    }

    // 멤버 추방
    const { error: memberDeleteError } = await supabaseAdmin
      .from('party_members')
      .delete()
      .eq('party_id', partyId)
      .eq('user_id', memberId);

    if (memberDeleteError) {
      console.error('멤버 추방 에러:', memberDeleteError);
      return NextResponse.json({ error: '멤버 추방에 실패했습니다' }, { status: 500 });
    }

    // 채팅방에서도 추방
    const { data: chatRoom, error: chatRoomError } = await supabaseAdmin
      .from('chat_rooms')
      .select('*')
      .eq('party_id', partyId)
      .single();

    if (chatRoomError) {
      console.error('채팅방 조회 에러:', chatRoomError);
      return NextResponse.json({ error: '멤버 추방에 실패했습니다' }, { status: 500 });
    }

    if (chatRoom) {
      // 채팅방에서 추방된 멤버 제거
      const { error: chatParticipantError } = await supabaseAdmin
        .from('chat_room_participants')
        .delete()
        .eq('chat_room_id', chatRoom.id)
        .eq('user_id', memberId);

      if (chatParticipantError) {
        console.error('채팅방 참가자 삭제 에러:', chatParticipantError);
      }

      // 시스템 메시지 생성 (멤버가 추방됨)
      const { error: messageError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          chat_room_id: chatRoom.id,
          user_id: memberId,
          content: 'SYSTEM_LEAVE',
        });

      if (messageError) {
        console.error('시스템 메시지 생성 에러:', messageError);
      }
    }

    return NextResponse.json({ message: '멤버가 추방되었습니다' });
  } catch (error) {
    console.error('멤버 추방 실패:', error);
    return NextResponse.json({ error: '멤버 추방에 실패했습니다' }, { status: 500 });
  }
} 