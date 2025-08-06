import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSupabase } from './auth';

export async function requireAdmin(request: NextRequest) {
  const user = await getCurrentUserFromSupabase(request);
  
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }
  
  return null; // 권한 있음
}

export async function requireResourceOwner(request: NextRequest, resourceUserId: string) {
  const user = await getCurrentUserFromSupabase(request);
  
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  
  if (user.id !== resourceUserId && user.role !== 'ADMIN') {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }
  
  return null;
} 