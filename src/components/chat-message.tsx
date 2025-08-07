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
        maxWidth: '75%',
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
            fontSize: '0.75rem',
            padding: '0 12px',
            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
            flexDirection: isOwnMessage ? 'row-reverse' : 'row'
          }}>
            <span style={{ fontWeight: 600, color: '#00ffff' }}>
              {message.user.name}
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
              {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </span>
          </div>
        )}
        <div style={{
          padding: '8px 12px',
          borderRadius: '12px',
          fontSize: '0.875rem',
          width: 'fit-content',
          backgroundColor: isOwnMessage ? '#00ffff' : '#2a2a2a',
          color: isOwnMessage ? '#000' : '#fff',
          fontFamily: 'Press Start 2P, cursive',
          fontSize: '0.75rem',
          lineHeight: '1.4'
        }}>
          {message.content}
        </div>
      </div>
    </div>
  )
} 