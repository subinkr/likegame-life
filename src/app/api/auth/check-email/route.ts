import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const { data: existingUsers, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Email check error:', error);
      return NextResponse.json(
        { error: '이메일 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 이메일이 이미 존재하는지 확인
    const emailExists = existingUsers.users.some(user => user.email === email);

    return NextResponse.json({
      exists: emailExists,
      message: emailExists ? '이미 가입된 이메일입니다.' : '사용 가능한 이메일입니다.'
    });

  } catch (error) {
    console.error('Email check error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 