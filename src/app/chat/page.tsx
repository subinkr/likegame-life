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
        padding: '20px', 
        textAlign: 'center',
        color: '#ffffff'
      }}>
        채팅방 목록을 불러오는 중...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: 'clamp(15px, 4vw, 20px)'
    }}>
      {/* 헤더 */}
      <div style={{
        marginBottom: 'clamp(20px, 5vw, 30px)',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 6vw, 2rem)',
          color: '#ffffff',
          fontWeight: 700,
          margin: '0 0 10px 0',
          textShadow: '0 0 10px rgba(0,255,255,0.5)',
          fontFamily: 'Press Start 2P, cursive',
          padding: '8px 16px',
          background: 'rgba(0,255,255,0.1)',
          borderRadius: '12px',
          border: '2px solid rgba(0,255,255,0.3)',
          display: 'inline-block'
        }}>
          <span style={{fontSize: 'clamp(1.6rem, 6.5vw, 2.1rem)', marginRight: '8px'}}>💬</span>
          채팅방
        </h1>
        <p style={{
          fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
          color: '#888888',
          margin: 0
        }}>
          {chatRooms.length}개의 채팅방
        </p>
      </div>

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
                background: 'rgba(0,255,255,0.1)',
                border: '2px solid rgba(0,255,255,0.3)',
                borderRadius: 'clamp(12px, 4vw, 15px)',
                padding: 'clamp(15px, 4vw, 20px)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,255,255,0.15)';
                e.currentTarget.style.borderColor = 'rgba(0,255,255,0.5)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(0,255,255,0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'clamp(8px, 2vw, 10px)'
              }}>
                <h3 style={{
                  fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                  color: '#00ffff',
                  fontWeight: 'bold',
                  margin: 0,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {room.name}
                </h3>
                <span style={{
                  padding: 'clamp(4px, 1.5vw, 6px) clamp(8px, 2.5vw, 12px)',
                  background: room.type === 'DIRECT' ? 'rgba(255,165,0,0.2)' : 'rgba(0,255,0,0.2)',
                  color: room.type === 'DIRECT' ? '#ffa500' : '#00ff00',
                  borderRadius: 'clamp(8px, 3vw, 12px)',
                  fontSize: 'clamp(0.6rem, 2.5vw, 0.7rem)',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  {room.type === 'DIRECT' ? '퀘스트' : '파티'}
                </span>
              </div>
              
              <div style={{
                fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)',
                color: '#888888',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span>👥</span>
                <span>{room.participants.length}명 참가</span>
              </div>
              
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '15px',
                transform: 'translateY(-50%)',
                fontSize: '1.2rem',
                color: 'rgba(0,255,255,0.5)'
              }}>
                →
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 