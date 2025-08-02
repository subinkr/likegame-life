import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development'

export interface JWTPayload {
  userId: string
  email: string
  nickname?: string
  exp?: number
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// 클라이언트 사이드에서는 토큰을 파싱만 하고, 실제 검증은 서버에서 수행
export const parseToken = (token: string): JWTPayload | null => {
  try {
    console.log('JWT 토큰 파싱 시도:', token ? '토큰 있음' : '토큰 없음')
    
    if (!token || token.split('.').length !== 3) {
      console.error('유효하지 않은 JWT 토큰 형식')
      return null
    }
    
    // 클라이언트 사이드에서는 토큰을 디코드만 함 (검증은 서버에서)
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    
    // Base64 디코딩
    let jsonPayload
    try {
      const decoded = atob(base64)
      jsonPayload = decodeURIComponent(decoded.split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
    } catch (decodeError) {
      console.error('Base64 디코딩 실패:', decodeError)
      return null
    }
    
    const payload = JSON.parse(jsonPayload) as JWTPayload
    
    // 만료 시간 확인
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.error('JWT 토큰이 만료됨')
      return null
    }
    
    console.log('JWT 토큰 파싱 성공:', payload)
    return payload
  } catch (error) {
    console.error('JWT 토큰 파싱 실패:', error)
    return null
  }
}

// 서버 사이드에서만 사용하는 검증 함수
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    console.log('JWT 토큰 검증 시도:', token ? '토큰 있음' : '토큰 없음')
    console.log('JWT_SECRET 확인:', JWT_SECRET ? '시크릿 있음' : '시크릿 없음')
    
    if (!JWT_SECRET) {
      console.error('JWT_SECRET이 설정되지 않음')
      return null
    }
    
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload
    console.log('JWT 토큰 검증 성공:', payload)
    return payload
  } catch (error) {
    console.error('JWT 토큰 검증 실패:', error)
    return null
  }
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
} 