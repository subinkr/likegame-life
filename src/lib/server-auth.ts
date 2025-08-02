import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { prisma } from './prisma'
import { verifyToken } from './auth'

// 서버 사이드에서 현재 사용자 정보를 가져오는 함수
export const getCurrentUser = async () => {
  try {
    console.log('getCurrentUser: 함수 시작')
    
    // 쿠키에서 토큰 확인
    const cookieStore = await cookies()
    let token = cookieStore.get('likegame-token')?.value
    console.log('getCurrentUser: 쿠키에서 토큰 확인', token ? '토큰 있음' : '토큰 없음')
    
    // 쿠키에 토큰이 없으면 Authorization 헤더에서 확인
    if (!token) {
      const headersList = await headers()
      const authHeader = headersList.get('authorization')
      console.log('getCurrentUser: Authorization 헤더 확인', authHeader ? '헤더 있음' : '헤더 없음')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
        console.log('getCurrentUser: 헤더에서 토큰 추출', token ? '토큰 있음' : '토큰 없음')
      }
    }
    
    console.log('getCurrentUser: 최종 토큰 확인', token ? '토큰 있음' : '토큰 없음')
    
    if (!token) {
      console.log('getCurrentUser: 토큰이 없음')
      return null
    }
    
    console.log('getCurrentUser: 토큰 검증 시작')
    const payload = verifyToken(token)
    if (!payload) {
      console.log('getCurrentUser: 토큰 검증 실패')
      return null
    }
    console.log('getCurrentUser: 토큰 검증 성공, userId:', payload.userId)
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })
    
    console.log('getCurrentUser: 사용자 찾음', user ? '성공' : '실패')
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
} 