import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';

export async function GET() {
  try {
    console.log('Token validation API called');
    
    const user = await getCurrentUser();
    console.log('getCurrentUser result:', user ? 'User found' : 'User not found');
    
    if (!user) {
      console.log('Token validation failed: Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Token validation successful for user:', user.id);
    
    // 사용자 정보 반환 (비밀번호 제외)
    return NextResponse.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 