import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { nickname } = await request.json();

    if (!nickname || nickname.trim() === '') {
      return NextResponse.json(
        { error: '닉네임을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 닉네임 중복 확인
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('nickname')
      .eq('nickname', nickname.trim())
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116는 결과가 없을 때의 에러 코드
      console.error('닉네임 확인 중 오류:', error);
      return NextResponse.json(
        { error: '닉네임 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const exists = !!existingUser;

    return NextResponse.json({
      exists,
      nickname: nickname.trim()
    });

  } catch (error) {
    console.error('닉네임 확인 API 오류:', error);
    return NextResponse.json(
      { error: '닉네임 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 