import { useState, useEffect } from 'react'
import { questsAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Quest {
  id: string
  title: string
  description: string
  location: string
  reward: number
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'
  creatorId: string
  acceptedBy?: string
  createdAt: string
  creator?: {
    id: string
    email: string
    nickname?: string
  }
  acceptedByUser?: {
    id: string
    email: string
    nickname?: string
  }
}

export function useGuild() {
  const { user } = useAuth()
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 퀘스트 로드
  const loadQuests = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await questsAPI.get()
      setQuests(response.quests)
    } catch (err: any) {
      setError(err.message || '퀘스트를 불러오는데 실패했습니다.')
      // API 실패 시 localStorage에서 로드
      if (typeof window !== 'undefined') {
        const savedQuests = localStorage.getItem('likegame-guild-quests')
        if (savedQuests) {
          setQuests(JSON.parse(savedQuests))
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // 퀘스트 생성
  const createQuest = async (questData: {
    title: string
    description: string
    location: string
    reward: number
  }) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await questsAPI.create(questData)
      setQuests(prev => [response.quest, ...prev])
      
      // localStorage 백업
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-guild-quests', JSON.stringify([response.quest, ...quests]))
      }
    } catch (err: any) {
      setError(err.message || '퀘스트 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 퀘스트 수락
  const acceptQuest = async (questId: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await questsAPI.accept(questId)
      setQuests(prev => prev.map(quest => 
        quest.id === questId ? response.quest : quest
      ))
      
      // localStorage 백업
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-guild-quests', JSON.stringify(quests))
      }
    } catch (err: any) {
      setError(err.message || '퀘스트 수락에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 퀘스트 완료
  const completeQuest = async (questId: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await questsAPI.complete(questId)
      setQuests(prev => prev.map(quest => 
        quest.id === questId ? response.quest : quest
      ))
      
      // localStorage 백업
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-guild-quests', JSON.stringify(quests))
      }
    } catch (err: any) {
      setError(err.message || '퀘스트 완료에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 퀘스트 포기
  const abandonQuest = async (questId: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await questsAPI.abandon(questId)
      setQuests(prev => prev.map(quest => 
        quest.id === questId ? response.quest : quest
      ))
      
      // localStorage 백업
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-guild-quests', JSON.stringify(quests))
      }
    } catch (err: any) {
      setError(err.message || '퀘스트 포기에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 퀘스트 삭제
  const deleteQuest = async (questId: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      await questsAPI.delete(questId)
      setQuests(prev => prev.filter(quest => quest.id !== questId))
      
      // localStorage 백업
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-guild-quests', JSON.stringify(quests.filter(quest => quest.id !== questId)))
      }
    } catch (err: any) {
      setError(err.message || '퀘스트 삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    if (user) {
      loadQuests()
    }
  }, [user])

  return {
    quests,
    loading,
    error,
    loadQuests,
    createQuest,
    acceptQuest,
    completeQuest,
    abandonQuest,
    deleteQuest
  }
} 