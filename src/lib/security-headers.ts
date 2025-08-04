import { NextRequest, NextResponse } from 'next/server';

export function securityHeaders(request: NextRequest) {
  const response = NextResponse.next();
  
  // 보안 헤더 설정
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
} 