import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-key'

// 환경 변수가 설정되지 않은 경우 경고
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다.')
  console.warn('실시간 채팅 기능을 사용하려면 .env.local 파일에 환경 변수를 설정해주세요.')
  console.warn('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 누락')
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 누락')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// 서버 사이드용 Supabase 클라이언트 (관리자 권한)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Realtime 채널 관리를 위한 클래스
export class RealtimeManager {
  private channels: Map<string, any> = new Map()

  // 채팅방 구독
  subscribeToChatRoom(roomId: string, onMessage: (message: any) => void, onPresenceChange?: (presence: any) => void) {
    // 환경 변수가 설정되지 않은 경우 더미 함수 실행
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('⚠️ 환경 변수가 설정되지 않아 실시간 기능이 비활성화되었습니다.')
      return
    }

    const channelKey = `chat_room_${roomId}`
    
    // 이미 구독 중인 채널이 있으면 제거
    if (this.channels.has(channelKey)) {
      this.unsubscribeFromChatRoom(roomId)
    }

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('💬 Realtime 메시지 수신:', payload)
          onMessage(payload.new)
        }
      )
      .on(
        'presence',
        {
          event: 'sync'
        },
        () => {
          console.log('👥 Presence 동기화')
        }
      )
      .on(
        'presence',
        {
          event: 'join'
        },
        ({ key, newPresences }) => {
          console.log('👥 사용자 참가:', key, newPresences)
          onPresenceChange?.({ type: 'join', key, presences: newPresences })
        }
      )
      .on(
        'presence',
        {
          event: 'leave'
        },
        ({ key, leftPresences }) => {
          console.log('👥 사용자 퇴장:', key, leftPresences)
          onPresenceChange?.({ type: 'leave', key, presences: leftPresences })
        }
      )

    // 채널 구독
    channel.subscribe((status) => {
      console.log('📡 Realtime 채널 상태:', status)
    })

    this.channels.set(channelKey, channel)
    return channel
  }

  // 채팅방 구독 해제
  unsubscribeFromChatRoom(roomId: string) {
    const channelKey = `chat_room_${roomId}`
    const channel = this.channels.get(channelKey)
    
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(channelKey)
      console.log('📡 채팅방 구독 해제:', roomId)
    }
  }

  // 사용자 Presence 설정
  async setPresence(roomId: string, userId: string, userData: any) {
    const channelKey = `chat_room_${roomId}`
    const channel = this.channels.get(channelKey)
    
    if (channel) {
      const presence = await channel.track({
        user_id: userId,
        user_nickname: userData.nickname,
        online_at: new Date().toISOString()
      })
      console.log('👤 Presence 설정:', presence)
    }
  }

  // 모든 채널 구독 해제
  unsubscribeAll() {
    for (const [key, channel] of this.channels.entries()) {
      supabase.removeChannel(channel)
      console.log('📡 채널 구독 해제:', key)
    }
    this.channels.clear()
  }
}

export const realtimeManager = new RealtimeManager() 