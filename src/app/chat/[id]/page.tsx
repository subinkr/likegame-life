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

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for room:', id);
      const response = await apiRequest(`/chat/rooms/${id}/messages`);
      console.log('Messages API response:', response);
      
      const messages: ChatMessage[] = response.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        user: {
          name: msg.user_nickname
        },
        createdAt: msg.created_at
      }));
      
      console.log('Processed initial messages:', messages);
      setInitialMessages(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
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

  if (!chatRoom) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 'calc(100dvh - 120px)',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        color: '#00ffff',
        fontFamily: 'Press Start 2P, cursive',
        textShadow: '0 0 10px rgba(0, 255, 255, 0.8)'
      }}>
        채팅방을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100dvh - 120px)',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(0,255,255,0.08) 0%, rgba(0,255,255,0.03) 100%)',
        borderBottom: '2px solid rgba(0,255,255,0.3)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 15px rgba(0,255,255,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button
            onClick={handleGoBack}
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,255,0.2) 0%, rgba(0,255,255,0.1) 100%)',
              border: '2px solid rgba(0,255,255,0.5)',
              color: '#00ffff',
              fontSize: '1.2rem',
              cursor: 'pointer',
              fontFamily: 'Press Start 2P, cursive',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,255,255,0.2)',
              textShadow: '0 0 10px rgba(0,255,255,0.8)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,255,255,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,255,255,0.2)';
            }}
          >
            ←
          </button>
          <div>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#00ffff',
              fontFamily: 'Press Start 2P, cursive',
              textShadow: '0 0 10px rgba(0,255,255,0.8)',
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
                background: chatRoom.type === 'PARTY' 
                  ? 'linear-gradient(135deg, rgba(0,255,0,0.3) 0%, rgba(0,255,0,0.2) 100%)'
                  : 'linear-gradient(135deg, rgba(255,165,0,0.3) 0%, rgba(255,165,0,0.2) 100%)',
                color: chatRoom.type === 'PARTY' ? '#00ff00' : '#ffa500',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                boxShadow: chatRoom.type === 'PARTY' 
                  ? '0 2px 8px rgba(0,255,0,0.3)'
                  : '0 2px 8px rgba(255,165,0,0.3)',
                fontFamily: 'Press Start 2P, cursive'
              }}>
                {chatRoom.type === 'PARTY' ? '👥 파티' : '⚔️ 퀘스트'}
              </span>
              {party && (
                <span style={{
                  fontSize: '0.7rem',
                  color: '#888888',
                  fontFamily: 'Press Start 2P, cursive'
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
            padding: '10px 16px',
            background: 'linear-gradient(135deg, rgba(255,68,68,0.3) 0%, rgba(255,68,68,0.2) 100%)',
            color: '#ff4444',
            border: '2px solid rgba(255,68,68,0.5)',
            borderRadius: '8px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontFamily: 'Press Start 2P, cursive',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(255,68,68,0.2)',
            textShadow: '0 0 10px rgba(255,68,68,0.8)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,68,68,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,68,68,0.2)';
          }}
        >
          나가기
        </button>
      </div>

      {/* Chat Component */}
      <div style={{ flex: 1 }}>
        <RealtimeChat
          roomName={id as string}
          username={user?.user_metadata?.nickname || user?.email?.split('@')[0] || '나'}
          messages={initialMessages}
          onMessage={(messages) => {
            console.log('Messages updated:', messages);
          }}
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
