import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

// 민첩 기록 목록 조회 (30일간의 누적 기록)
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
      .from('agility_records')
      .select('id, distance, created_at')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // 개별 기록 목록만 반환
    if (records && records.length > 0) {
      const individualRecords = records.map(record => ({
        id: record.id,
        distance: record.distance,
        created_at: record.created_at,
      }));

      return NextResponse.json(individualRecords);
    }

    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 새 민첩 기록 추가
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
    const { distance } = body;

    if (distance === undefined) {
      return NextResponse.json({ error: 'Distance is required' }, { status: 400 });
    }

    // 새로운 기록 생성
    const { data: record, error } = await supabaseAdmin
      .from('agility_records')
      .insert({
        user_id: user.id,
        distance: distance,
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
      distance: record.distance,
      created_at: record.created_at,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}