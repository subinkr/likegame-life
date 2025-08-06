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
      console.error('민첩 기록 조회 에러:', error);
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
    console.error('Error fetching agility records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 새 민첩 기록 추가
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Agility POST 요청 시작');
    
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      console.log('❌ 인증 실패');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ 인증 성공:', user.id, user.email);

    // 사용자가 public.users 테이블에 존재하는지 확인
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    console.log('🔍 사용자 확인 결과:', { existingUser, userError });

    if (userError || !existingUser) {
      console.log('⚠️ 사용자가 없음, 추가 시도');
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
        console.error('❌ 사용자 추가 에러:', insertUserError);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
      console.log('✅ 사용자 추가 성공');
    } else {
      console.log('✅ 사용자 존재 확인');
    }

    const body = await request.json();
    const { distance } = body;

    console.log('📊 요청 데이터:', { distance, body });

    if (distance === undefined) {
      console.log('❌ distance 필드 누락');
      return NextResponse.json({ error: 'Distance is required' }, { status: 400 });
    }

    console.log('📅 기록 생성 데이터:', {
      user_id: user.id,
      distance
    });

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
      console.error('❌ 민첩 기록 생성 에러:', error);
      return NextResponse.json({ 
        error: 'Internal server error',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ 민첩 기록 생성 성공:', record);

    return NextResponse.json({
      id: record.id,
      distance: record.distance,
      created_at: record.created_at,
    }, { status: 201 });
  } catch (error) {
    console.error('❌ 민첩 기록 생성 중 예외 발생:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}