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
        members:party_members(*)
      `)
      .eq('id', partyId)
      .single();

    if (partyError || !party) {
      return NextResponse.json({ error: '파티를 찾을 수 없습니다' }, { status: 404 });
    }

    // 이미 참가 중인지 확인
    const existingMember = (party.members || []).find((member: any) => member.user_id === user.id);
    if (existingMember) {
      // 이미 참가 중인 경우 성공으로 처리 (중복 참가 방지)
      return NextResponse.json({ message: '이미 참가 중인 파티입니다' });
    }

    // 파티 인원 수 확인
    if ((party.members || []).length >= party.max_members) {
      return NextResponse.json({ error: '파티 인원이 가득 찼습니다' }, { status: 400 });
    }

    // 파티 참가
    const { error: memberError } = await supabaseAdmin
      .from('party_members')
      .insert({
        party_id: partyId,
        user_id: user.id,
      });

    if (memberError) {
      return NextResponse.json({ error: '파티 참가에 실패했습니다' }, { status: 500 });
    }

    // 채팅방에 참가자 추가
    const { data: chatRoom, error: chatRoomError } = await supabaseAdmin
      .from('chat_rooms')
      .select('*')
      .eq('party_id', partyId)
      .single();

    if (chatRoomError) {
      return NextResponse.json({ error: '파티 참가에 실패했습니다' }, { status: 500 });
    }

    if (chatRoom) {
      // 채팅방 참가자 중복 체크
      const { data: existingParticipant } = await supabaseAdmin
        .from('chat_room_participants')
        .select('*')
        .eq('chat_room_id', chatRoom.id)
        .eq('user_id', user.id)
        .single();

      if (!existingParticipant) {
        const { error: participantError } = await supabaseAdmin
          .from('chat_room_participants')
          .insert({
            chat_room_id: chatRoom.id,
            user_id: user.id
          });

        if (participantError) {
          return NextResponse.json({ error: '파티 참가에 실패했습니다' }, { status: 500 });
        }
      }

      // 시스템 메시지 생성 (사용자가 참가)
      const { error: messageError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          chat_room_id: chatRoom.id,
          user_id: user.id,
          content: 'SYSTEM_JOIN',
        });

      if (messageError) {
        // 시스템 메시지 생성 에러 무시
      }
    }

    return NextResponse.json({ message: '파티 참가가 완료되었습니다' });
  } catch (error) {
    return NextResponse.json({ error: '파티 참가에 실패했습니다' }, { status: 500 });
  }
} 