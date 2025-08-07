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

    console.log('Sending message:', content)
    console.log('Room name:', roomName)
    console.log('Username:', username)

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      user: {
        name: username
      },
      createdAt: new Date().toISOString()
    }

    console.log('Optimistic message:', newMessage)

    // Optimistic update
    setMessages(prev => [...prev, newMessage])

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      console.log('Session:', session)
      console.log('Token available:', !!token)
      
      if (!token) {
        console.error('No auth token available')
        setMessages(prev => prev.filter(msg => msg.id !== newMessage.id))
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
        // Remove optimistic update on error
        setMessages(prev => prev.filter(msg => msg.id !== newMessage.id))
      } else {
        const savedMessage = await response.json()
        console.log('Message saved successfully:', savedMessage)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id))
    }
  }, [roomName, username])

  useEffect(() => {
    console.log('Setting up Realtime subscription for room:', roomName)
    console.log('Username:', username)
    console.log('Supabase client:', !!supabase)
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel(`chat_messages:${roomName}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_room_id=eq.${roomName}`
      }, (payload) => {
        console.log('=== REALTIME EVENT RECEIVED ===')
        console.log('Realtime payload received:', payload)
        console.log('Payload event type:', payload.eventType)
        console.log('Payload new record:', payload.new)
        console.log('Payload old record:', payload.old)
        
        const newMessage = payload.new as any
        console.log('Extracted new message:', newMessage)
        
        const chatMessage: ChatMessage = {
          id: newMessage.id,
          content: newMessage.content,
          user: {
            name: newMessage.user_nickname
          },
          createdAt: newMessage.created_at
        }

        console.log('Processed chat message:', chatMessage)
        console.log('Current username:', username)
        console.log('Message username:', newMessage.user_nickname)
        console.log('Message content:', newMessage.content)
        console.log('Message created_at:', newMessage.created_at)
        console.log('Username comparison:', newMessage.user_nickname !== username)

        // Don't add if it's our own message (already added optimistically)
        if (newMessage.user_nickname !== username) {
          console.log('Adding message to state (not own message)')
          setMessages(prev => {
            console.log('Previous messages count:', prev.length)
            const updatedMessages = [...prev, chatMessage]
            console.log('Updated messages count:', updatedMessages.length)
            return updatedMessages
          })
        } else {
          console.log('Skipping own message')
        }

        // Call onMessage callback
        if (onMessage) {
          onMessage([...messages, chatMessage])
        }
        console.log('=== END REALTIME EVENT ===')
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
        console.log('Channel name:', `chat_messages:${roomName}`)
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