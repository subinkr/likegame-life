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
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      color: '#fff'
    }}>
      {/* Connection Status */}
      <div style={{
        padding: '12px 20px',
        background: isConnected 
          ? 'linear-gradient(135deg, rgba(0,255,0,0.2) 0%, rgba(0,255,0,0.1) 100%)'
          : 'linear-gradient(135deg, rgba(255,68,68,0.2) 0%, rgba(255,68,68,0.1) 100%)',
        color: isConnected ? '#00ff00' : '#ff4444',
        fontSize: '0.8rem',
        textAlign: 'center',
        fontWeight: 600,
        fontFamily: 'Press Start 2P, cursive',
        borderBottom: `2px solid ${isConnected ? 'rgba(0,255,0,0.3)' : 'rgba(255,68,68,0.3)'}`,
        textShadow: `0 0 10px ${isConnected ? 'rgba(0,255,0,0.8)' : 'rgba(255,68,68,0.8)'}`,
        boxShadow: `0 2px 8px ${isConnected ? 'rgba(0,255,0,0.2)' : 'rgba(255,68,68,0.2)'}`
      }}>
        {isConnected ? '🟢 실시간 연결됨' : '🔴 연결 중...'}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        {allMessages.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: '16px',
            color: '#888888',
            fontFamily: 'Press Start 2P, cursive',
            fontSize: '0.8rem',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '2rem',
              filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.5))'
            }}>💬</div>
            <div>아직 메시지가 없습니다</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
              첫 번째 메시지를 보내보세요!
            </div>
          </div>
        ) : (
          allMessages.map((message, index) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              isOwnMessage={message.user.name === username}
              showHeader={shouldShowHeader(message, index)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{
        padding: '20px',
        borderTop: '2px solid rgba(0,255,255,0.3)',
        background: 'linear-gradient(135deg, rgba(0,255,255,0.05) 0%, rgba(0,255,255,0.02) 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 -4px 15px rgba(0,255,255,0.1)'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="메시지를 입력하세요..."
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: '12px',
              border: '2px solid rgba(0,255,255,0.3)',
              background: 'linear-gradient(135deg, rgba(0,255,255,0.1) 0%, rgba(0,255,255,0.05) 100%)',
              color: '#fff',
              fontSize: '0.875rem',
              fontFamily: 'Press Start 2P, cursive',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,255,255,0.1)',
              backdropFilter: 'blur(10px)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(0,255,255,0.6)';
              e.target.style.boxShadow = '0 4px 15px rgba(0,255,255,0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(0,255,255,0.3)';
              e.target.style.boxShadow = '0 2px 8px rgba(0,255,255,0.1)';
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || !isConnected}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              background: inputValue.trim() && isConnected 
                ? 'linear-gradient(135deg, rgba(0,255,255,0.3) 0%, rgba(0,255,255,0.2) 100%)'
                : 'linear-gradient(135deg, rgba(128,128,128,0.2) 0%, rgba(128,128,128,0.1) 100%)',
              color: inputValue.trim() && isConnected ? '#000' : '#666',
              border: `2px solid ${inputValue.trim() && isConnected ? 'rgba(0,255,255,0.5)' : 'rgba(128,128,128,0.3)'}`,
              cursor: inputValue.trim() && isConnected ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: 600,
              fontFamily: 'Press Start 2P, cursive',
              transition: 'all 0.3s ease',
              boxShadow: inputValue.trim() && isConnected 
                ? '0 4px 15px rgba(0,255,255,0.3)'
                : '0 2px 8px rgba(128,128,128,0.2)',
              textShadow: inputValue.trim() && isConnected ? '0 0 5px rgba(0,255,255,0.8)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && isConnected) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,255,255,0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim() && isConnected) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,255,255,0.3)';
              }
            }}
          >
            전송
          </button>
        </div>
      </form>
    </div>
  )
} 