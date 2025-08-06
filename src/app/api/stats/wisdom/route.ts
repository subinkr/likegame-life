import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

// 지혜 스탯 조회 (초서 개수)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 최근 30일간의 초서 개수 계산
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));

    const { count: wisdomCount, error } = await supabaseAdmin
      .from('wisdom_notes')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString())
      .lte('date', currentDate.toISOString());

    if (error) {
      return NextResponse.json({ wisdom: 0 });
    }

    return NextResponse.json({ wisdom: wisdomCount });
  } catch (error) {
    // 데이터베이스 관련 에러인 경우 기본값 반환
    if (error instanceof Error && error.message.includes('database')) {
      return NextResponse.json({ wisdom: 0 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 