import { useState, useEffect } from 'react'
import { badgesAPI, titlesAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Badge {
  id: string
  name: string
  description: string
  rarity: string
  icon: string
  achieved: boolean
  achievedDate?: string
}

interface Title {
  id: string
  name: string
  description: string
  rarity: string
  requiredBadges: string[]
  achieved: boolean
  selected: boolean
  achievedDate?: string
}

export function useAchievements() {
  const { user } = useAuth()
  const [badges, setBadges] = useState<Badge[]>([])
  const [titles, setTitles] = useState<Title[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 뱃지 로드
  const loadBadges = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await badgesAPI.get()
      setBadges(response.badges)
    } catch (err: any) {
      setError(err.message || '뱃지를 불러오는데 실패했습니다.')
      // API 실패 시 localStorage에서 로드
      if (typeof window !== 'undefined') {
        const savedBadges = localStorage.getItem('likegame-badges')
        if (savedBadges) {
          setBadges(JSON.parse(savedBadges))
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // 칭호 로드
  const loadTitles = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // 먼저 랭크 기반 칭호 업데이트를 위한 API 호출
      try {
        await fetch('/api/stats/main', {
          credentials: 'include'
        })
      } catch (err) {
        console.log('랭크 기반 칭호 업데이트 실패 (무시됨):', err)
      }

      const response = await titlesAPI.get()
      
      // 비활성화된 칭호의 선택 상태를 자동으로 해제
      const updatedTitles = response.titles.map((title: Title) => {
        if (!title.achieved && title.selected) {
          // 비활성화된 칭호가 선택된 상태라면 선택 해제
          return { ...title, selected: false }
        }
        return title
      })
      
      setTitles(updatedTitles)
    } catch (err: any) {
      setError(err.message || '칭호를 불러오는데 실패했습니다.')
      // API 실패 시 localStorage에서 로드
      if (typeof window !== 'undefined') {
        const savedTitles = localStorage.getItem('likegame-titles')
        if (savedTitles) {
          const parsedTitles = JSON.parse(savedTitles)
          // localStorage에서도 비활성화된 칭호의 선택 상태 해제
          const updatedTitles = parsedTitles.map((title: Title) => {
            if (!title.achieved && title.selected) {
              return { ...title, selected: false }
            }
            return title
          })
          setTitles(updatedTitles)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // 뱃지 토글
  const toggleBadge = async (badgeId: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await badgesAPI.toggle(badgeId)
      
      // 뱃지 목록 업데이트
      setBadges(prev => prev.map(badge => 
        badge.id === badgeId 
          ? { ...badge, achieved: response.userBadge.achieved, achievedDate: response.userBadge.achievedDate }
          : badge
      ))

      // 뱃지 변경 후 칭호 상태도 다시 로드
      await loadTitles()

      // localStorage 백업
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-badges', JSON.stringify(badges))
        localStorage.setItem('likegame-titles', JSON.stringify(titles))
      }
    } catch (err: any) {
      setError(err.message || '뱃지 토글에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 칭호 선택
  const selectTitle = async (titleId: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await titlesAPI.select(titleId)
      
      // 칭호 목록 전체를 다시 로드 (선택 상태가 변경될 수 있으므로)
      await loadTitles()

      // localStorage 백업
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-titles', JSON.stringify(titles))
      }
    } catch (err: any) {
      setError(err.message || '칭호 선택에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    if (user) {
      loadBadges()
      loadTitles()
    }
  }, [user])

  return {
    badges,
    titles,
    loading,
    error,
    loadBadges,
    loadTitles,
    toggleBadge,
    selectTitle
  }
} 