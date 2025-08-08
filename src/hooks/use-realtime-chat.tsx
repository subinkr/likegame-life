import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
  systemType?: 'JOIN' | 'LEAVE' | 'OTHER'
}

interface UseRealtimeChatProps {
  roomName: string
  username: string
  participants?: Array<{
    id: string;
    nickname: string;
  }>;
  onMessage?: (messages: ChatMessage[]) => void
}

export const useRealtimeChat = ({ roomName, username, participants = [], onMessage }: UseRealtimeChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    // Optimistic update
    const optimisticMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      user: { name: username },
      createdAt: new Date().toISOString()
    }

    setMessages(prev => [...prev, optimisticMessage])

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      if (!token) {
        console.error('No auth token available')
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
        return
      }

      // Save to database via API route
      const response = await fetch(`/api/chat/rooms/${roomName}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error saving message:', errorData)
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
      } else {
        await response.json()
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
    }
  }, [roomName, username])

  // 사용자 정보를 가져오는 함수
  const getUserInfo = useCallback(async (userId: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', userId)
        .single()
      
      if (error || !user) {
        console.error('Error fetching user info:', error)
        return 'Unknown User'
      }
      
      return user.nickname || 'Unknown User'
    } catch (error) {
      console.error('Error fetching user info:', error)
      return 'Unknown User'
    }
  }, [])

  useEffect(() => {
    // 가장 기본적인 구독: 모든 INSERT 이벤트 수신
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
        // 필터링 제거 - 모든 INSERT 이벤트 수신
      }, async (payload) => {
        const newMessage = payload.new as any
        if (!newMessage) {
          return
        }

        // 채팅방 ID가 일치하는 경우에만 처리
        if (newMessage.chat_room_id === roomName) {
          // participants 배열에서 사용자 정보 찾기
          let messageUsername = 'Unknown User'
          
          // 먼저 participants 배열에서 찾기
          const participant = participants.find(p => p.id === newMessage.user_id)
          if (participant) {
            messageUsername = participant.nickname
          } else {
            // participants에 없으면 직접 사용자 정보 조회
            messageUsername = await getUserInfo(newMessage.user_id)
          }
          
          const chatMessage: ChatMessage = {
            id: newMessage.id,
            content: newMessage.content,
            user: {
              name: messageUsername
            },
            createdAt: (() => {
              try {
                // Supabase에서 반환되는 날짜 형식 처리
                let dateValue = newMessage.created_at;
                
                // 문자열인 경우 그대로 사용, 객체인 경우 ISO 문자열로 변환
                if (typeof dateValue === 'object' && dateValue !== null) {
                  // PostgreSQL timestamp 객체인 경우
                  if (dateValue.toISOString) {
                    dateValue = dateValue.toISOString();
                  } else {
                    // 다른 객체 형식인 경우
                    dateValue = JSON.stringify(dateValue);
                  }
                }
                
                const date = new Date(dateValue);
                if (isNaN(date.getTime())) {
                  console.error('Realtime - Invalid date detected:', newMessage.created_at, 'processed as:', dateValue);
                  return new Date().toISOString();
                }
                return date.toISOString();
              } catch (error) {
                console.error('Error converting date in realtime:', error, newMessage.created_at);
                return new Date().toISOString();
              }
            })(),
            systemType: newMessage.system_type || undefined
          }

          // Don't add if it's our own message (already added optimistically)
          if (messageUsername !== username) {
            setMessages(prev => [...prev, chatMessage])
          }

          // Call onMessage callback
          if (onMessage) {
            onMessage([...messages, chatMessage])
          }
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomName, username, participants, onMessage, getUserInfo])

  return {
    messages,
    sendMessage,
    isConnected
  }
} 