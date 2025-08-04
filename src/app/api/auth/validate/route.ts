import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 사용자 정보 반환 (비밀번호 제외)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: (user as any).role
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 