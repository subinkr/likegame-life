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
      const response = await apiRequest(`/chat/rooms/${id}/messages`);
      const messages: ChatMessage[] = response.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        user: {
          name: msg.user_nickname
        },
        createdAt: msg.created_at
      }));
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
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 'calc(100dvh - 120px)',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        fontFamily: 'Press Start 2P, cursive'
      }}>
        로딩 중...
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
        backgroundColor: '#1a1a1a',
        color: '#fff',
        fontFamily: 'Press Start 2P, cursive'
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
      backgroundColor: '#1a1a1a'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: '#2a2a2a',
        borderBottom: '1px solid #333'
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
              color: '#00ffff',
              fontSize: '1rem',
              cursor: 'pointer',
              fontFamily: 'Press Start 2P, cursive'
            }}
          >
            ←
          </button>
          <div>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#fff',
              fontFamily: 'Press Start 2P, cursive'
            }}>
              {chatRoom.name}
            </div>
            {party && (
              <div style={{
                fontSize: '0.75rem',
                color: '#00ffff',
                fontFamily: 'Press Start 2P, cursive'
              }}>
                파티: {party.name}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleLeaveRoom}
          style={{
            padding: '8px 12px',
            backgroundColor: '#ff4444',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontFamily: 'Press Start 2P, cursive'
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
