import { useEffect, useRef, useState } from 'react'
import { useRealtimeChat, type ChatMessage } from '@/hooks/use-realtime-chat'
import { ChatMessageItem } from './chat-message'

interface RealtimeChatProps {
  roomName: string
  username: string
  onMessage?: (messages: ChatMessage[]) => void
  messages?: ChatMessage[]
}

export const RealtimeChat = ({ 
  roomName, 
  username, 
  onMessage, 
  messages: initialMessages = [] 
}: RealtimeChatProps) => {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showHeaders, setShowHeaders] = useState(true)

  const { messages, sendMessage, isConnected } = useRealtimeChat({
    roomName,
    username,
    onMessage
  })

  // Combine initial messages with realtime messages
  const allMessages = [...initialMessages, ...messages]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [allMessages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    await sendMessage(inputValue)
    setInputValue('')
  }

  const shouldShowHeader = (message: ChatMessage, index: number) => {
    if (!showHeaders) return false
    if (index === 0) return true
    
    const prevMessage = allMessages[index - 1]
    return prevMessage.user.name !== message.user.name
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#1a1a1a',
      color: '#fff'
    }}>
      {/* Connection Status */}
      <div style={{
        padding: '8px 16px',
        backgroundColor: isConnected ? '#00ff00' : '#ff0000',
        color: '#000',
        fontSize: '0.75rem',
        textAlign: 'center',
        fontWeight: 600,
        fontFamily: 'Press Start 2P, cursive'
      }}>
        {isConnected ? '실시간 연결됨' : '연결 중...'}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {allMessages.map((message, index) => (
          <ChatMessageItem
            key={message.id}
            message={message}
            isOwnMessage={message.user.name === username}
            showHeader={shouldShowHeader(message, index)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{
        padding: '16px',
        borderTop: '1px solid #333',
        backgroundColor: '#1a1a1a'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="메시지를 입력하세요..."
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #333',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              fontSize: '0.875rem',
              fontFamily: 'Press Start 2P, cursive'
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || !isConnected}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: inputValue.trim() && isConnected ? '#00ffff' : '#333',
              color: inputValue.trim() && isConnected ? '#000' : '#666',
              border: 'none',
              cursor: inputValue.trim() && isConnected ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: 600,
              fontFamily: 'Press Start 2P, cursive'
            }}
          >
            전송
          </button>
        </div>
      </form>
    </div>
  )
} 