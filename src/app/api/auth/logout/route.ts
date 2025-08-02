import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // 응답 생성
    const response = NextResponse.json({
      message: '로그아웃이 완료되었습니다.'
    })

    // 쿠키에서 토큰 삭제
    response.cookies.set('likegame-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    })

    return response

  } catch (error) {
    console.error('로그아웃 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 