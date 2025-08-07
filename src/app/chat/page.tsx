'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  participants: Array<{
    id: string;
    nickname: string;
  }>;
}

function ChatListPageContent() {
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
      const response = await apiRequest('/chat/rooms');
      setChatRooms(response);
    } catch (error) {
      setChatRooms([]);
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
        minHeight: '100vh',
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
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* 스크롤 가능한 메인 콘텐츠 영역 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* 채팅방 목록 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {chatRooms.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
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
                아직 채팅방이 없습니다
              </div>
              <div style={{
                color: '#888888',
                fontSize: '0.8rem',
                textAlign: 'center',
                lineHeight: '1.5'
              }}>
                퀘스트를 수락하거나 파티에 참가하면<br />
                자동으로 채팅방이 생성됩니다
              </div>
            </div>
          ) : (
            chatRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => enterChatRoom(room.id)}
                style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(0,255,255,0.08) 0%, rgba(0,255,255,0.03) 100%)',
                  border: '2px solid rgba(0,255,255,0.3)',
                  borderRadius: '15px',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,255,255,0.2)';
                  e.currentTarget.style.borderColor = 'rgba(0,255,255,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,255,255,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(0,255,255,0.3)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '15px'
                }}>
                  <h3 style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold', 
                    color: '#00ffff',
                    margin: 0,
                    textShadow: '0 0 10px rgba(0,255,255,0.5)',
                    fontFamily: 'Press Start 2P, cursive'
                  }}>
                    {room.name}
                  </h3>
                  <span style={{
                    padding: '6px 12px',
                    background: room.type === 'PARTY' 
                      ? 'linear-gradient(135deg, rgba(0,255,0,0.3) 0%, rgba(0,255,0,0.2) 100%)'
                      : 'linear-gradient(135deg, rgba(255,165,0,0.3) 0%, rgba(255,165,0,0.2) 100%)',
                    color: room.type === 'PARTY' ? '#00ff00' : '#ffa500',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    boxShadow: room.type === 'PARTY' 
                      ? '0 2px 8px rgba(0,255,0,0.3)'
                      : '0 2px 8px rgba(255,165,0,0.3)',
                    fontFamily: 'Press Start 2P, cursive'
                  }}>
                    {room.type === 'PARTY' ? '👥 파티' : '⚔️ 퀘스트'}
                  </span>
                </div>
                
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: '12px'
                }}>
                  <p style={{ 
                    margin: '0', 
                    color: '#888888', 
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    👥 {room.participants.length}명 참가
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatListPage() {
  return (
    <AuthGuard>
      <ChatListPageContent />
    </AuthGuard>
  );
} 