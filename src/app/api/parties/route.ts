import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSupabase } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    console.log('파티 목록 조회 시작');
    const { data: parties, error } = await supabaseAdmin
      .from('parties')
      .select(`
        *,
        leader:users!leader_id(id, nickname),
        members:party_members(
          user:users(id, nickname)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('파티 목록 조회 에러:', error);
      return NextResponse.json({ error: '파티 목록을 불러오는데 실패했습니다' }, { status: 500 });
    }

    const formattedParties = (parties || []).map(party => ({
      id: party.id,
      name: party.name,
      description: party.description,
      maxMembers: party.max_members,
      leader: party.leader,
      members: (party.members || []).map((member: any) => member.user),
    }));

    console.log('파티 목록 조회 완료:', formattedParties.length, '개');
    return NextResponse.json(formattedParties);
  } catch (error) {
    console.error('파티 목록 조회 실패:', error);
    return NextResponse.json({ error: '파티 목록을 불러오는데 실패했습니다' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('파티 생성 요청 시작');
    
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      console.log('인증 실패');
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    console.log('사용자 확인 완료:', user.id);

    const body = await request.json();
    console.log('요청 본문:', body);
    
    const { name, description, maxMembers } = body;

    if (!name || !description || !maxMembers) {
      console.log('필수 필드 누락:', { name, description, maxMembers });
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 });
    }

    // 최대 인원 제한 (2-6명)
    if (maxMembers < 2 || maxMembers > 6) {
      console.log('최대 인원 제한 위반:', maxMembers);
      return NextResponse.json({ error: '파티 인원은 2명에서 6명 사이여야 합니다' }, { status: 400 });
    }

    console.log('파티 생성 시작:', { name, description, maxMembers, leaderId: user.id });

    // 파티 생성
    const { data: party, error: partyError } = await supabaseAdmin
      .from('parties')
      .insert({
        name,
        description,
        max_members: maxMembers,
        leader_id: user.id,
      })
      .select(`
        *,
        leader:users!leader_id(id, nickname)
      `)
      .single();

    if (partyError) {
      console.error('파티 생성 에러:', partyError);
      return NextResponse.json({ error: '파티 생성에 실패했습니다' }, { status: 500 });
    }

    console.log('파티 생성 완료:', party.id);

    // 파티장을 멤버로 추가
    const { error: memberError } = await supabaseAdmin
      .from('party_members')
      .insert({
        party_id: party.id,
        user_id: user.id,
      });

    if (memberError) {
      console.error('파티 멤버 추가 에러:', memberError);
      return NextResponse.json({ error: '파티 생성에 실패했습니다' }, { status: 500 });
    }

    console.log('파티장 멤버 추가 완료');

    // 파티용 채팅방 생성
    const { data: chatRoom, error: chatRoomError } = await supabaseAdmin
      .from('chat_rooms')
      .insert({
        name: party.name,
        type: 'PARTY',
        created_by: user.id,
        party_id: party.id,
      })
      .select()
      .single();

    if (chatRoomError) {
      console.error('채팅방 생성 에러:', chatRoomError);
      return NextResponse.json({ error: '파티 생성에 실패했습니다' }, { status: 500 });
    }

    console.log('채팅방 생성 완료:', {
      chatRoomId: chatRoom.id,
      partyId: party.id,
      partyName: party.name
    });

    // 파티장을 채팅방 참가자로 추가
    const { error: participantError } = await supabaseAdmin
      .from('chat_room_participants')
      .insert({
        chat_room_id: chatRoom.id,
        user_id: user.id,
      });

    if (participantError) {
      console.error('채팅방 참가자 추가 에러:', participantError);
      return NextResponse.json({ error: '파티 생성에 실패했습니다' }, { status: 500 });
    }

    console.log('채팅방 참가자 추가 완료');

    const result = {
      id: party.id,
      name: party.name,
      description: party.description,
      maxMembers: party.max_members,
      leader: party.leader,
      members: [party.leader],
    };

    console.log('파티 생성 완료:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('파티 생성 실패 - 상세 에러:', error);
    console.error('에러 스택:', error instanceof Error ? error.stack : '스택 없음');
    return NextResponse.json({ 
      error: '파티 생성에 실패했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 에러'
    }, { status: 500 });
  }
} 