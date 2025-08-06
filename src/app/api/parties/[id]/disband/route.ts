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

    const { id: partyId } = await params;
    const { confirmed } = await request.json();

    // 확인 절차
    if (!confirmed) {
      return NextResponse.json({ error: '파티 해산을 확인해주세요' }, { status: 400 });
    }

    // 파티 존재 확인
    const { data: party, error: partyError } = await supabaseAdmin
      .from('parties')
      .select(`
        *,
        leader:users!leader_id(id, nickname)
      `)
      .eq('id', partyId)
      .single();

    if (partyError || !party) {
      return NextResponse.json({ error: '파티를 찾을 수 없습니다' }, { status: 404 });
    }

    // 파티장만 해산할 수 있음
    if (party.leader_id !== user.id) {
      return NextResponse.json({ error: '파티장만 파티를 해산할 수 있습니다' }, { status: 403 });
    }

    // 파티 해산 처리 (순차적으로 삭제)
    // 1. 채팅방 삭제
    const { error: chatRoomDeleteError } = await supabaseAdmin
      .from('chat_rooms')
      .delete()
      .eq('party_id', partyId);

    if (chatRoomDeleteError) {
      return NextResponse.json({ error: '파티 해산에 실패했습니다' }, { status: 500 });
    }

    // 2. 파티 멤버 삭제
    const { error: memberDeleteError } = await supabaseAdmin
      .from('party_members')
      .delete()
      .eq('party_id', partyId);

    if (memberDeleteError) {
      return NextResponse.json({ error: '파티 해산에 실패했습니다' }, { status: 500 });
    }

    // 3. 파티 삭제
    const { error: partyDeleteError } = await supabaseAdmin
      .from('parties')
      .delete()
      .eq('id', partyId);

    if (partyDeleteError) {
      return NextResponse.json({ error: '파티 해산에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ message: '파티가 해산되었습니다' });
  } catch (error) {
    return NextResponse.json({ error: '파티 해산에 실패했습니다' }, { status: 500 });
  }
} 