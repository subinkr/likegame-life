import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { prisma } from './prisma'
import { verifyToken } from './auth'
import { NextRequest } from 'next/server'

// 서버 사이드에서 현재 사용자 정보를 가져오는 함수
export async function getCurrentUser(request: NextRequest) {
  try {
    // 쿠키에서 토큰 확인
    let token = request.cookies.get('likegame-token')?.value
    
    // Authorization 헤더에서 토큰 확인
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const headerToken = authHeader.substring(7)
      if (headerToken) {
        token = headerToken
      }
    }
    
    if (!token) {
      return null
    }
    
    // 토큰 검증
    const payload = verifyToken(token)
    if (!payload) {
      return null
    }
    
    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })
    
    return user
  } catch (error) {
    return null
  }
} 