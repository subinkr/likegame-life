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
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 파티 정보 조회
    const { data: party, error } = await supabaseAdmin
      .from('parties')
      .select(`
        *,
        leader:users!leader_id(id, nickname),
        members:party_members(
          user:users(id, nickname)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('파티 조회 에러:', error);
      return NextResponse.json(
        { error: '파티를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const formattedParty = {
      id: party.id,
      name: party.name,
      description: party.description,
      maxMembers: party.max_members,
      leader: party.leader,
      leader_id: party.leader_id,
      members: (party.members || []).map((member: any) => member.user),
    };

    return NextResponse.json(formattedParty);
  } catch (error) {
    console.error('파티 조회 실패:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 