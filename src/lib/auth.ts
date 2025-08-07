import { NextRequest } from 'next/server'
import { supabase, createServerSupabaseClient } from './supabase'

// Supabase auth를 사용한 사용자 인증 함수
export const getCurrentUserFromSupabase = async (request: NextRequest) => {
  try {
    // 1. 먼저 Bearer 토큰 확인
    const authHeader = request.headers.get('authorization')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      try {
        // Supabase에서 토큰 검증
        const { data: { user }, error } = await supabase.auth.getUser(token)
        
        if (!error && user) {
          return {
            id: user.id,
            email: user.email,
            nickname: user.user_metadata?.nickname || user.email?.split('@')[0],
            role: user.user_metadata?.role || 'user'
          }
        }
      } catch (tokenError) {
        // Token validation error
      }
    }

    // 2. 쿠키 기반 세션 확인
    const cookieHeader = request.headers.get('cookie')
    
    if (cookieHeader) {
      try {
        // 서버 사이드 Supabase 클라이언트로 세션 확인
        const serverSupabase = createServerSupabaseClient(request)
        const { data: { session }, error } = await serverSupabase.auth.getSession()
        
        if (!error && session?.user) {
          return {
            id: session.user.id,
            email: session.user.email,
            nickname: session.user.user_metadata?.nickname || session.user.email?.split('@')[0],
            role: session.user.user_metadata?.role || 'user'
          }
        }
      } catch (sessionError) {
        // Session validation error
      }
    }

    return null
  } catch (error) {
    return null
  }
} 