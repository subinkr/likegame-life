import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

// 지혜 스탯 조회 (초서 개수)
export async function GET(request: NextRequest) {
  try {
    console.log('Wisdom stats API called');
    
    const user = await getCurrentUserFromSupabase(request);
    console.log('User found:', user ? 'yes' : 'no');
    
    if (!user) {
      console.log('No user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 최근 30일간의 초서 개수 계산
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    console.log('Date range:', { thirtyDaysAgo, currentDate, userId: user.id });

    const { count: wisdomCount, error } = await supabaseAdmin
      .from('wisdom_notes')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString())
      .lte('date', currentDate.toISOString());

    if (error) {
      console.error('지혜 스탯 조회 에러:', error);
      return NextResponse.json({ wisdom: 0 });
    }

    console.log('Wisdom count:', wisdomCount);
    return NextResponse.json({ wisdom: wisdomCount });
  } catch (error) {
    console.error('Error fetching wisdom stats:', error);
    
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