'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getToken, removeToken, setToken } from '@/lib/api'
import { parseToken } from '@/lib/auth'

interface User {
  id: string
  email: string
  nickname?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, userData: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const validateToken = async () => {
      console.log('AuthContext: 토큰 검증 시작')
      
      try {
        // 서버에 토큰 검증 요청 (쿠키는 자동으로 전송됨)
        const response = await fetch('/api/auth/validate', {
          credentials: 'include'
        })
        
        console.log('AuthContext: 서버 응답 상태', response.status)
        
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          console.log('AuthContext: 토큰 검증 성공, 사용자 정보 설정됨', userData)
        } else {
          // 401 에러인 경우 로그인 페이지로 리다이렉트
          if (response.status === 401) {
            if (typeof window !== 'undefined') {
              // 이미 로그인 페이지에 있으면 리다이렉트하지 않음
              if (window.location.pathname !== '/auth/login') {
                console.log('AuthContext: 401 에러 감지, 로그인 페이지로 리다이렉트')
                window.location.href = '/auth/login'
                return
              } else {
                console.log('AuthContext: 401 에러 감지, 이미 로그인 페이지에 있음, 리다이렉트 건너뜀')
              }
            }
          }
          console.log('AuthContext: 토큰 검증 실패')
          setUser(null)
        }
      } catch (error) {
        console.error('AuthContext: 토큰 검증 중 에러', error)
        setUser(null)
      }
      setLoading(false)
    }

    validateToken()
  }, [])

  const login = (token: string, userData: User) => {
    console.log('AuthContext: 로그인 시도', { userData })
    setUser(userData)
    setLoading(false)
    console.log('AuthContext: 사용자 정보 설정됨')
    console.log('AuthContext: 로그인 완료 (토큰은 서버에서 관리)')
  }

  const logout = () => {
    setUser(null)
    removeToken()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 