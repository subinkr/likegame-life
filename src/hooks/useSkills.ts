import { useState, useEffect } from 'react'
import { skillsAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Skill {
  id: string
  name: string
  description: string
  acquiredDate: string
  expiryDate?: string
  parentSkillId?: string
}

export function useSkills() {
  const { user } = useAuth()
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 스킬 로드
  const loadSkills = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await skillsAPI.get()
      setSkills(response.skills)
    } catch (err: any) {
      setError(err.message || '스킬을 불러오는데 실패했습니다.')
      // API 실패 시 localStorage에서 로드
      if (typeof window !== 'undefined') {
        const savedSkills = localStorage.getItem('likegame-skills')
        if (savedSkills) {
          setSkills(JSON.parse(savedSkills))
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // 스킬 생성
  const createSkill = async (skillData: {
    name: string
    description: string
    acquiredDate: string
    expiryDate?: string
    parentSkillId?: string
  }) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await skillsAPI.create(skillData)
      setSkills(prev => [response.skill, ...prev])
      
      // localStorage 백업
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-skills', JSON.stringify([response.skill, ...skills]))
      }
    } catch (err: any) {
      setError(err.message || '스킬 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 스킬 수정
  const updateSkill = async (id: string, skillData: any) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await skillsAPI.update(id, skillData)
      setSkills(prev => prev.map(skill => 
        skill.id === id ? response.skill : skill
      ))
      
      // localStorage 백업
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-skills', JSON.stringify(skills))
      }
    } catch (err: any) {
      setError(err.message || '스킬 수정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 스킬 삭제
  const deleteSkill = async (id: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      await skillsAPI.delete(id)
      setSkills(prev => prev.filter(skill => skill.id !== id))
      
      // localStorage 백업
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-skills', JSON.stringify(skills.filter(skill => skill.id !== id)))
      }
    } catch (err: any) {
      setError(err.message || '스킬 삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    if (user) {
      loadSkills()
    }
  }, [user])

  return {
    skills,
    loading,
    error,
    loadSkills,
    createSkill,
    updateSkill,
    deleteSkill
  }
} 