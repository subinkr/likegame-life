import { useEffect, useRef, useState } from 'react'
import { useRealtimeChat, type ChatMessage } from '@/hooks/use-realtime-chat'
import { ChatMessageItem } from './chat-message'

interface RealtimeChatProps {
  roomName: string
  username: string
  participants?: Array<{
    id: string;
    nickname: string;
  }>;
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
  participants = [],
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
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null)
  const [isScrollingToBottom, setIsScrollingToBottom] = useState(false)

  const { messages, sendMessage, isConnected } = useRealtimeChat({
    roomName,
    username,
    participants,
    onMessage
  })

  // Combine initial messages with realtime messages, removing duplicates
  const allMessages = [...initialMessages, ...messages].filter((message, index, array) => 
    array.findIndex(m => m.id === message.id) === index
  )
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }





  // 스크롤 위치를 부모 컴포넌트에 전달
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop } = messagesContainerRef.current;
    onScroll?.(scrollTop);
    
    // 스크롤이 맨 위에 있으면 자동으로 이전 메시지 불러오기 (맨 아래 스크롤 중이 아닐 때만)
    if (scrollTop <= 10 && hasMore && !loadingMore && !isLoadingMore && !isScrollingToBottom) {
      setIsLoadingMore(true);
      // 현재 가장 오래된 메시지 ID 저장 (기준 채팅)
      if (allMessages.length > 0) {
        setOldestMessageId(allMessages[0].id);
      }
      onLoadMore?.();
      
      // 디바운싱: 1초 후에 다시 로딩 가능하도록 설정
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 1000);
    }
  };

  // 마지막 메시지 ID가 바뀌면 맨 아래로 스크롤
  useEffect(() => {
    if (allMessages.length > 0) {
      const currentLastMessageId = allMessages[allMessages.length - 1]?.id;
      
      // 마지막 메시지 ID가 바뀌었으면 새 메시지가 추가된 것
      if (currentLastMessageId && currentLastMessageId !== lastMessageId) {
        setLastMessageId(currentLastMessageId);
        setIsScrollingToBottom(true); // 맨 아래 스크롤 시작
        // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤
        setTimeout(() => {
          scrollToBottom();
          // 스크롤 완료 후 플래그 해제
          setTimeout(() => {
            setIsScrollingToBottom(false);
          }, 500); // 스크롤 애니메이션 완료 후 해제
        }, 100);
      }
    }
  }, [allMessages, lastMessageId])

  // 이전 메시지 로드 완료 후 기준 채팅 위치로 스크롤
  useEffect(() => {
    if (!loadingMore && oldestMessageId && messagesContainerRef.current) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤
      setTimeout(() => {
        // 기준이 되었던 메시지 요소 찾기
        const targetElement = document.querySelector(`[data-message-id="${oldestMessageId}"]`);
        if (targetElement) {
          // 기준 메시지의 위치로 스크롤 (부드럽지 않게)
          targetElement.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
        setOldestMessageId(null); // 사용 후 초기화
      }, 50);
    }
  }, [loadingMore, oldestMessageId])



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
      background: 'transparent'
    }}>
      {/* Fixed Connection Status */}
      <div style={{
        padding: '8px 16px',
        background: isConnected ? 'rgba(0,255,255,0.1)' : 'rgba(255,0,102,0.1)',
        color: isConnected ? '#00ffff' : '#ff0066',
        fontSize: '0.7rem',
        textAlign: 'center',
        fontWeight: 600,
        fontFamily: 'Press Start 2P, cursive',
        borderBottom: `1px solid ${isConnected ? 'rgba(0,255,255,0.3)' : 'rgba(255,0,102,0.3)'}`,
        position: 'sticky',
        top: 0,
        zIndex: 5,
        textShadow: isConnected ? '0 0 8px rgba(0,255,255,0.6)' : '0 0 8px rgba(255,0,102,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>{isConnected ? '🟢 실시간 연결됨' : '🔴 연결 중...'}</span>
        {loadingMore && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#00ffff',
                          fontSize: '0.75rem',
            fontFamily: 'Press Start 2P, cursive'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              border: '2px solid rgba(0,255,255,0.3)',
              borderTop: '2px solid #00ffff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              boxShadow: '0 0 6px rgba(0,255,255,0.4)'
            }}></div>
            이전 메시지 불러오는 중...
          </div>
        )}
      </div>



      {/* Scrollable Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        data-messages-container
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'transparent',
          minHeight: 0,
          WebkitOverflowScrolling: 'touch',
          position: 'relative'
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
            color: '#00ffff',
            fontFamily: 'Press Start 2P, cursive'
          }}>
            <div style={{ 
              fontSize: '3rem',
              opacity: 0.7,
              filter: 'drop-shadow(0 0 10px rgba(0,255,255,0.6))'
            }}>💬</div>
            <div style={{ 
              fontSize: '0.9rem', 
              fontWeight: 600,
              textShadow: '0 0 8px rgba(0,255,255,0.6)'
            }}>아직 메시지가 없습니다</div>
            <div style={{ 
              fontSize: '0.7rem', 
              opacity: 0.7,
              fontFamily: 'Orbitron, monospace'
            }}>
              첫 번째 메시지를 보내보세요!
            </div>
          </div>
        ) : (
          <>
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
        padding: '8px 12px',
        borderTop: '1px solid rgba(0,255,255,0.2)',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        bottom: 0,
        zIndex: 5
      }}>
        <div style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="메시지를 입력하세요..."
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(0,255,255,0.3)',
              background: 'rgba(0,0,0,0.6)',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontFamily: 'Orbitron, monospace',
              transition: 'all 0.2s ease',
              outline: 'none',
              backdropFilter: 'blur(5px)',
              minWidth: 0
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#00ffff';
              e.target.style.boxShadow = '0 0 0 3px rgba(0,255,255,0.2)';
              e.target.style.background = 'rgba(0,0,0,0.8)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(0,255,255,0.3)';
              e.target.style.boxShadow = 'none';
              e.target.style.background = 'rgba(0,0,0,0.6)';
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || !isConnected}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: inputValue.trim() && isConnected 
                ? 'linear-gradient(135deg, #00ffff 0%, #40ffff 100%)'
                : 'rgba(255,255,255,0.1)',
              color: inputValue.trim() && isConnected ? '#000000' : '#666',
              border: inputValue.trim() && isConnected 
                ? '1px solid rgba(0,255,255,0.3)'
                : '1px solid rgba(255,255,255,0.2)',
              cursor: inputValue.trim() && isConnected ? 'pointer' : 'not-allowed',
              fontSize: '0.75rem',
              fontWeight: 600,
              fontFamily: 'Press Start 2P, cursive',
              transition: 'all 0.2s ease',
              textShadow: inputValue.trim() && isConnected ? '0 0 6px rgba(0,255,255,0.6)' : 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && isConnected) {
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,255,0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim() && isConnected) {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
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