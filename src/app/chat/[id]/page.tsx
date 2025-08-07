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
  const [sseConnected, setSseConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (id) {
      fetchChatRoom();
      fetchMessages();
      let eventSource: EventSource | null = null;
      
      setupRealtimeSubscription().then((cleanupFn) => {
        eventSource = cleanupFn;
        eventSourceRef.current = cleanupFn;
      });
      
      return () => {
        if (eventSource) {
          eventSource.close();
          eventSourceRef.current = null;
        }
      };
    }
  }, [id]);

  const setupRealtimeSubscription = async (): Promise<EventSource | null> => {
    if (!id || !user) return null;

    // 기존 연결이 있으면 닫기
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // SSE 연결 (인증 토큰 포함)
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      console.error('No auth token available for SSE connection');
      return null;
    }

    // EventSource는 헤더를 직접 설정할 수 없으므로 URL 파라미터로 토큰 전달
    const eventSource = new EventSource(`/api/chat/rooms/${id}/stream?token=${encodeURIComponent(token)}`);

    eventSource.onopen = () => {
      console.log('SSE connection opened for room:', id);
      setSseConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE message received:', data);

        if (data.type === 'connected') {
          console.log('SSE connection confirmed for room:', id);
          setSseConnected(true);
        } else if (data.type === 'new_message') {
          console.log('New message received via SSE:', data.message);
          
          // 내가 보낸 메시지는 SSE로 받지 않음 (Optimistic Update로 이미 표시됨)
          if (data.message.user_nickname === (user.user_metadata?.nickname || user.email?.split('@')[0] || '나')) {
            console.log('Skipping my own message received via SSE');
            return;
          }
          
          // 새 메시지를 기존 메시지 목록에 추가
          setMessages((prevMessages) => {
            // ID 기반 중복 체크만 사용 (내용+시간 체크는 제거)
            const exists = prevMessages.some(msg => msg.id === data.message.id);
            
            if (exists) {
              console.log('Duplicate message detected by ID, skipping');
              return prevMessages;
            }
            
            // 시간순으로 정렬하여 추가
            const newMessages = [...prevMessages, data.message];
            newMessages.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            
            console.log('Message added to state, total messages:', newMessages.length);
            return newMessages;
          });
        }
      } catch (error) {
        console.error('SSE message parsing error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error for room:', id, error);
      setSseConnected(false);
      eventSource.close();
      eventSourceRef.current = null;
      
      // 1초 후 재연결 시도 (더 빠른 재연결)
      setTimeout(() => {
        console.log('Attempting to reconnect SSE for room:', id);
        setupRealtimeSubscription();
      }, 1000);
    };

    console.log('SSE connection setup completed for room:', id);
    return eventSource;
  };

  // SSE 연결 상태 확인 및 재연결
  const checkAndReconnectSSE = async () => {
    if (!sseConnected && eventSourceRef.current === null) {
      console.log('SSE not connected, attempting to reconnect...');
      await setupRealtimeSubscription();
    }
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

    const messageContent = newMessage.trim();
    setNewMessage('');

    console.log('Sending message:', messageContent);

    // Optimistic Update: 즉시 로컬에 메시지 추가
    const optimisticMessage = {
      id: `temp_${Date.now()}_${Math.random()}`, // 임시 ID
      content: messageContent,
      user_nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || '나',
      created_at: new Date().toISOString()
    };

    console.log('Adding optimistic message:', optimisticMessage);
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);

    try {
      const response = await apiRequest(`/chat/rooms/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: messageContent
        })
      });
      
      console.log('Message sent successfully, server response:', response);
      
      // 서버 응답으로 임시 메시지를 실제 메시지로 교체
      setMessages(prevMessages => {
        const filtered = prevMessages.filter(msg => msg.id !== optimisticMessage.id);
        const updated = [...filtered, response];
        console.log('Replaced optimistic message with server response, total messages:', updated.length);
        return updated;
      });

      // 메시지 전송 후 SSE 연결 상태 확인 및 재연결
      setTimeout(() => {
        console.log('Checking SSE connection status after message send...');
        console.log('SSE connected:', sseConnected);
        console.log('EventSource ref:', eventSourceRef.current);
        checkAndReconnectSSE();
      }, 1000);
    } catch (error) {
      console.error('Message send failed:', error);
      // 전송 실패 시 임시 메시지 제거
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== optimisticMessage.id)
      );
      // 에러 메시지 표시
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
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
    <div className="chat-page-mobile" style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      overflow: 'hidden'
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
        justifyContent: 'space-between',
        flexShrink: 0
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

      {/* 메시지 목록 - 입력 섹션과 네비게이션 바 위의 공간을 모두 차지 */}
      <div style={{
        flex: 1,
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid rgba(0,255,255,0.2)',
        borderRadius: '10px',
        padding: '12px',
        marginBottom: '140px', // 입력 섹션 + 네비게이션 바 높이만큼 여백 추가
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minHeight: 0
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

      {/* 메시지 입력 - 네비게이션 바 위에 고정 */}
      <form onSubmit={sendMessage} style={{
        position: 'fixed',
        bottom: '60px', // 네비게이션 바 위에 위치
        left: 0,
        right: 0,
        height: '60px',
        background: 'rgba(0,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderTop: '2px solid rgba(0,255,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 9999,
        padding: '0 12px',
        gap: '8px'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          style={{
            flex: 1,
            minWidth: 0,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(0,255,255,0.3)',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '0.9rem',
            fontFamily: 'Press Start 2P, cursive',
            height: '40px'
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          style={{
            padding: '8px 12px',
            width: '60px',
            minWidth: '60px',
            flexShrink: 0,
            background: newMessage.trim() ? 'rgba(0,255,255,0.2)' : 'rgba(128,128,128,0.2)',
            border: '2px solid rgba(0,255,255,0.3)',
            borderRadius: '8px',
            color: newMessage.trim() ? '#00ffff' : '#888888',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            fontFamily: 'Press Start 2P, cursive',
            height: '40px'
          }}
        >
          전송
        </button>
      </form>

      {/* 채팅방 바텀 네비게이션 바 */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'rgba(0,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderTop: '2px solid rgba(0,255,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 9999,
        padding: '0 4px'
      }}>
        {/* 뒤로가기 */}
        <button
          onClick={handleGoBack}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            flex: 1,
            minWidth: 0,
            padding: '6px 4px',
            position: 'relative',
            borderRadius: '6px',
            margin: '0 2px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#ffffff'
          }}
        >
          <div style={{
            fontSize: '1.2rem',
            marginBottom: '2px',
            opacity: 0.8
          }}>
            ←
          </div>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#ffffff',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            fontFamily: 'Press Start 2P, cursive'
          }}>
            뒤로
          </div>
        </button>

        {/* 채팅방 정보 */}
        <button
          onClick={() => alert('채팅방 정보: ' + (chatRoom?.name || '채팅방'))}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            flex: 1,
            minWidth: 0,
            padding: '6px 4px',
            position: 'relative',
            borderRadius: '6px',
            margin: '0 2px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#ffffff'
          }}
        >
          <div style={{
            fontSize: '1.2rem',
            marginBottom: '2px',
            opacity: 0.8
          }}>
            ℹ️
          </div>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#ffffff',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            fontFamily: 'Press Start 2P, cursive'
          }}>
            정보
          </div>
        </button>

        {/* 멤버 목록 */}
        <button
          onClick={() => alert('멤버 목록 기능은 준비 중입니다.')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            flex: 1,
            minWidth: 0,
            padding: '6px 4px',
            position: 'relative',
            borderRadius: '6px',
            margin: '0 2px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#ffffff'
          }}
        >
          <div style={{
            fontSize: '1.2rem',
            marginBottom: '2px',
            opacity: 0.8
          }}>
            👥
          </div>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#ffffff',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            fontFamily: 'Press Start 2P, cursive'
          }}>
            멤버
          </div>
        </button>

        {/* 나가기 */}
        <button
          onClick={handleLeaveRoom}
          disabled={!!(party && party.leader_id === user?.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            flex: 1,
            minWidth: 0,
            padding: '6px 4px',
            position: 'relative',
            borderRadius: '6px',
            margin: '0 2px',
            background: 'transparent',
            border: 'none',
            cursor: party && party.leader_id === user?.id ? 'not-allowed' : 'pointer',
            color: party && party.leader_id === user?.id ? '#888888' : '#ff0000',
            opacity: party && party.leader_id === user?.id ? 0.5 : 1
          }}
        >
          <div style={{
            fontSize: '1.2rem',
            marginBottom: '2px',
            opacity: party && party.leader_id === user?.id ? 0.5 : 0.8
          }}>
            🚪
          </div>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: party && party.leader_id === user?.id ? '#888888' : '#ff0000',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            fontFamily: 'Press Start 2P, cursive'
          }}>
            나가기
          </div>
        </button>
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
