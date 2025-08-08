import { useEffect, useRef, useState, useCallback } from 'react'
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

// 새 메시지 미리보기 컴포넌트
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
  const loadTriggerRef = useRef<HTMLDivElement>(null)
  const [showHeaders, setShowHeaders] = useState(true)
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)
  const [isScrollingToBottom, setIsScrollingToBottom] = useState(false)
  const [isInitialScroll, setIsInitialScroll] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  
  // 새 메시지 미리보기 상태
  const [newMessagePreview, setNewMessagePreview] = useState<ChatMessage | null>(null)
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false)
  const [isUserScrollingUp, setIsUserScrollingUp] = useState(false)

  const { messages, sendMessage, isConnected } = useRealtimeChat({
    roomName,
    username,
    participants,
    onMessage
  })

  // 초기 메시지와 실시간 메시지 합치기 (중복 제거)
  const allMessages = [...initialMessages, ...messages].filter((message, index, array) => 
    array.findIndex(m => m.id === message.id) === index
  )

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    onScroll?.(scrollTop);
    
    // 맨 아래에서의 거리 계산
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // 맨 아래 10% 이내에 있으면 맨 아래로 간주
    const bottomThreshold = scrollHeight * 0.1;
    const isNearBottom = distanceFromBottom <= bottomThreshold;
    
    // 사용자가 맨 아래에서 벗어나 있는지 확인
    setIsUserScrollingUp(!isNearBottom);
    
    // 맨 아래로 스크롤했을 때 미리보기 숨김
    if (isNearBottom && showNewMessageIndicator) {
      setShowNewMessageIndicator(false);
      setNewMessagePreview(null);
    }
  }, [onScroll, showNewMessageIndicator]);

  // 무한 스크롤 - Intersection Observer (1초 지연)
  useEffect(() => {
    const loadTrigger = loadTriggerRef.current;
    const container = messagesContainerRef.current;
    
    if (!loadTrigger || !container || !hasMore || loadingMore) return;

    let isInitialized = false;
    let initializationTimer: NodeJS.Timeout;

    // 1초 후에 Intersection Observer 활성화
    initializationTimer = setTimeout(() => {
      isInitialized = true;
      setIsInitializing(false);
      console.log('무한 스크롤 활성화됨 (1초 후)');
    }, 1000);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loadingMore && isInitialized) {
            console.log('무한 스크롤 트리거됨');
            onLoadMore?.();
          }
        });
      },
      {
        root: container,
        rootMargin: '100px 0px', // 위쪽으로 100px 여유 공간
        threshold: 0.1
      }
    );

    observer.observe(loadTrigger);

    return () => {
      clearTimeout(initializationTimer);
      observer.disconnect();
    };
  }, [hasMore, loadingMore, onLoadMore]);

  // 초기 로딩 시 최신 메시지 확인 후 자동 스크롤
  useEffect(() => {
    if (allMessages.length > 0 && !lastMessageId) {
      // 메시지 렌더링 완료 후 최신 메시지 확인
      setTimeout(() => {
        // 최신 메시지가 보이는지 확인
        const container = messagesContainerRef.current;
        if (container) {
          const { scrollTop, scrollHeight, clientHeight } = container;
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
          
          // 맨 아래에서 10% 이내에 있으면 최신 메시지가 보이는 상태
          const bottomThreshold = scrollHeight * 0.1;
          const isNearBottom = distanceFromBottom <= bottomThreshold;
          
          // 최신 메시지가 보이지 않으면 스크롤
          if (!isNearBottom) {
            console.log('최신 메시지 확인 후 자동 스크롤');
            setIsInitialScroll(true);
            scrollToBottom();
            setTimeout(() => {
              setIsInitialScroll(false);
            }, 1000);
          }
        }
      }, 150);
    }
  }, [allMessages.length, lastMessageId, scrollToBottom]);

  // 컴포넌트 마운트 후 최신 메시지 확인
  useEffect(() => {
    if (allMessages.length > 0) {
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          const { scrollTop, scrollHeight, clientHeight } = container;
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
          const bottomThreshold = scrollHeight * 0.1;
          const isNearBottom = distanceFromBottom <= bottomThreshold;
          
          if (!isNearBottom) {
            console.log('컴포넌트 마운트 후 최신 메시지 확인 및 스크롤');
            setIsInitialScroll(true);
            scrollToBottom();
            setTimeout(() => {
              setIsInitialScroll(false);
            }, 1000);
          }
        }
      }, 300);
    }
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 새 메시지 처리
  useEffect(() => {
    if (allMessages.length > 0) {
      const currentLastMessageId = allMessages[allMessages.length - 1]?.id;
      
      if (currentLastMessageId && currentLastMessageId !== lastMessageId) {
        setLastMessageId(currentLastMessageId);
        
        // 사용자가 맨 아래에서 벗어나 있으면 미리보기 표시
        if (isUserScrollingUp) {
          const newMessage = allMessages[allMessages.length - 1];
          setNewMessagePreview(newMessage);
          setShowNewMessageIndicator(true);
        } else {
          // 맨 아래에 있으면 자동 스크롤
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
  }, [allMessages, lastMessageId, isUserScrollingUp, scrollToBottom]);

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
      {/* 연결 상태 */}
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
        {(loadingMore || isInitialScroll || isInitializing) && (
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
              {isInitializing ? '초기화 중...' : isInitialScroll ? '최신 메시지로 이동 중...' : '이전 메시지 불러오는 중...'}
            </div>
        )}
      </div>

      {/* 새 메시지 미리보기 */}
      {showNewMessageIndicator && newMessagePreview && (
        <NewMessagePreview
          message={newMessagePreview}
          onScrollToBottom={() => {
            setShowNewMessageIndicator(false);
            setNewMessagePreview(null);
            setIsScrollingToBottom(true);
            scrollToBottom();
            setTimeout(() => {
              setIsScrollingToBottom(false);
            }, 500);
          }}
        />
      )}

      {/* 메시지 영역 */}
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
        {/* 무한 스크롤 트리거 (맨 위) */}
        {hasMore && (
          <div 
            ref={loadTriggerRef}
            style={{
              height: '1px',
              width: '100%',
              background: 'transparent'
            }}
          />
        )}

        {/* 로딩 인디케이터 */}
        {loadingMore && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            gap: '8px',
            color: '#00ffff',
            fontSize: '0.7rem',
            fontFamily: 'Press Start 2P, cursive'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              border: '2px solid rgba(0,255,255,0.3)',
              borderTop: '2px solid #00ffff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            이전 메시지 불러오는 중...
          </div>
        )}

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

      {/* 입력 폼 */}
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