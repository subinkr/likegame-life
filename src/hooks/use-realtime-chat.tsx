import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
}

interface UseRealtimeChatProps {
  roomName: string
  username: string
  onMessage?: (messages: ChatMessage[]) => void
}

export const useRealtimeChat = ({ roomName, username, onMessage }: UseRealtimeChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      user: {
        name: username
      },
      createdAt: new Date().toISOString()
    }

    // Optimistic update
    setMessages(prev => [...prev, newMessage])

    try {
      // Save to database
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: content.trim(),
          user_nickname: username,
          chat_room_id: roomName
        })

      if (error) {
        console.error('Error saving message:', error)
        // Remove optimistic update on error
        setMessages(prev => prev.filter(msg => msg.id !== newMessage.id))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id))
    }
  }, [roomName, username])

  useEffect(() => {
    // Subscribe to realtime changes
    const channel = supabase
      .channel(`chat:${roomName}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_room_id=eq.${roomName}`
      }, (payload) => {
        const newMessage = payload.new as any
        const chatMessage: ChatMessage = {
          id: newMessage.id,
          content: newMessage.content,
          user: {
            name: newMessage.user_nickname
          },
          createdAt: newMessage.created_at
        }

        // Don't add if it's our own message (already added optimistically)
        if (newMessage.user_nickname !== username) {
          setMessages(prev => [...prev, chatMessage])
        }

        // Call onMessage callback
        if (onMessage) {
          onMessage([...messages, chatMessage])
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomName, username, onMessage, messages])

  return {
    messages,
    sendMessage,
    isConnected
  }
} 