import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSupabase } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 페이지네이션 파라미터
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 전체 개수 조회
    const { count, error: countError } = await supabaseAdmin
      .from('parties')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({ error: '파티 목록을 불러오는데 실패했습니다' }, { status: 500 });
    }

    // 페이지네이션된 데이터 조회
    const { data: parties, error } = await supabaseAdmin
      .from('parties')
      .select(`
        *,
        leader:users!leader_id(id, nickname),
        members:party_members(
          user:users(id, nickname)
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
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

    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;

    return NextResponse.json({
      parties: formattedParties,
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage,
        totalCount: count
      }
    });
  } catch (error) {
    return NextResponse.json({ error: '파티 목록을 불러오는데 실패했습니다' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    
    const { name, description, maxMembers } = body;

    if (!name || !description || !maxMembers) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 });
    }

    // 최대 인원 제한 (2-6명)
    if (maxMembers < 2 || maxMembers > 6) {
      return NextResponse.json({ error: '파티 인원은 2명에서 6명 사이여야 합니다' }, { status: 400 });
    }

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
      return NextResponse.json({ error: '파티 생성에 실패했습니다' }, { status: 500 });
    }

    // 파티장을 멤버로 추가
    const { error: memberError } = await supabaseAdmin
      .from('party_members')
      .insert({
        party_id: party.id,
        user_id: user.id,
      });

    if (memberError) {
      return NextResponse.json({ error: '파티 생성에 실패했습니다' }, { status: 500 });
    }

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
      return NextResponse.json({ error: '파티 생성에 실패했습니다' }, { status: 500 });
    }

    // 파티장을 채팅방 참가자로 추가
    const { error: participantError } = await supabaseAdmin
      .from('chat_room_participants')
      .insert({
        chat_room_id: chatRoom.id,
        user_id: user.id,
      });

    if (participantError) {
      return NextResponse.json({ error: '파티 생성에 실패했습니다' }, { status: 500 });
    }

    const result = {
      id: party.id,
      name: party.name,
      description: party.description,
      maxMembers: party.max_members,
      leader: party.leader,
      members: [party.leader],
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ 
      error: '파티 생성에 실패했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 에러'
    }, { status: 500 });
  }
} 