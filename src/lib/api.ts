import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSupabase } from './auth';
import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api' : '/api')

// API 요청 헬퍼 함수
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Supabase에서 현재 세션 가져오기
  const { data: { session } } = await supabase.auth.getSession()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  // 세션이 있으면 Authorization 헤더 추가
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API 요청에 실패했습니다.')
  }

  return response.json()
}

// 스탯 API
export const statsAPI = {
  get: async (month?: string) => {
    const params = month ? `?month=${month}` : ''
    return apiRequest(`/stats/main${params}`)
  },

  update: async (data: { strength: number; agility: number; wisdom: number; month?: string }) => {
    return apiRequest('/stats/main', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// 힘 기록 API
export const strengthAPI = {
  get: async () => {
    return apiRequest('/stats/strength')
  },

  create: async (data: { bench: number; squat: number; deadlift: number }) => {
    return apiRequest('/stats/strength', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/stats/strength/${id}`, {
      method: 'DELETE',
    })
  },
}

// 민첩 기록 API
export const agilityAPI = {
  get: async () => {
    return apiRequest('/stats/agility')
  },

  create: async (data: { distance: number }) => {
    return apiRequest('/stats/agility', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/stats/agility/${id}`, {
      method: 'DELETE',
    })
  },
}

// 스킬 API
export const skillsAPI = {
  get: async () => {
    return apiRequest('/skills')
  },

  create: async (data: {
    name: string
    description: string
    acquiredDate: string
    expiryDate?: string
    parentSkillId?: string
  }) => {
    return apiRequest('/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: any) => {
    return apiRequest(`/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/skills/${id}`, {
      method: 'DELETE',
    })
  },
}

// 뱃지 API
export const badgesAPI = {
  get: async () => {
    return apiRequest('/badges')
  },

  toggle: async (id: string) => {
    return apiRequest(`/badges/${id}`, {
      method: 'POST',
    })
  },
};

// 칭호 API
export const titlesAPI = {
  get: async () => {
    return apiRequest('/titles')
  },

  select: async (id: string) => {
    return apiRequest(`/titles/${id}/select`, {
      method: 'POST',
    })
  },
};

// 퀘스트 API
export const questsAPI = {
  get: async () => {
    return apiRequest('/quests')
  },

  getActive: async () => {
    return apiRequest('/quests/active')
  },

  create: async (data: {
    title: string
    description: string
    location: string
    reward: number
  }) => {
    return apiRequest('/quests', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: any) => {
    return apiRequest(`/quests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/quests/${id}`, {
      method: 'DELETE',
    })
  },

  accept: async (questId: string) => {
    return apiRequest(`/quests/${questId}/accept`, {
      method: 'POST',
    })
  },

  cancel: async (questId: string) => {
    return apiRequest(`/quests/${questId}/cancel`, {
      method: 'POST',
    })
  },

  complete: async (questId: string) => {
    return apiRequest(`/quests/${questId}/complete`, {
      method: 'POST',
    })
  },

  reject: async (questId: string) => {
    return apiRequest(`/quests/${questId}/reject`, {
      method: 'POST',
    })
  },

  abandon: async (questId: string) => {
    return apiRequest(`/quests/${questId}/abandon`, {
      method: 'POST',
    })
  },
}

// 파티 API
export const partiesAPI = {
  get: async () => {
    return apiRequest('/parties')
  },

  create: async (data: {
    name: string
    description: string
    maxMembers: number
  }) => {
    return apiRequest('/parties', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  join: async (partyId: string) => {
    return apiRequest(`/parties/${partyId}/join`, {
      method: 'POST',
    })
  },

  leave: async (partyId: string) => {
    return apiRequest(`/parties/${partyId}/leave`, {
      method: 'POST',
    })
  },

  kick: async (partyId: string, memberId: string) => {
    return apiRequest(`/parties/${partyId}/kick`, {
      method: 'POST',
      body: JSON.stringify({ memberId, confirmed: true }),
    })
  },

  disband: async (partyId: string) => {
    return apiRequest(`/parties/${partyId}/disband`, {
      method: 'POST',
      body: JSON.stringify({ confirmed: true }),
    })
  },
}

// 지혜 API
export const wisdomAPI = {
  get: async (page = 1, limit = 10) => {
    return apiRequest(`/wisdom?page=${page}&limit=${limit}`)
  },

  create: async (data: {
    bookId: string
    quote: string
    impression: string
    date?: string
  }) => {
    return apiRequest('/wisdom', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  delete: async (noteId: string) => {
    return apiRequest(`/wisdom/${noteId}`, {
      method: 'DELETE',
    })
  },
}

// 책 API
export const booksAPI = {
  get: async () => {
    return apiRequest('/books')
  },

  create: async (data: {
    title: string
    author: string
  }) => {
    return apiRequest('/books', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: any) => {
    return apiRequest(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/books/${id}`, {
      method: 'DELETE',
    })
  },
}

// 채팅 API
export const chatAPI = {
  getRooms: async () => {
    return apiRequest('/chat/rooms')
  },

  getRoom: async (roomId: string) => {
    return apiRequest(`/chat/rooms/${roomId}`)
  },

  getMessages: async (roomId: string) => {
    return apiRequest(`/chat/rooms/${roomId}/messages`)
  },

  leaveRoom: async (roomId: string) => {
    return apiRequest(`/chat/rooms/${roomId}/leave`, {
      method: 'POST',
    })
  },

  sendMessage: async (roomId: string, message: string) => {
    return apiRequest(`/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
  },

  getRoomByQuest: async (questId: string) => {
    return apiRequest(`/chat/rooms/by-quest/${questId}`)
  },

  getRoomByParty: async (partyId: string) => {
    return apiRequest(`/chat/rooms/by-party/${partyId}`)
  },
}

// 어드민 API
export const adminAPI = {
  // 뱃지 관리
  getBadges: async () => {
    return apiRequest('/admin/badges')
  },

  createBadge: async (data: {
    name: string
    description: string
    rarity: string
    icon: string
  }) => {
    return apiRequest('/admin/badges', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateBadge: async (id: string, data: {
    name: string
    description: string
    rarity: string
    icon: string
  }) => {
    return apiRequest(`/admin/badges/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteBadge: async (id: string) => {
    return apiRequest(`/admin/badges/${id}`, {
      method: 'DELETE',
    })
  },

  // 칭호 관리
  getTitles: async () => {
    return apiRequest('/admin/titles')
  },

  createTitle: async (data: {
    name: string
    description: string
    rarity: string
    requiredBadges: string[]
  }) => {
    return apiRequest('/admin/titles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateTitle: async (id: string, data: {
    name: string
    description: string
    rarity: string
    requiredBadges: string[]
  }) => {
    return apiRequest(`/admin/titles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteTitle: async (id: string) => {
    return apiRequest(`/admin/titles/${id}`, {
      method: 'DELETE',
    })
  },
} 