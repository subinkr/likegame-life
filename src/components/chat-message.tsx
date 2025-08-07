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
      marginTop: '12px',
      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
    }}>
      <div style={{
        maxWidth: '75%',
        width: 'fit-content',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
      }}>
        {showHeader && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.75rem',
            padding: '0 16px',
            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
            flexDirection: isOwnMessage ? 'row-reverse' : 'row'
          }}>
            <span style={{ 
              fontWeight: 600, 
              color: '#00ffff',
              textShadow: '0 0 8px rgba(0,255,255,0.8)',
              fontFamily: 'Press Start 2P, cursive'
            }}>
              {message.user.name}
            </span>
            <span style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: '0.7rem',
              fontFamily: 'Press Start 2P, cursive'
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
          borderRadius: '16px',
          width: 'fit-content',
          background: isOwnMessage 
            ? 'linear-gradient(135deg, rgba(0,255,255,0.3) 0%, rgba(0,255,255,0.2) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          color: isOwnMessage ? '#000' : '#fff',
          fontFamily: 'Press Start 2P, cursive',
          fontSize: '0.8rem',
          lineHeight: '1.4',
          border: `2px solid ${isOwnMessage ? 'rgba(0,255,255,0.5)' : 'rgba(255,255,255,0.2)'}`,
          boxShadow: isOwnMessage 
            ? '0 4px 15px rgba(0,255,255,0.3)'
            : '0 2px 8px rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          textShadow: isOwnMessage ? '0 0 5px rgba(0,255,255,0.8)' : 'none'
        }}>
          {message.content}
        </div>
      </div>
    </div>
  )
} 