import type { ChatMessage } from '@/hooks/use-realtime-chat'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
}

// 안전한 날짜 변환 함수
const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '--:--'
    }
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (error) {
    console.error('Error formatting date:', error, dateString)
    return '--:--'
  }
}

export const ChatMessageItem = ({ message, isOwnMessage, showHeader }: ChatMessageItemProps) => {
  // 시스템 메시지인 경우 전용 디자인 적용
  if (message.isSystemMessage) {
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
          background: '#f3f4f6',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          fontSize: '12px',
          color: '#6b7280',
          fontWeight: 500
        }}>
          <span style={{ fontSize: '14px' }}>
            {message.systemType === 'JOIN' ? '👋' : message.systemType === 'LEAVE' ? '👋' : 'ℹ️'}
          </span>
          <span>
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
    <div style={{
      display: 'flex',
      marginTop: '8px',
      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
    }}>
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
            fontSize: '12px',
            padding: '0 4px',
            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
            flexDirection: isOwnMessage ? 'row-reverse' : 'row'
          }}>
            <span style={{ 
              fontWeight: 500, 
              color: '#374151'
            }}>
              {message.user.name}
            </span>
            <span style={{ 
              color: '#9ca3af', 
              fontSize: '11px'
            }}>
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}
        <div style={{
          padding: '12px 16px',
          borderRadius: '18px',
          width: 'fit-content',
          background: isOwnMessage ? '#3b82f6' : '#ffffff',
          color: isOwnMessage ? '#ffffff' : '#1f2937',
          fontSize: '14px',
          lineHeight: '1.4',
          border: isOwnMessage ? 'none' : '1px solid #e5e7eb',
          boxShadow: isOwnMessage ? '0 1px 3px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
          maxWidth: '100%',
          wordBreak: 'break-word'
        }}>
          {message.content}
        </div>
      </div>
    </div>
  )
} 