'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
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
  
  // 무한스크롤 상태
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (user) {
      fetchChatRooms();
    }
  }, [user]);

  const fetchChatRooms = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await apiRequest(`/chat/rooms?page=${pageNum}&limit=10`);
      
      if (append) {
        setChatRooms(prev => [...prev, ...(response.rooms || [])]);
      } else {
        setChatRooms(response.rooms || []);
      }
      
      setHasMore(response.pagination?.hasNextPage || false);
      setPage(pageNum);
    } catch (error) {
      if (!append) {
        setChatRooms([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 무한스크롤을 위한 Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, loadingMore, page]);

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchChatRooms(page + 1, true);
    }
  };

  const enterChatRoom = (roomId: string) => {
    router.push(`/chat/${roomId}`);
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '24px',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        zIndex: 1000
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
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      minHeight: 'calc(100dvh - 120px)',
      height: '100%',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)'
    }}>
      {/* 스크롤 가능한 메인 콘텐츠 영역 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        flex: 1,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>

      {/* 헤더 */}
      <div style={{
        padding: '0 8px'
      }}>

      </div>

      {/* 채팅방 목록 */}
      <div style={{
        padding: '0 8px'
      }}>
        {chatRooms.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 200px)',
            flexDirection: 'column',
            gap: '24px'
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
              lineHeight: '1.5',
              fontFamily: 'Orbitron, monospace'
            }}>
              퀘스트를 수락하거나 파티에 참가하면<br />
              자동으로 채팅방이 생성됩니다
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            
            {chatRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => enterChatRoom(room.id)}
                style={{
                  padding: '12px',
                  background: 'rgba(0,255,255,0.1)',
                  border: '1px solid rgba(0,255,255,0.3)',
                  borderRadius: '8px',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,255,255,0.15)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,255,0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,255,255,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    fontFamily: 'Press Start 2P, cursive'
                  }}>
                    {room.name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: room.type === 'PARTY' 
                      ? 'rgba(0,255,0,0.2)' 
                      : 'rgba(255,165,0,0.2)',
                    color: room.type === 'PARTY' ? '#00ff00' : '#ffa500',
                    fontFamily: 'Press Start 2P, cursive',
                    fontWeight: 600,
                    border: '1px solid ' + (room.type === 'PARTY' ? 'rgba(0,255,0,0.3)' : 'rgba(255,165,0,0.3)')
                  }}>
                    {room.type === 'PARTY' ? '👥 파티' : '📜 퀘스트'}
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  padding: '8px',
                }}>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: '#888888',
                    fontFamily: 'Orbitron, monospace'
                  }}>
                    <span>👥 {room.participants.length}명</span>
                    <div style={{
                      display: 'flex',
                      gap: '3px',
                      flexWrap: 'wrap'
                    }}>
                      {room.participants.slice(0, 2).map((participant) => (
                        <span
                          key={participant.id}
                          style={{
                            padding: '3px 6px',
                            background: 'rgba(0,255,255,0.2)',
                            color: '#00ffff',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontFamily: 'Press Start 2P, cursive',
                            border: '1px solid rgba(0,255,255,0.3)'
                          }}
                        >
                          {participant.nickname}
                        </span>
                      ))}
                      {room.participants.length > 2 && (
                        <span style={{
                          padding: '3px 6px',
                          background: 'rgba(255,255,255,0.1)',
                          color: '#888',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'Press Start 2P, cursive'
                        }}>
                          +{room.participants.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* 무한스크롤 센티널 */}
        {(hasMore || loadingMore) && (
          <div id="scroll-sentinel" style={{
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '16px'
          }}>
            {loadingMore && (
              <div style={{
                color: '#00ffff',
                fontSize: '0.75rem',
                fontFamily: 'Orbitron, monospace'
              }}>
                로딩 중...
              </div>
            )}
          </div>
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