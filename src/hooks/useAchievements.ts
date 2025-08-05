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
  const [optimisticUpdates, setOptimisticUpdates] = useState<Set<string>>(new Set())

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
        // 랭크 기반 칭호 업데이트 실패 (무시됨)
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

  // 뱃지 토글 - 즉시 UI 업데이트 + 백그라운드 서버 동기화
  const toggleBadge = async (badgeId: string) => {
    if (!user) return

    // 이미 처리 중인 뱃지인지 확인
    if (optimisticUpdates.has(badgeId)) {
      return
    }

    // 현재 뱃지 상태 확인
    const currentBadge = badges.find(b => b.id === badgeId)
    if (!currentBadge) return

    // 즉시 UI 업데이트 (Optimistic Update)
    setOptimisticUpdates(prev => new Set(prev).add(badgeId))
    
    const newAchieved = !currentBadge.achieved
    const newAchievedDate = newAchieved ? new Date().toISOString() : undefined

    setBadges(prev => prev.map(badge => 
      badge.id === badgeId 
        ? { 
            ...badge, 
            achieved: newAchieved, 
            achievedDate: newAchievedDate 
          }
        : badge
    ))

    // 칭호 상태도 즉시 업데이트
    setTitles(prev => prev.map(title => {
      const requiredBadgeNames = title.requiredBadges || []
      const updatedBadgeNames = badges.map(b => 
        b.id === badgeId ? { ...b, achieved: newAchieved } : b
      ).filter(b => b.achieved).map(b => b.name)
      
      const shouldHaveTitle = requiredBadgeNames.length > 0 && 
        requiredBadgeNames.every(badgeName => updatedBadgeNames.includes(badgeName))
      
      if (shouldHaveTitle && !title.achieved) {
        return { ...title, achieved: true, achievedDate: new Date().toISOString() }
      } else if (!shouldHaveTitle && title.achieved) {
        // 뱃지 조건을 만족하지 않으면 칭호 비활성화 및 선택 해제
        return { ...title, achieved: false, selected: false, achievedDate: undefined }
      }
      return title
    }))

    // 백그라운드에서 서버 동기화
    try {
      const response = await badgesAPI.toggle(badgeId)
      
      // 서버 응답으로 상태 동기화 (에러가 없었다면)
      setBadges(prev => prev.map(badge => 
        badge.id === badgeId 
          ? { ...badge, achieved: response.userBadge.achieved, achievedDate: response.userBadge.achievedDate }
          : badge
      ))

      // localStorage 백업
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-badges', JSON.stringify(badges))
        localStorage.setItem('likegame-titles', JSON.stringify(titles))
      }
    } catch (err: any) {
      // 서버 에러 시 원래 상태로 되돌리기
      setBadges(prev => prev.map(badge => 
        badge.id === badgeId 
          ? { ...badge, achieved: currentBadge.achieved, achievedDate: currentBadge.achievedDate }
          : badge
      ))
      
      // 칭호 상태도 원래대로 되돌리기
      await loadTitles()
      
      setError(err.message || '뱃지 토글에 실패했습니다.')
    } finally {
      // 처리 완료 표시 제거
      setOptimisticUpdates(prev => {
        const newSet = new Set(prev)
        newSet.delete(badgeId)
        return newSet
      })
    }
  }

  // 칭호 선택 - 즉시 UI 업데이트 + 백그라운드 서버 동기화
  const selectTitle = async (titleId: string) => {
    if (!user) return

    // 이미 처리 중인 칭호인지 확인
    if (optimisticUpdates.has(titleId)) {
      return
    }

    // 현재 칭호 상태 확인
    const currentTitle = titles.find(t => t.id === titleId)
    if (!currentTitle) return

    // 즉시 UI 업데이트 (Optimistic Update)
    setOptimisticUpdates(prev => new Set(prev).add(titleId))
    
    const newSelected = !currentTitle.selected

    setTitles(prev => prev.map(title => 
      title.id === titleId 
        ? { ...title, selected: newSelected }
        : { ...title, selected: false } // 다른 칭호는 선택 해제
    ))

    // 백그라운드에서 서버 동기화
    try {
      const response = await titlesAPI.select(titleId)
      
      // 서버 응답으로 상태 동기화 (에러가 없었다면)
      setTitles(prev => prev.map(title => 
        title.id === titleId 
          ? { ...title, selected: response.userTitle?.selected ?? newSelected }
          : { ...title, selected: false }
      ))

      // localStorage 백업
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-titles', JSON.stringify(titles))
      }
    } catch (err: any) {
      // 서버 에러 시 원래 상태로 되돌리기
      setTitles(prev => prev.map(title => 
        title.id === titleId 
          ? { ...title, selected: currentTitle.selected }
          : title
      ))
      
      setError(err.message || '칭호 선택에 실패했습니다.')
    } finally {
      // 처리 완료 표시 제거
      setOptimisticUpdates(prev => {
        const newSet = new Set(prev)
        newSet.delete(titleId)
        return newSet
      })
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
    selectTitle,
    optimisticUpdates
  }
} 