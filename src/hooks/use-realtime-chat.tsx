import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
  isSystemMessage?: boolean
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

  useEffect(() => {
    // 가장 기본적인 구독: 모든 INSERT 이벤트 수신
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
        // 필터링 제거 - 모든 INSERT 이벤트 수신
      }, (payload) => {
        const newMessage = payload.new as any
        if (!newMessage) {
          return
        }

        // 채팅방 ID가 일치하는 경우에만 처리
        if (newMessage.chat_room_id === roomName) {
          // user_id를 사용하여 참가자 목록에서 닉네임을 찾음
          const participant = participants.find(p => p.id === newMessage.user_id)
          const messageUsername = participant?.nickname || 'Unknown User'
          
          const chatMessage: ChatMessage = {
            id: newMessage.id,
            content: newMessage.content,
            user: {
              name: messageUsername
            },
            createdAt: newMessage.created_at,
            isSystemMessage: newMessage.is_system_message || false,
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
  }, [roomName, username, onMessage])

  return {
    messages,
    sendMessage,
    isConnected
  }
} 