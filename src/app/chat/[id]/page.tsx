'use client';

import { useState, useEffect } from 'react';
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
  const [showHeader, setShowHeader] = useState(false);

  useEffect(() => {
    if (id) {
      fetchChatRoom();
      fetchMessages();
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
      console.log('Fetching messages for room:', id, 'before:', beforeId);
      
      let url = `/chat/rooms/${id}/messages?limit=20`;
      if (beforeId) {
        url += `&before=${beforeId}`;
      }
      
      const response = await apiRequest(url);
      console.log('Messages API response:', response);
      
      const messages: ChatMessage[] = response.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        user: {
          name: msg.user_nickname
        },
        createdAt: msg.created_at
      }));
      
      console.log('Processed messages:', messages);
      
      if (beforeId) {
        // 이전 메시지들을 기존 메시지 위에 추가
        setInitialMessages(prev => [...messages, ...prev]);
      } else {
        // 초기 로딩 - 최신 메시지가 아래쪽에 오도록 (역순으로 표시)
        setInitialMessages(messages.reverse());
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
    console.log('loadMoreMessages called:', { loadingMore, hasMoreMessages, messageCount: initialMessages.length });
    
    if (loadingMore || !hasMoreMessages || initialMessages.length === 0) {
      console.log('loadMoreMessages blocked:', { loadingMore, hasMoreMessages, messageCount: initialMessages.length });
      return;
    }
    
    setLoadingMore(true);
    const oldestMessageId = initialMessages[0]?.id;
    console.log('Loading more messages before:', oldestMessageId);
    
    if (oldestMessageId) {
      await fetchMessages(oldestMessageId);
    } else {
      setLoadingMore(false);
    }
  };

  // 더 불러오기 버튼 클릭 처리
  const handleLoadMore = () => {
    console.log('Load more button clicked');
    if (hasMoreMessages && !loadingMore) {
      console.log('Triggering load more...');
      loadMoreMessages();
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
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100dvh',
        background: '#f8fafc',
        color: '#64748b'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>채팅방 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100dvh',
        background: '#f8fafc',
        color: '#64748b'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ fontSize: '48px' }}>💬</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>채팅방을 찾을 수 없습니다</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: '#ffffff'
    }}>
      {/* Fixed Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={handleGoBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#475569';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            ←
          </button>
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '4px'
            }}>
              {chatRoom.name}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                padding: '4px 8px',
                background: chatRoom.type === 'PARTY' ? '#dcfce7' : '#fef3c7',
                color: chatRoom.type === 'PARTY' ? '#166534' : '#92400e',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500
              }}>
                {chatRoom.type === 'PARTY' ? '👥 파티' : '⚔️ 퀘스트'}
              </span>
              {party && (
                <span style={{
                  fontSize: '12px',
                  color: '#64748b'
                }}>
                  파티: {party.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleLeaveRoom}
          style={{
            padding: '8px 16px',
            background: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ef4444';
          }}
        >
          나가기
        </button>
      </div>

      {/* Chat Component with Fixed Layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <RealtimeChat
          roomName={id as string}
          username={user?.user_metadata?.nickname || user?.email?.split('@')[0] || '나'}
          messages={initialMessages}
          onMessage={(messages) => {
            console.log('Messages updated:', messages);
          }}
                      onLoadMore={handleLoadMore}
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
