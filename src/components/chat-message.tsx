import type { ChatMessage } from '@/hooks/use-realtime-chat'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
}

const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Error formatting date:', error, dateString)
    return '--:--'
  }
}

export const ChatMessageItem = ({ message, isOwnMessage, showHeader }: ChatMessageItemProps) => {
  // 시스템 메시지인 경우 전용 디자인 적용
  if (message.systemType) {
    return (
      <div style={{
        display: 'flex',
        marginTop: '12px',
        marginBottom: '12px',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(0,255,255,0.1)',
          borderRadius: '20px',
          border: '1px solid rgba(0,255,255,0.3)',
          fontSize: '0.8rem',
          color: '#00ffff',
          fontWeight: 500,
          fontFamily: 'Press Start 2P, cursive',
          textShadow: '0 0 8px rgba(0,255,255,0.6)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(0,255,255,0.1) 0%, transparent 70%)',
            opacity: 0.5
          }} />
          <span style={{ 
            fontSize: '1rem',
            position: 'relative',
            zIndex: 1
          }}>
            {message.systemType === 'JOIN' ? '👋' : message.systemType === 'LEAVE' ? '👋' : 'ℹ️'}
          </span>
          <span style={{
            position: 'relative',
            zIndex: 1
          }}>
            {message.systemType === 'JOIN' 
              ? `${message.user.name}님이 입장했습니다`
              : message.systemType === 'LEAVE'
              ? `${message.user.name}님이 퇴장했습니다`
              : message.content
            }
          </span>
        </div>
      </div>
    )
  }

  return (
    <div 
      data-message-id={message.id}
      style={{
        display: 'flex',
        marginTop: '8px',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
      }}
    >
      <div style={{
        maxWidth: '70%',
        width: 'fit-content',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
      }}>
        {showHeader && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.7rem',
            padding: '0 4px',
            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
            flexDirection: isOwnMessage ? 'row-reverse' : 'row'
          }}>
            <span style={{ 
              fontWeight: 600, 
              color: isOwnMessage ? '#00ffff' : '#ffffff',
              fontFamily: 'Orbitron, monospace',
              textShadow: isOwnMessage ? '0 0 6px rgba(0,255,255,0.6)' : 'none'
            }}>
              {message.user.name}
            </span>
            <span style={{ 
              color: '#888', 
              fontSize: '0.75rem',
              fontFamily: 'Orbitron, monospace'
            }}>
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}
        <div style={{
          padding: '12px 16px',
          borderRadius: '18px',
          width: 'fit-content',
          background: isOwnMessage 
            ? 'linear-gradient(135deg, #00ffff 0%, #40ffff 100%)'
            : 'rgba(255,255,255,0.1)',
          color: isOwnMessage ? '#000000' : '#ffffff',
          fontSize: '0.9rem',
          lineHeight: '1.4',
          border: isOwnMessage 
            ? '1px solid rgba(0,255,255,0.3)'
            : '1px solid rgba(255,255,255,0.2)',
          boxShadow: isOwnMessage 
            ? '0 2px 8px rgba(0,255,255,0.3)'
            : '0 1px 4px rgba(0,0,0,0.2)',
          maxWidth: '100%',
          wordBreak: 'break-word',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* 배경 효과 */}
          {isOwnMessage && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 30%, rgba(0,255,255,0.2) 0%, transparent 50%)',
              opacity: 0.3
            }} />
          )}
          
          {/* 메시지 내용 */}
          <div style={{
            position: 'relative',
            zIndex: 1
          }}>
            {message.content}
          </div>
        </div>
      </div>
    </div>
  )
} 