import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버 사이드용 Supabase 클라이언트 (쿠키 지원)
const createServerSupabaseClient = (request: NextRequest) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        cookie: request.headers.get('cookie') || ''
      }
    }
  })
}

// Supabase auth를 사용한 사용자 인증 함수
export const getCurrentUserFromSupabase = async (request: NextRequest) => {
  try {
    console.log('🔍 getCurrentUserFromSupabase 시작');
    
    // 1. 먼저 Bearer 토큰 확인
    const authHeader = request.headers.get('authorization')
    console.log('🔍 Authorization 헤더:', authHeader ? '존재' : '없음');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      console.log('🔍 Bearer 토큰 확인 시도');
      
      try {
        // Supabase에서 토큰 검증
        const { data: { user }, error } = await supabase.auth.getUser(token)
        
        if (!error && user) {
          console.log('✅ Bearer 토큰으로 인증 성공:', user.email);
          return {
            id: user.id,
            email: user.email,
            nickname: user.user_metadata?.nickname || user.email?.split('@')[0],
            role: user.user_metadata?.role || 'user'
          }
        } else {
          console.log('❌ Bearer 토큰 검증 실패:', error);
        }
      } catch (tokenError) {
        console.error('❌ Token validation error:', tokenError)
      }
    }

    // 2. 쿠키 기반 세션 확인
    const cookieHeader = request.headers.get('cookie')
    console.log('🔍 Cookie 헤더:', cookieHeader ? '존재' : '없음');
    
    if (cookieHeader) {
      try {
        console.log('🔍 쿠키 기반 세션 확인 시도');
        // 서버 사이드 Supabase 클라이언트로 세션 확인
        const serverSupabase = createServerSupabaseClient(request)
        const { data: { session }, error } = await serverSupabase.auth.getSession()
        
        if (!error && session?.user) {
          console.log('✅ 쿠키 세션으로 인증 성공:', session.user.email);
          return {
            id: session.user.id,
            email: session.user.email,
            nickname: session.user.user_metadata?.nickname || session.user.email?.split('@')[0],
            role: session.user.user_metadata?.role || 'user'
          }
        } else {
          console.log('❌ 쿠키 세션 검증 실패:', error);
        }
      } catch (sessionError) {
        console.error('❌ Session validation error:', sessionError)
      }
    }

    console.log('❌ 모든 인증 방법 실패');
    return null
  } catch (error) {
    console.error('❌ Supabase auth error:', error)
    return null
  }
} 