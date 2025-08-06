import { useState, useEffect } from 'react'
import { badgesAPI, titlesAPI, statsAPI } from '@/lib/api'
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
  required_badges: string[] // snake_case로 수정
  achieved: boolean
  selected: boolean
  achieved_date?: string
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
      setBadges(response.badges || response)
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
      // 랭크 기반 칭호 업데이트를 위한 API 호출은 일시적으로 제거
      // try {
      //   await statsAPI.get()
      // } catch (err) {
      //   // 랭크 기반 칭호 업데이트 실패 (무시됨)
      // }

      const response = await titlesAPI.get()
      const titlesData = response.titles || response
      
      // 비활성화된 칭호의 선택 상태를 자동으로 해제
      const updatedTitles = titlesData.map((title: Title) => {
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

    // 뱃지 토글 시작

    // 즉시 UI 업데이트 (Optimistic Update)
    setOptimisticUpdates(prev => new Set(prev).add(badgeId))
    
    const newAchieved = !currentBadge.achieved
    const newAchievedDate = newAchieved ? new Date().toISOString() : undefined

    // 뱃지와 칭호 상태를 동시에 업데이트
    setBadges(prev => {
      const updatedBadges = prev.map(badge => 
        badge.id === badgeId 
          ? { 
              ...badge, 
              achieved: newAchieved, 
              achievedDate: newAchievedDate 
            }
          : badge
      )

      // 뱃지 상태 업데이트

      // 업데이트된 뱃지 상태로 칭호 상태도 업데이트
      setTitles(prevTitles => {
        const updatedTitles = prevTitles.map(title => {
          const requiredBadgeNames = title.required_badges || []
          
          // 칭호 조건 확인
          
          const hasRequiredBadges = requiredBadgeNames.length > 0 && 
            requiredBadgeNames.every(badgeName => {
              const badge = updatedBadges.find(b => b.name === badgeName)
              const found = badge && badge.achieved
              // 뱃지 조건 확인
              return found
            })
          
          const shouldHaveTitle = requiredBadgeNames.length === 0 || hasRequiredBadges
          
          // 칭호 활성화 결과
          
          if (shouldHaveTitle && !title.achieved) {
            // 칭호 자동 활성화
            return { 
              ...title, 
              achieved: true, 
              achieved_date: new Date().toISOString() 
            }
          } else if (!shouldHaveTitle && title.achieved) {
            // 칭호 자동 비활성화
            // 뱃지 조건을 만족하지 않으면 칭호 비활성화 및 선택 해제
            return { 
              ...title, 
              achieved: false, 
              selected: false, 
              achieved_date: undefined 
            }
          }
          return title
        })

        // 칭호 상태 업데이트 완료
        return updatedTitles
      })

      return updatedBadges
    })

    // 처리 완료 표시 제거
    setOptimisticUpdates(prev => {
      const newSet = new Set(prev)
      newSet.delete(badgeId)
      return newSet
    })

    // 백그라운드에서 서버 동기화 (에러 무시)
    try {
      const response = await badgesAPI.toggle(badgeId)
      
      // 서버 응답의 updatedTitles 정보로 칭호 상태 업데이트
      if (response.updatedTitles && response.updatedTitles.length > 0) {
        setTitles(prev => prev.map(title => {
          const updatedTitle = response.updatedTitles.find((ut: any) => ut.id === title.id)
          if (updatedTitle) {
            return {
              ...title,
              achieved: updatedTitle.achieved,
              achieved_date: updatedTitle.achieved_date,
              selected: updatedTitle.achieved ? title.selected : false
            }
          }
          return title
        }))
      }
      
      // localStorage 백업
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-badges', JSON.stringify(badges))
        localStorage.setItem('likegame-titles', JSON.stringify(titles))
      }
    } catch (err: any) {
      // 서버 에러는 무시하고 UI 상태 유지
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

  // 데이터 로드 후 디버깅
  useEffect(() => {
    // 데이터 로드 완료
  }, [badges, titles])

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