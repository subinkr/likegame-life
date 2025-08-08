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
  onLoadMore?: (scrollInfo?: { scrollTop: number; scrollHeight: number; clientHeight: number }) => void
  hasMore?: boolean
  loadingMore?: boolean
  onScroll?: (scrollTop: number) => void
}

// 미리보기 컴포넌트
const NewMessagePreview = ({ message, onScrollToBottom }: { 
  message: ChatMessage; 
  onScrollToBottom: () => void;
}) => {
  return (
    <div 
      onClick={onScrollToBottom}
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '16px',
        right: '16px',
        zIndex: 1000,
        background: 'rgba(0,255,255,0.95)',
        border: '2px solid rgba(0,255,255,0.8)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 4px 20px rgba(0,255,255,0.4)',
        backdropFilter: 'blur(10px)',
        animation: 'fadeInUp 0.2s ease-out',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0,255,255,0.98)';
        e.currentTarget.style.boxShadow = '0 6px 25px rgba(0,255,255,0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(0,255,255,0.95)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,255,255,0.4)';
      }}
    >
      <div style={{
        fontSize: '0.8rem',
        fontWeight: 600,
        color: '#000000',
        fontFamily: 'Press Start 2P, cursive',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: '1.2'
      }}>
        {message.user.name}: {message.content}
      </div>
    </div>
  );
};

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
  
  // 미리보기 관련 상태 추가
  const [newMessagePreview, setNewMessagePreview] = useState<ChatMessage | null>(null)
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false)
  const [isUserScrollingUp, setIsUserScrollingUp] = useState(false)

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

  // 스크롤 위치를 부모 컴포넌트에 전달하고 미리보기 조건 확인
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    onScroll?.(scrollTop);
    
    // 현재 스크롤 정보 저장
    const currentScrollTop = scrollTop;
    const currentScrollHeight = scrollHeight;
    
    // 맨 아래에서의 거리 계산
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // 맨 아래 10% 이내에 있으면 맨 아래로 간주
    const bottomThreshold = scrollHeight * 0.1;
    const isNearBottom = distanceFromBottom <= bottomThreshold;
    
    // 사용자가 맨 아래에서 10% 이상 올라가 있으면 미리보기 표시 대상
    const shouldShowPreview = !isNearBottom && distanceFromBottom > 0;
    
    setIsUserScrollingUp(shouldShowPreview);
    
    // 맨 아래로 스크롤했을 때 미리보기 숨김
    if (isNearBottom && showNewMessageIndicator) {
      setShowNewMessageIndicator(false);
      setNewMessagePreview(null);
    }
    
    // 스크롤이 맨 위에 있으면 자동으로 이전 메시지 불러오기
    if (scrollTop <= 10 && hasMore && !loadingMore && !isLoadingMore && !isScrollingToBottom) {
      // 현재 스크롤 정보 저장
      const scrollInfo = {
        scrollTop: currentScrollTop,
        scrollHeight: currentScrollHeight,
        clientHeight
      };
      
      setIsLoadingMore(true);
      // 현재 가장 오래된 메시지 ID 저장
      if (allMessages.length > 0) {
        setOldestMessageId(allMessages[0].id);
      }
      
      // 스크롤 정보를 onLoadMore에 전달
      onLoadMore?.(scrollInfo);
      
      // 디바운싱: 300ms 후에 다시 로딩 가능하도록 설정
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 300);
    }
  };

  // 마지막 메시지 ID가 바뀌면 새 메시지 처리
  useEffect(() => {
    if (allMessages.length > 0) {
      const currentLastMessageId = allMessages[allMessages.length - 1]?.id;
      
      // 마지막 메시지 ID가 바뀌었으면 새 메시지가 추가된 것
      if (currentLastMessageId && currentLastMessageId !== lastMessageId) {
        setLastMessageId(currentLastMessageId);
        
        // 사용자가 맨 아래에서 10% 이상 올라가 있으면 미리보기 표시
        if (isUserScrollingUp) {
          const newMessage = allMessages[allMessages.length - 1];
          setNewMessagePreview(newMessage);
          setShowNewMessageIndicator(true);
        } else {
          // 사용자가 맨 아래 10% 이내에 있으면 바로 스크롤하고 미리보기 숨김
          setShowNewMessageIndicator(false);
          setNewMessagePreview(null);
          setIsScrollingToBottom(true);
          setTimeout(() => {
            scrollToBottom();
            setTimeout(() => {
              setIsScrollingToBottom(false);
            }, 500);
          }, 100);
        }
      }
    }
  }, [allMessages, lastMessageId, isUserScrollingUp])

  // 스크롤 위치 복원은 부모 컴포넌트에서 처리



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

      {/* New Message Preview */}
      {showNewMessageIndicator && newMessagePreview && (
        <NewMessagePreview
          message={newMessagePreview}
          onScrollToBottom={() => {
            // 미리보기를 즉시 숨김 (애니메이션 없이)
            setShowNewMessageIndicator(false);
            setNewMessagePreview(null);
            
            // 스크롤 실행
            setIsScrollingToBottom(true);
            scrollToBottom();
            setTimeout(() => {
              setIsScrollingToBottom(false);
            }, 500);
          }}
        />
      )}


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