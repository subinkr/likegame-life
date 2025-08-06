'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/auth'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (userData: { email: string; password: string }) => Promise<void>
  logout: () => void
  signUp: (userData: { email: string; password: string; nickname?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 현재 세션 확인
    const getSession = async () => {
      try {
        console.log('🔍 Checking session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          setUser(null)
        } else if (session?.user) {
          console.log('✅ User found:', session.user.email)
          setUser(session.user)
        } else {
          console.log('❌ No user found')
          setUser(null)
        }
      } catch (error) {
        console.error('Auth error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email)
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // 로그인 함수
  const login = async (userData: { email: string; password: string }) => {
    try {
      console.log('🔐 Attempting login for:', userData.email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password,
      })

      if (error) {
        console.error('Login error:', error)
        throw new Error(error.message)
      }

      if (data.user) {
        console.log('✅ Login successful:', data.user.email)
        setUser(data.user)
      }
    } catch (error: any) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // 회원가입 함수
  const signUp = async (userData: { email: string; password: string; nickname?: string }) => {
    try {
      console.log('📝 Attempting signup for:', userData.email)
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            nickname: userData.nickname || userData.email.split('@')[0]
          }
        }
      })

      if (error) {
        console.error('Signup error:', error)
        throw new Error(error.message)
      }

      if (data.user) {
        console.log('✅ Signup successful:', data.user.email)
        setUser(data.user)
      }
    } catch (error: any) {
      console.error('Signup failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log('🚪 Logging out...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
      }
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signUp }}>
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