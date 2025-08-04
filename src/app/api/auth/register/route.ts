import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { userRegistrationSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 입력 검증
    const { error, value } = userRegistrationSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }
    
    const { email, password, nickname } = value;

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: '이미 존재하는 이메일입니다.' }, { status: 400 });
    }

    // 비밀번호 해시화
    const hashedPassword = await hashPassword(password);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname
      }
    });

    // JWT 토큰 생성
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

    // 쿠키에 토큰 설정
    response.cookies.set('likegame-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7일
    });

    return response;
  } catch (error) {
    logger.error('Registration error', error);
    return NextResponse.json({ error: '회원가입에 실패했습니다.' }, { status: 500 });
  }
} 