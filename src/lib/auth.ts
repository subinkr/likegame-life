import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET;

export interface JWTPayload {
  userId: string
  email: string
  nickname?: string
  role?: string
  exp?: number
}

export const generateToken = (payload: JWTPayload): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다. 프로덕션 환경에서 반드시 설정해야 합니다.');
  }
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '7d',
    issuer: 'likegame-life',
    audience: 'likegame-users'
  })
}

// 클라이언트 사이드에서는 토큰을 파싱만 하고, 실제 검증은 서버에서 수행
export const parseToken = (token: string): JWTPayload | null => {
  try {
    if (!token || token.split('.').length !== 3) {
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
      return null
    }
    
    const payload = JSON.parse(jsonPayload) as JWTPayload
    
    // 만료 시간 확인
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null
    }
    
    return payload
  } catch (error) {
    return null
  }
}

// 서버 사이드에서만 사용하는 검증 함수
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    if (!JWT_SECRET) {
      return null
    }
    
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload
    return payload
  } catch (error) {
    return null
  }
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
} 