import { useState, useEffect, useCallback } from 'react'
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
        const savedMessage = await response.json()
        console.log('Message saved successfully:', savedMessage)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
    }
  }, [roomName, username])

  useEffect(() => {
    console.log('Setting up Realtime subscription for room:', roomName)
    console.log('Username:', username)
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel(`chat:${roomName}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_room_id=eq.${roomName}`
      }, (payload) => {
        console.log('🎉 REALTIME EVENT RECEIVED! 🎉')
        console.log('Payload:', payload)
        
        const newMessage = payload.new as any
        if (!newMessage) {
          console.error('❌ No new message data in payload')
          return
        }

        const chatMessage: ChatMessage = {
          id: newMessage.id,
          content: newMessage.content,
          user: {
            name: newMessage.user_nickname
          },
          createdAt: newMessage.created_at
        }

        console.log('Processed message:', chatMessage)
        console.log('Current username:', username)
        console.log('Message username:', newMessage.user_nickname)

        // Don't add if it's our own message (already added optimistically)
        if (newMessage.user_nickname !== username) {
          console.log('Adding message to state (not own message)')
          setMessages(prev => [...prev, chatMessage])
        } else {
          console.log('Skipping own message')
        }

        // Call onMessage callback
        if (onMessage) {
          onMessage([...messages, chatMessage])
        }
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      console.log('Cleaning up Realtime subscription for room:', roomName)
      supabase.removeChannel(channel)
    }
  }, [roomName, username, onMessage])

  return {
    messages,
    sendMessage,
    isConnected
  }
} 