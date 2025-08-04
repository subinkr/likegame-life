'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getToken, removeToken, setToken } from '@/lib/api'
import { parseToken } from '@/lib/auth'

interface User {
  id: string
  email: string
  nickname?: string
  role?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (userData: { email: string; password: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 토큰 검증 함수
    const validateToken = async () => {
      try {
        const response = await fetch('/api/auth/validate', {
          method: 'GET',
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else if (response.status === 401) {
          // 401 에러 처리 - 로그인 페이지가 아닐 때만 리다이렉트
          if (typeof window !== 'undefined' && 
              window.location.pathname !== '/auth/login' && 
              window.location.pathname !== '/auth/register') {
            window.location.href = '/auth/login'
          }
          setUser(null)
        } else {
          setUser(null)
        }
      } catch (error) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [])

  // 로그인 함수
  const login = async (userData: { email: string; password: string }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || '로그인에 실패했습니다.')
      }
    } catch (error: any) {
      throw error
    }
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