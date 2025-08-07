import { useEffect, useRef, useState } from 'react'
import { useRealtimeChat, type ChatMessage } from '@/hooks/use-realtime-chat'
import { ChatMessageItem } from './chat-message'

interface RealtimeChatProps {
  roomName: string
  username: string
  onMessage?: (messages: ChatMessage[]) => void
  messages?: ChatMessage[]
  onLoadMore?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  onScroll?: (scrollTop: number) => void
}

export const RealtimeChat = ({ 
  roomName, 
  username, 
  onMessage, 
  messages: initialMessages = [],
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  onScroll
}: RealtimeChatProps) => {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [showHeaders, setShowHeaders] = useState(true)

  const { messages, sendMessage, isConnected } = useRealtimeChat({
    roomName,
    username,
    onMessage
  })

  // Combine initial messages with realtime messages
  const allMessages = [...initialMessages, ...messages]
  const [lastMessageTime, setLastMessageTime] = useState<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 더 불러오기 버튼 클릭 처리
  const handleLoadMore = () => {
    console.log('Load more button clicked');
    if (hasMore && !loadingMore) {
      console.log('Triggering load more...');
      onLoadMore?.();
    }
  };

  // 스크롤 위치를 부모 컴포넌트에 전달
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop } = messagesContainerRef.current;
    onScroll?.(scrollTop);
  };

  useEffect(() => {
    // 채팅방에 처음 들어왔을 때 마지막 메시지 시간 기록
    if (allMessages.length > 0 && lastMessageTime === null) {
      const lastMessage = allMessages[allMessages.length - 1];
              if (lastMessage && lastMessage.createdAt) {
          setLastMessageTime(lastMessage.createdAt);
        scrollToBottom(); // 초기 로딩 시에는 맨 아래로
      }
    }
  }, [allMessages, lastMessageTime])

  useEffect(() => {
    // allMessages가 변경될 때마다 마지막 메시지 시간 비교
    if (allMessages.length > 0 && lastMessageTime !== null && !loadingMore) {
      const lastMessage = allMessages[allMessages.length - 1];
      const currentLastMessageTime = lastMessage?.createdAt;
      
      // 마지막 메시지 시간이 다르면 새 메시지가 추가된 것
      if (currentLastMessageTime && currentLastMessageTime !== lastMessageTime) {
        setLastMessageTime(currentLastMessageTime);
        scrollToBottom();
      }
    }
  }, [allMessages, lastMessageTime, loadingMore])

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
      background: '#ffffff'
    }}>
      {/* Fixed Connection Status */}
      <div style={{
        padding: '8px 16px',
        background: isConnected ? '#f0fdf4' : '#fef2f2',
        color: isConnected ? '#166534' : '#dc2626',
        fontSize: '12px',
        textAlign: 'center',
        fontWeight: 500,
        borderBottom: `1px solid ${isConnected ? '#dcfce7' : '#fecaca'}`,
        position: 'sticky',
        top: 0,
        zIndex: 5
      }}>
        {isConnected ? '🟢 실시간 연결됨' : '🔴 연결 중...'}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div style={{
          padding: '12px 16px',
          textAlign: 'center',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff'
        }}>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              padding: '8px 16px',
              backgroundColor: loadingMore ? '#94a3b8' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            {loadingMore ? '불러오는 중...' : '이전 메시지 20개 더 불러오기'}
          </button>
        </div>
      )}

      {/* Scrollable Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        data-messages-container
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: '#f8fafc',
          minHeight: 0 // Important for flex child scrolling
        }}
      >
        {allMessages.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: '16px',
            color: '#64748b'
          }}>
            <div style={{ 
              fontSize: '48px',
              opacity: 0.5
            }}>💬</div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>아직 메시지가 없습니다</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              첫 번째 메시지를 보내보세요!
            </div>
          </div>
        ) : (
          <>
            {/* 로딩 인디케이터 */}
            {loadingMore && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '16px',
                color: '#64748b',
                fontSize: '14px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #e2e8f0',
                  borderTop: '2px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></div>
                이전 메시지 로딩 중...
              </div>
            )}
            
            {allMessages.map((message, index) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                isOwnMessage={message.user.name === username}
                showHeader={shouldShowHeader(message, index)}
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input Form */}
      <form onSubmit={handleSubmit} style={{
        padding: '16px',
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
        position: 'sticky',
        bottom: 0,
        zIndex: 5
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
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #d1d5db',
              background: '#ffffff',
              color: '#1f2937',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || !isConnected}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              background: inputValue.trim() && isConnected ? '#3b82f6' : '#e5e7eb',
              color: inputValue.trim() && isConnected ? '#ffffff' : '#9ca3af',
              border: 'none',
              cursor: inputValue.trim() && isConnected ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && isConnected) {
                e.currentTarget.style.background = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim() && isConnected) {
                e.currentTarget.style.background = '#3b82f6';
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