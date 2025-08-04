import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken, comparePassword } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 확인
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type이 application/json이어야 합니다.' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.error('JSON 파싱 오류', parseError);
      return NextResponse.json({ error: '잘못된 JSON 형식입니다.' }, { status: 400 });
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      nickname: user.nickname || undefined,
      role: user.role
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role
      }
    });

    response.cookies.set('likegame-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7일
    });

    return response;
  } catch (error) {
    logger.error('Login error', error);
    return NextResponse.json({ error: '로그인에 실패했습니다.' }, { status: 500 });
  }
} 