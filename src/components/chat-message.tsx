import type { ChatMessage } from '@/hooks/use-realtime-chat'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
}

export const ChatMessageItem = ({ message, isOwnMessage, showHeader }: ChatMessageItemProps) => {
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
              {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
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