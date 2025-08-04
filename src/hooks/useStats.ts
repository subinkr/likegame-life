import { useState, useEffect } from 'react'
import { statsAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Stats {
  strength: number
  agility: number
  wisdom: number
}

export function useStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ strength: 0, agility: 0, wisdom: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 스탯 로드
  const loadStats = async (month?: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // 메인 페이지용 스탯 API 사용 (힘: 최고 기록, 민첩: 누적 기록, 지혜: 월 합계)
      const response = await fetch(`/api/stats/main${month ? `?month=${month}` : ''}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      } else {
        // 401 에러는 AuthContext에서 처리하므로 여기서는 무시
        if (response.status === 401) {
          return
        }
        console.error('Main stats API error:', response.status, response.statusText)
        setStats({ strength: 0, agility: 0, wisdom: 0 })
      }
    } catch (err: any) {
      setError(err.message || '스탯을 불러오는데 실패했습니다.')
      // API 실패 시 localStorage에서 로드
      if (typeof window !== 'undefined') {
        const savedStats = localStorage.getItem('likegame-stats')
        if (savedStats) {
          setStats(JSON.parse(savedStats))
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // 스탯 업데이트
  const updateStats = async (newStats: Stats, month?: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // 스탯을 로컬에서만 업데이트하고 새로고침
      setStats(newStats)
      
      // localStorage에 백업 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-stats', JSON.stringify(newStats))
      }
      
      // 잠시 후 실제 스탯을 다시 로드
      setTimeout(() => {
        loadStats(month)
      }, 1000)
      
    } catch (err: any) {
      console.error('Stats update error:', err)
      setError(err.message || '스탯 업데이트에 실패했습니다.')
      // API 실패 시 로컬 상태만 업데이트
      setStats(newStats)
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-stats', JSON.stringify(newStats))
      }
    } finally {
      setLoading(false)
    }
  }

  // 현재 월 가져오기
  const getCurrentMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  // 이전 월 가져오기
  const getLastMonth = () => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
    return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
  }

  // 초기 로드
  useEffect(() => {
    if (user) {
      loadStats(getCurrentMonth())
    }
  }, [user])

  return {
    stats,
    loading,
    error,
    loadStats,
    updateStats,
    getCurrentMonth,
    getLastMonth
  }
} 