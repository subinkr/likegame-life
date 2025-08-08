'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';
import { RealtimeChat } from '@/components/realtime-chat';
import type { ChatMessage } from '@/hooks/use-realtime-chat';

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  party_id?: string;
  quest_id?: string;
  participants?: Array<{
    id: string;
    nickname: string;
  }>;
}

interface Party {
  id: string;
  leader_id: string;
  name: string;
}

function ChatRoomPageContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    if (id) {
      fetchChatRoom();
      // 1초 후에 메시지 로딩 시작
      setTimeout(() => {
        fetchMessages();
      }, 1000);
    }
  }, [id]);

  const fetchChatRoom = async () => {
    try {
      const response = await apiRequest(`/chat/rooms/${id}`);
      setChatRoom(response);
      
      if (response.party_id) {
        const partyResponse = await apiRequest(`/parties/${response.party_id}`);
        setParty(partyResponse);
      }
    } catch (error) {
      console.error('Error fetching chat room:', error);
    }
  };

  const fetchMessages = async (beforeId?: string) => {
    try {
      let url = `/chat/rooms/${id}/messages?limit=20`;
      if (beforeId) {
        url += `&before=${beforeId}`;
      }
      
      const response = await apiRequest(url);
      
      const messages: ChatMessage[] = response.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        user: {
          name: msg.user?.name || 'Unknown User'
        },
        createdAt: msg.createdAt,
        systemType: msg.systemType || undefined
      }));
      
      if (beforeId) {
        // 이전 메시지들을 역순으로 정렬해서 기존 메시지 위에 추가
        const reversedMessages = messages.reverse();
        setInitialMessages(prev => [...reversedMessages, ...prev]);
      } else {
        // 초기 로딩 - 최신 메시지가 아래쪽에 오도록 (역순으로 표시)
        setInitialMessages(messages.reverse());
        
        // 초기 로딩 완료 후 최신 메시지 확인 및 스크롤
        setTimeout(() => {
          const container = document.querySelector('[data-messages-container]') as HTMLElement;
          if (container) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            const bottomThreshold = scrollHeight * 0.1;
            const isNearBottom = distanceFromBottom <= bottomThreshold;
            
            // 최신 메시지가 보이지 않으면 스크롤
            if (!isNearBottom) {
              console.log('초기 로딩 후 최신 메시지 확인 및 스크롤');
              container.scrollTop = container.scrollHeight;
            }
          }
        }, 250);
      }
      
      setHasMoreMessages(response.hasMore);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMoreMessages || initialMessages.length === 0) {
      return;
    }
    
    setLoadingMore(true);
    const oldestMessageId = initialMessages[0]?.id;
    const container = document.querySelector('[data-messages-container]') as HTMLElement;
    
    if (oldestMessageId && container) {
      // 현재 스크롤 상태 저장
      const beforeScrollHeight = container.scrollHeight;
      const beforeScrollTop = container.scrollTop;
      
      try {
        // 이전 메시지 가져오기
        await fetchMessages(oldestMessageId);
        
        // 스크롤 위치 복원 - 새로 추가된 메시지 높이만큼 보정
        requestAnimationFrame(() => {
          const afterScrollHeight = container.scrollHeight;
          const heightDifference = afterScrollHeight - beforeScrollHeight;
          
          // 이전 스크롤 위치 + 새로 추가된 높이 = 유지되어야 할 위치
          container.scrollTop = beforeScrollTop + heightDifference;
          
          console.log('무한 스크롤 완료:', {
            heightDifference,
            beforeScrollTop,
            newScrollTop: container.scrollTop
          });
        });
      } catch (error) {
        console.error('메시지 로딩 실패:', error);
      }
    } else {
      setLoadingMore(false);
    }
  };



  const handleGoBack = () => {
    router.push('/chat');
  };

  const handleLeaveRoom = async () => {
    try {
      await apiRequest(`/chat/rooms/${id}/leave`, { method: 'POST' });
      router.push('/chat');
    } catch (error) {
      console.error('Error leaving room:', error);
    }
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
          채팅방 로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
      position: 'relative'
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(0,255,255,0.05)',
        borderBottom: '2px solid rgba(0,255,255,0.3)',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 2px 10px rgba(0,255,255,0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          {/* 뒤로가기 버튼 */}
          <button
            onClick={handleGoBack}
            style={{
              background: 'rgba(0,255,255,0.2)',
              border: '2px solid rgba(0,255,255,0.5)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#00ffff',
              fontSize: '0.8rem',
              fontFamily: 'Press Start 2P, cursive',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 10px rgba(0,255,255,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,255,255,0.3)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,255,0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,255,255,0.2)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,255,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{fontSize: '1rem'}}>←</span>
            뒤로
          </button>

          {/* 채팅방 정보 */}
          <div style={{
            flex: 1,
            textAlign: 'center'
          }}>
            <div style={{
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 700,
              fontFamily: 'Press Start 2P, cursive',
              textShadow: '0 0 10px rgba(0,255,255,0.6)',
              marginBottom: '4px'
            }}>
              {chatRoom?.name || '채팅방'}
            </div>
            {party && (
              <div style={{
                color: '#00ffff',
                fontSize: '0.75rem',
                fontFamily: 'Orbitron, monospace',
                opacity: 0.8
              }}>
                파티: {party.name}
              </div>
            )}
          </div>

          {/* 나가기 버튼 */}
          <button
            onClick={handleLeaveRoom}
            style={{
              background: 'rgba(255,0,102,0.2)',
              border: '2px solid rgba(255,0,102,0.5)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#ff0066',
              fontSize: '0.8rem',
              fontFamily: 'Press Start 2P, cursive',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 10px rgba(255,0,102,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,0,102,0.3)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(255,0,102,0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,0,102,0.2)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(255,0,102,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            나가기
          </button>
        </div>
      </div>

      {/* 실시간 채팅 컴포넌트 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        <RealtimeChat
          roomName={id as string}
          username={user?.user_metadata?.nickname || user?.email?.split('@')[0] || 'Unknown'}
          participants={chatRoom?.participants || []}
          messages={initialMessages}
          onLoadMore={loadMoreMessages}
          hasMore={hasMoreMessages}
          loadingMore={loadingMore}
        />
      </div>
    </div>
  );
}

export default function ChatRoomPage() {
  return (
    <AuthGuard>
      <ChatRoomPageContent />
    </AuthGuard>
  );
}
