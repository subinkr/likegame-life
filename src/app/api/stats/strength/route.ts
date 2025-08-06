import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

// 힘 기록 목록 조회 (30일간의 최고 기록)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 30일 전 날짜 계산
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: records, error } = await supabaseAdmin
      .from('strength_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // 모든 기록 목록 반환 (시간 순서, 최고 기록 표시)
    if (records && records.length > 0) {
      // 최고 기록 찾기
      const bestRecord = records.reduce((best, current) => 
        current.total > best.total ? current : best
      );
      
      const allRecords = records.map((record) => {
        return {
          id: record.id,
          bench: record.bench,
          squat: record.squat,
          deadlift: record.deadlift,
          total: record.total,
          created_at: record.created_at,
          isBestRecord: record.id === bestRecord.id, // 최고 기록인지 확인
        };
      });

      return NextResponse.json({ records: allRecords });
    }

    return NextResponse.json({ records: [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 새 힘 기록 추가
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자가 public.users 테이블에 존재하는지 확인
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (userError || !existingUser) {
      // 사용자가 없으면 추가
      const { error: insertUserError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          nickname: user.email?.split('@')[0] || 'user',
          role: 'user'
        })
        .single();

      if (insertUserError) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    const body = await request.json();
    const { bench, squat, deadlift } = body;

    if (bench === undefined || squat === undefined || deadlift === undefined) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const total = bench + squat + deadlift;

    // 새로운 기록 생성
    const { data: record, error } = await supabaseAdmin
      .from('strength_records')
      .insert({
        user_id: user.id,
        bench,
        squat,
        deadlift,
        total,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ 
        error: 'Internal server error',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      id: record.id,
      bench: record.bench,
      squat: record.squat,
      deadlift: record.deadlift,
      total: record.total,
      created_at: record.created_at,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}