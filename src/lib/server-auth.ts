import { NextRequest } from 'next/server'
import { getCurrentUserFromSupabase } from './auth'

// 서버 사이드에서 현재 사용자 정보를 가져오는 함수 (Supabase auth 사용)
export async function getCurrentUser(request: NextRequest) {
  return await getCurrentUserFromSupabase(request)
} 