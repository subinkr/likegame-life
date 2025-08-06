'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  content: string;
  user_nickname: string;
  created_at: string;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [party, setParty] = useState<Party | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchChatRoom();
      fetchMessages();
      let cleanup: (() => void) | undefined;
      
      setupRealtimeSubscription().then((cleanupFn) => {
        cleanup = cleanupFn;
      });
      
      return () => {
        if (cleanup) {
          cleanup();
        }
      };
    }
  }, [id]);

  const setupRealtimeSubscription = async () => {
    if (!id || !user) return;

    // SSE 연결 (인증 토큰 포함)
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      return;
    }

    // EventSource는 헤더를 직접 설정할 수 없으므로 URL 파라미터로 토큰 전달
    const eventSource = new EventSource(`/api/chat/rooms/${id}/stream?token=${encodeURIComponent(token)}`);

    eventSource.onopen = () => {
      // SSE 연결 성공
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          // SSE 연결 확인됨
        } else if (data.type === 'new_message') {
          // 새 메시지를 기존 메시지 목록에 추가
          setMessages((prevMessages) => {
            // 이미 존재하는 메시지인지 확인
            const exists = prevMessages.some(msg => msg.id === data.message.id);
            if (exists) {
              return prevMessages;
            }
            
            return [...prevMessages, data.message];
          });
        }
      } catch (error) {
        // SSE 메시지 파싱 실패
      }
    };

    eventSource.onerror = (error) => {
      // SSE 연결 에러
    };

    return () => {
      eventSource.close();
    };
  };

  const fetchChatRoom = async () => {
    try {
      const response = await apiRequest(`/chat/rooms/${id}`);
      setChatRoom(response);
      
      // 파티 채팅방인 경우 파티 정보도 가져오기
      if (response.party_id) {
        const partyResponse = await apiRequest(`/parties/${response.party_id}`);
        setParty(partyResponse);
      }
    } catch (error) {
      // 채팅방 정보 로드 실패
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await apiRequest(`/chat/rooms/${id}/messages`);
      setMessages(response);
    } catch (error) {
      // 메시지 로드 실패
    } finally {
      setLoading(false);
    }
  };

  // 자동 스크롤 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 메시지가 추가될 때마다 자동 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await apiRequest(`/chat/rooms/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: newMessage
        })
      });
      
      setNewMessage('');
      // SSE로 새 메시지가 자동으로 추가됨
    } catch (error) {
      // 메시지 전송 실패
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleLeaveRoom = async () => {
    // 파티장인 경우 나가기 제한
    if (party && party.leader_id === user?.id) {
      alert('파티장은 채팅방을 나갈 수 없습니다. 파티를 해산하거나 다른 멤버에게 파티장을 넘겨주세요.');
      return;
    }

    // 퀘스트 채팅방인 경우 퀘스트 포기 확인
    if (chatRoom?.quest_id) {
      try {
        const questResponse = await apiRequest(`/quests/${chatRoom.quest_id}`);
        
        // 퀘스트 생성자인 경우
        if (questResponse.creator_id === user?.id) {
          // 완료된 퀘스트는 취소하지 않고 바로 나가기
          if (questResponse.status === 'COMPLETED') {
            const confirmMessage = '완료된 퀘스트 채팅방을 나가시겠습니까?';
            if (!confirm(confirmMessage)) {
              return;
            }
            // 바로 채팅방 나가기 (퀘스트 취소 없이)
          } else {
            const confirmMessage = '⚠️ 퀘스트 생성자가 채팅방을 나가면 퀘스트와 채팅방이 모두 삭제됩니다.\n\n정말로 나가시겠습니까?';
            if (!confirm(confirmMessage)) {
              return;
            }
            
            // 퀘스트 취소 (삭제)
            try {
              await apiRequest(`/quests/${chatRoom.quest_id}/cancel`, {
                method: 'POST'
              });
              router.push('/chat');
              return;
            } catch (error) {
              alert('퀘스트 취소에 실패했습니다.');
              return;
            }
          }
        } 
        // 퀘스트 수락자인 경우
        else if (questResponse.accepted_by_user_id === user?.id) {
          // 완료된 퀘스트는 포기하지 않고 바로 나가기
          if (questResponse.status === 'COMPLETED') {
            const confirmMessage = '완료된 퀘스트 채팅방을 나가시겠습니까?';
            if (!confirm(confirmMessage)) {
              return;
            }
            // 바로 채팅방 나가기 (퀘스트 포기 없이)
          } else {
            const confirmMessage = '⚠️ 퀘스트 채팅방을 나가면 퀘스트가 포기됩니다.\n\n정말로 퀘스트를 포기하고 나가시겠습니까?';
            if (!confirm(confirmMessage)) {
              return;
            }
            
            // 퀘스트 포기
            try {
              await apiRequest(`/quests/${chatRoom.quest_id}/abandon`, {
                method: 'POST'
              });
              router.push('/chat');
              return;
            } catch (error) {
              alert('퀘스트 포기에 실패했습니다.');
              return;
            }
          }
        }
              } catch (error) {
          // 퀘스트 정보 조회 실패
        }
    }

    // 파티 채팅방인 경우 파티에서도 나가는지 확인
    if (chatRoom?.party_id) {
      const confirmMessage = '파티 채팅방을 나가면 파티에서도 자동으로 나가게 됩니다. 정말로 나가시겠습니까?';
      if (!confirm(confirmMessage)) {
        return;
      }
    }

    try {
      await apiRequest(`/chat/rooms/${id}/leave`, {
        method: 'POST'
      });
      router.push('/chat');
    } catch (error) {
      // 퀘스트 채팅방이고 완료된 상태라면 성공으로 처리
      if (chatRoom?.quest_id) {
        try {
          const questResponse = await apiRequest(`/quests/${chatRoom.quest_id}`);
          if (questResponse.status === 'COMPLETED') {
            router.push('/chat');
            return;
          }
        } catch (questError) {
          // 퀘스트 정보 조회 실패
        }
      }
      alert('채팅방을 나가는데 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '24px',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000
      }}>
        <div style={{ 
          fontSize: '3rem',
          animation: 'pulse 2s infinite',
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
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000
    }}>
      {/* 채팅방 헤더 */}
      <div style={{
        background: 'rgba(0,255,255,0.05)',
        border: '2px solid rgba(0,255,255,0.3)',
        borderRadius: '10px',
        padding: '12px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={handleGoBack}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: 'Press Start 2P, cursive'
          }}
        >
          ← 뒤로
        </button>
        
        <div style={{
          flex: 1,
          textAlign: 'center'
        }}>
          <h2 style={{
            color: '#00ffff',
            margin: 0,
            fontSize: '1.2rem',
            fontFamily: 'Press Start 2P, cursive',
            textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
            marginBottom: '4px'
          }}>
            {chatRoom?.name || '채팅방'}
          </h2>
          <div style={{
            fontSize: '0.8rem',
            color: chatRoom?.type === 'PARTY' ? '#00ff00' : '#ffa500',
            fontWeight: 'bold',
            fontFamily: 'Press Start 2P, cursive',
            textShadow: chatRoom?.type === 'PARTY' 
              ? '0 0 5px rgba(0, 255, 0, 0.8)' 
              : '0 0 5px rgba(255, 165, 0, 0.8)'
          }}>
            {chatRoom?.type === 'PARTY' ? '파티' : '퀘스트'}
          </div>
        </div>

        <button
          onClick={handleLeaveRoom}
          disabled={!!(party && party.leader_id === user?.id)}
          style={{
            background: party && party.leader_id === user?.id 
              ? 'rgba(128,128,128,0.2)' 
              : 'rgba(255,0,0,0.2)',
            border: `2px solid ${party && party.leader_id === user?.id 
              ? 'rgba(128,128,128,0.3)' 
              : 'rgba(255,0,0,0.3)'}`,
            borderRadius: '8px',
            padding: '8px 12px',
            color: party && party.leader_id === user?.id ? '#888888' : '#ff0000',
            cursor: party && party.leader_id === user?.id ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            fontFamily: 'Press Start 2P, cursive'
          }}
        >
          {party && party.leader_id === user?.id ? '파티장' : '나가기'}
        </button>
      </div>

      {/* 메시지 목록 */}
      <div style={{
        flex: 1,
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid rgba(0,255,255,0.2)',
        borderRadius: '10px',
        padding: '12px',
        marginBottom: '8px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#888888',
            fontSize: '0.9rem',
            marginTop: '20px'
          }}>
            아직 메시지가 없습니다.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                background: 'rgba(0,255,255,0.1)',
                border: '1px solid rgba(0,255,255,0.3)',
                borderRadius: '8px',
                padding: '8px',
                maxWidth: '80%',
                alignSelf: message.user_nickname === user?.email?.split('@')[0] ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                fontSize: '0.8rem',
                color: '#00ffff',
                marginBottom: '4px',
                fontWeight: 'bold'
              }}>
                {message.user_nickname}
              </div>
              <div style={{
                color: '#ffffff',
                fontSize: '0.9rem',
                wordBreak: 'break-word'
              }}>
                {message.content}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#888888',
                marginTop: '4px',
                textAlign: 'right'
              }}>
                {new Date(message.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        {/* 자동 스크롤을 위한 타겟 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력 */}
      <form onSubmit={sendMessage} style={{
        display: 'flex',
        gap: '8px',
        minWidth: 0
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          style={{
            flex: 1,
            minWidth: 0,
            padding: '10px',
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(0,255,255,0.3)',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '0.9rem',
            fontFamily: 'Press Start 2P, cursive'
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          style={{
            padding: '8px 12px',
            width: '70px',
            minWidth: '70px',
            flexShrink: 0,
            background: newMessage.trim() ? 'rgba(0,255,255,0.2)' : 'rgba(128,128,128,0.2)',
            border: '2px solid rgba(0,255,255,0.3)',
            borderRadius: '8px',
            color: newMessage.trim() ? '#00ffff' : '#888888',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            fontFamily: 'Press Start 2P, cursive'
          }}
        >
          전송
        </button>
      </form>
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
