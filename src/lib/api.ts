const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// 쿠키 설정 함수
export const setCookie = (name: string, value: string | null, expires: Date) => {
  if (typeof document !== 'undefined') {
    if (value) {
      document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; secure; samesite=lax`
    } else {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
    }
  }
}

// 쿠키 읽기 함수
export const getCookie = (name: string): string | null => {
  if (typeof document !== 'undefined') {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
  }
  return null
}

// 쿠키 삭제 함수
export const deleteCookie = (name: string) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
  }
}

// 토큰 관리
export const getToken = (): string | null => {
  return getCookie('likegame-token')
}

export const setToken = (token: string): void => {
  setCookie('likegame-token', token, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7일간 유효
}

export const removeToken = (): void => {
  deleteCookie('likegame-token')
}

// API 요청 헬퍼
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  // credentials: 'include'로 쿠키 자동 전송
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    // 401 에러는 AuthContext에서 처리하므로 여기서는 무시
    if (response.status === 401) {
      throw new Error('인증이 필요합니다.')
    }
    
    // 401이 아닌 다른 에러들 처리
    let errorMessage = 'API 요청에 실패했습니다.'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch (e) {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

// 인증 API
export const authAPI = {
  register: async (data: { email: string; password: string; nickname?: string }) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  login: async (data: { email: string; password: string }) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// 스탯 API
export const statsAPI = {
  get: async (month?: string) => {
    const params = month ? `?month=${month}` : ''
    return apiRequest(`/stats${params}`)
  },

  update: async (data: { strength: number; agility: number; wisdom: number; month?: string }) => {
    return apiRequest('/stats', {
      method: 'POST',
      body: JSON.stringify(data),
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

  toggle: async (badgeId: string) => {
    return apiRequest(`/badges/${badgeId}`, {
      method: 'POST',
    })
  },
}

// 칭호 API
export const titlesAPI = {
  get: async () => {
    return apiRequest('/titles')
  },

  select: async (titleId: string) => {
    return apiRequest(`/titles/${titleId}/select`, {
      method: 'POST',
    })
  },
}

// 퀘스트 API
export const questsAPI = {
  get: async () => {
    return apiRequest('/quests')
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

  complete: async (questId: string) => {
    return apiRequest(`/quests/${questId}/complete`, {
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
}

// 지혜 API
export const wisdomAPI = {
  get: async () => {
    return apiRequest('/wisdom')
  },

  create: async (data: {
    title: string
    quote: string
    impression: string
  }) => {
    return apiRequest('/wisdom', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
} 