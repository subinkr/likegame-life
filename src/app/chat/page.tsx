'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  participants: Array<{
    id: string;
    nickname: string;
  }>;
}

export default function ChatListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChatRooms();
    }
  }, [user]);

  const fetchChatRooms = async () => {
    try {
      const response = await fetch('/api/chat/rooms');
      if (response.ok) {
        const data = await response.json();
        setChatRooms(data);
      } else {
        console.error('Failed to fetch chat rooms:', response.status);
      }
    } catch (error) {
      console.error('채팅방 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const enterChatRoom = (roomId: string) => {
    router.push(`/chat/${roomId}`);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 130px)',
        flexDirection: 'column',
        gap: '24px',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)'
      }}>
        <div style={{ 
          fontSize: '3rem',
          animation: 'pulse 2s ease-in-out infinite',
          filter: 'drop-shadow(0 0 15px rgba(0, 255, 255, 0.8))'
        }}>💬</div>
        <div style={{ 
          color: '#00ffff', 
          fontSize: '1rem',
          fontFamily: 'Press Start 2P, cursive',
          textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
          textAlign: 'center'
        }}>
          시스템 로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: 'clamp(15px, 4vw, 20px)'
    }}>
      {/* 채팅방 목록 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(10px, 3vw, 15px)'
      }}>
        {chatRooms.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'clamp(40px, 10vw, 60px) clamp(20px, 5vw, 30px)',
            color: '#888888'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💬</div>
            <h3 style={{ 
              fontSize: 'clamp(1.1rem, 4vw, 1.3rem)',
              margin: '0 0 10px 0',
              color: '#ffffff'
            }}>
              아직 채팅방이 없습니다
            </h3>
            <p style={{ 
              fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
              margin: 0,
              lineHeight: '1.5'
            }}>
              퀘스트를 수락하거나 파티에 참가하면<br />
              자동으로 채팅방이 생성됩니다
            </p>
          </div>
        ) : (
          chatRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => enterChatRoom(room.id)}
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,255,0.08) 0%, rgba(0,255,255,0.03) 100%)',
                border: '2px solid rgba(0,255,255,0.3)',
                borderRadius: 'clamp(15px, 4vw, 18px)',
                padding: 'clamp(20px, 4vw, 25px)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0,255,255,0.1)',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,255,255,0.15) 0%, rgba(0,255,255,0.08) 100%)';
                e.currentTarget.style.borderColor = 'rgba(0,255,255,0.5)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,255,255,0.08) 0%, rgba(0,255,255,0.03) 100%)';
                e.currentTarget.style.borderColor = 'rgba(0,255,255,0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,255,255,0.1)';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'clamp(12px, 2vw, 15px)'
              }}>
                <h3 style={{
                  fontSize: 'clamp(1.1rem, 4vw, 1.3rem)',
                  color: '#00ffff',
                  fontWeight: 'bold',
                  margin: 0,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textShadow: '0 0 10px rgba(0,255,255,0.5)',
                  fontFamily: 'Press Start 2P, cursive'
                }}>
                  💬 {room.name}
                </h3>
                <span style={{
                  padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 2.5vw, 16px)',
                  background: room.type === 'DIRECT' 
                    ? 'linear-gradient(135deg, rgba(255,165,0,0.3) 0%, rgba(255,165,0,0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(0,255,0,0.3) 0%, rgba(0,255,0,0.2) 100%)',
                  color: room.type === 'DIRECT' ? '#ffa500' : '#00ff00',
                  borderRadius: 'clamp(15px, 3vw, 20px)',
                  fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: room.type === 'DIRECT' 
                    ? '0 2px 8px rgba(255,165,0,0.3)'
                    : '0 2px 8px rgba(0,255,0,0.3)',
                  fontFamily: 'Press Start 2P, cursive'
                }}>
                  {room.type === 'DIRECT' ? '⚔️ 퀘스트' : '👥 파티'}
                </span>
              </div>
              
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '10px',
                padding: '10px',
                marginTop: '8px'
              }}>
                <div style={{
                  fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                  color: '#888888',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 'bold'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>👥</span>
                  <span>{room.participants.length}명 참가</span>
                </div>
              </div>
              

            </div>
          ))
        )}
      </div>
    </div>
  );
} 