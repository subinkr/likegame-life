'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useActiveQuest } from '@/hooks/useActiveQuest';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  user: {
    id: string;
    nickname: string;
  };
}

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  participants: Array<{
    id: string;
    nickname: string;
  }>;
}

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const { messages, addMessage, loadMessages, setCurrentRoom } = useChat();
  const { hasActiveQuest, activeQuest, loading: questLoading } = useActiveQuest();
  const router = useRouter();
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // params를 unwrap
  const { id: chatRoomId } = use(params);

  // 현재 채팅방의 메시지들
  const currentMessages = messages[chatRoomId] || [];

  // 현재 채팅방이 활성 퀘스트의 채팅방인지 확인 (수락자 또는 생성자)
  const isActiveQuestChatRoom = hasActiveQuest && activeQuest?.chatRoomId === chatRoomId;

  // 웹소켓 연결
  const { isConnected, isConnecting, sendChatMessage, joinRoom, leaveRoom } = useWebSocket({
    onChatMessage: addMessage,
    onConnect: () => {
      console.log('🔌 웹소켓 연결됨');
    },
    onDisconnect: () => {
      console.log('🔌 웹소켓 연결 해제됨');
    }
  });

  // 채팅방 정보와 메시지 로드
  useEffect(() => {
    if (user) {
      setMessagesLoaded(false);
      fetchChatRoom();
      if (!messagesLoaded) {
        fetchMessages();
      }
    }
  }, [chatRoomId, user]);

  // 현재 채팅방 설정 및 참가
  useEffect(() => {
    setCurrentRoom(chatRoomId);
    
    // 웹소켓이 연결되면 채팅방 참가
    if (isConnected && chatRoomId) {
      joinRoom(chatRoomId);
    }
    
    return () => {
      setCurrentRoom(null);
      // 컴포넌트 언마운트 시에만 채팅방 나가기 (웹소켓이 연결된 상태에서만)
      if (isConnected && chatRoomId) {
        leaveRoom(chatRoomId);
      }
    };
  }, [chatRoomId, isConnected, setCurrentRoom, joinRoom, leaveRoom]);

  // 웹소켓 연결 상태 변경 시 채팅방 참가
  useEffect(() => {
    if (isConnected && chatRoomId) {
      // 실제 권한이 있는 경우에만 채팅방 참가
      joinRoom(chatRoomId);
    }
  }, [isConnected, chatRoomId, joinRoom]);

  // 스크롤을 맨 아래로
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const fetchChatRoom = async () => {
    try {
      const response = await fetch(`/api/chat/rooms/${chatRoomId}`);
      if (response.ok) {
        const data = await response.json();
        setChatRoom(data);
      } else {
        console.error('Failed to fetch chat room:', response.status);
        router.push('/chat');
      }
    } catch (error) {
      console.error('채팅방 정보 로드 실패:', error);
      router.push('/chat');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/rooms/${chatRoomId}/messages`);
      if (response.ok) {
        const data = await response.json();
        // 기존 메시지들을 ChatContext에 로드
        const chatMessages = data.map((message: any) => ({
          id: message.id,
          chatRoomId: message.chatRoomId,
          userId: message.userId,
          content: message.content,
          timestamp: message.createdAt,
          user: message.user
        }));
        loadMessages(chatRoomId, chatMessages);
        setMessagesLoaded(true);
      }
    } catch (error) {
      console.error('메시지 로드 실패:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    console.log('💬 채팅 전송 시도:', {
      content: messageContent,
      chatRoomId,
      isConnected,
      user: user?.id
    });

    // 웹소켓 연결 상태 확인
    if (!isConnected) {
      console.error('❌ 웹소켓 연결 안됨');
      alert('웹소켓 연결이 안 되어 있습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 웹소켓을 통해 메시지 전송
    const success = sendChatMessage(chatRoomId, messageContent);
    console.log('📤 메시지 전송 결과:', success);
    
    if (!success) {
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const leaveChatRoom = async () => {
    // 활성 퀘스트가 있으면 나가기 제한
    if (isActiveQuestChatRoom) {
      alert('퀘스트 진행 중에는 채팅방을 나갈 수 없습니다.\n퀘스트를 완료하거나 포기한 후 다시 시도해주세요.');
      return;
    }

    if (!confirm('정말로 이 채팅방을 나가시겠습니까?\n나가면 다시 접근할 수 없습니다.')) {
      return;
    }

    try {
      // API로 채팅방에서 나가기
      const response = await fetch(`/api/chat/rooms/${chatRoomId}/leave`, {
        method: 'POST',
      });
      
      if (response.ok) {
        router.push('/chat');
      } else {
        const error = await response.json();
        alert(error.error || '채팅방 나가기에 실패했습니다');
      }
    } catch (error) {
      console.error('채팅방 나가기 실패:', error);
      alert('채팅방 나가기에 실패했습니다');
    }
  };

  if (loading || questLoading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#ffffff'
      }}>
        {loading ? '채팅방을 불러오는 중...' : '퀘스트 정보를 확인하는 중...'}
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#ffffff'
      }}>
        채팅방을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '12px 15px',
        background: 'rgba(0,255,255,0.1)',
        borderBottom: '2px solid rgba(0,255,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minHeight: '60px'
      }}>
        <button
          onClick={() => router.push('/chat')}
          style={{
            background: 'none',
            border: 'none',
            color: '#00ffff',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '8px',
            minWidth: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ 
            fontSize: 'clamp(0.9rem, 4vw, 1.1rem)', 
            fontWeight: 'bold', 
            color: '#00ffff',
            margin: '0 0 2px 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {chatRoom.name} ({chatRoom.participants.length}명)
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              padding: '3px 6px',
              background: chatRoom.type === 'DIRECT' ? 'rgba(255,165,0,0.2)' : 'rgba(0,255,0,0.2)',
              color: chatRoom.type === 'DIRECT' ? '#ffa500' : '#00ff00',
              borderRadius: '3px',
              fontSize: 'clamp(0.6rem, 2.5vw, 0.7rem)',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}>
              {chatRoom.type === 'DIRECT' ? '퀘스트' : '파티'}
            </span>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          flexShrink: 0
        }}>
          <button
            onClick={leaveChatRoom}
            disabled={isActiveQuestChatRoom}
            style={{
              background: isActiveQuestChatRoom ? 'rgba(128,128,128,0.2)' : 'rgba(255,0,0,0.2)',
              border: isActiveQuestChatRoom ? '1px solid rgba(128,128,128,0.5)' : '1px solid rgba(255,0,0,0.5)',
              color: isActiveQuestChatRoom ? '#888888' : '#ff0000',
              borderRadius: '3px',
              padding: '3px 6px',
              fontSize: 'clamp(0.6rem, 2.5vw, 0.7rem)',
              cursor: isActiveQuestChatRoom ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              opacity: isActiveQuestChatRoom ? 0.5 : 1
            }}
          >
            {isActiveQuestChatRoom ? '나가기 불가' : '나가기'}
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'clamp(10px, 3vw, 20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {currentMessages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#888888',
            padding: '40px 20px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💬</div>
            <p style={{ fontSize: 'clamp(0.9rem, 4vw, 1rem)' }}>아직 메시지가 없습니다.</p>
            <p style={{ fontSize: 'clamp(0.7rem, 3vw, 0.8rem)', marginTop: '10px' }}>
              첫 번째 메시지를 보내보세요!
            </p>
          </div>
        ) : (
          currentMessages.map((message) => {
            // 시스템 메시지 처리
            if ('content' in message && (message.content === 'SYSTEM_JOIN' || message.content === 'SYSTEM_LEAVE')) {
              const isJoin = message.content === 'SYSTEM_JOIN';
              return (
                <div key={message.id} style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  padding: '0 10px'
                }}>
                  <div style={{
                    padding: '8px 16px',
                    background: isJoin ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                    border: isJoin ? '1px solid rgba(0,255,0,0.3)' : '1px solid rgba(255,0,0,0.3)',
                    borderRadius: '20px',
                    color: isJoin ? '#00ff00' : '#ff0000',
                    fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    maxWidth: '80%',
                    wordBreak: 'break-word'
                  }}>
                    <span style={{ marginRight: '6px' }}>
                      {isJoin ? '🎯' : '🚪'}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>
                      {message.user.nickname || '익명'}
                    </span>
                    <span style={{ marginLeft: '6px' }}>
                      {isJoin ? '님이 채팅방에 참가했습니다' : '님이 채팅방을 나갔습니다'}
                    </span>
                    <div style={{
                      fontSize: 'clamp(0.6rem, 2vw, 0.7rem)',
                      color: isJoin ? '#00cc00' : '#cc0000',
                      marginTop: '2px',
                      opacity: 0.8
                    }}>
                      {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // 입장 메시지 처리
            if ('type' in message && message.type === 'user_joined') {
              return (
                <div key={message.id} style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  padding: '0 10px'
                }}>
                  <div style={{
                    padding: '8px 16px',
                    background: 'rgba(0,255,0,0.1)',
                    border: '1px solid rgba(0,255,0,0.3)',
                    borderRadius: '20px',
                    color: '#00ff00',
                    fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    maxWidth: '80%',
                    wordBreak: 'break-word'
                  }}>
                    <span style={{ marginRight: '6px' }}>
                      🎯
                    </span>
                    <span style={{ fontWeight: 'bold' }}>
                      {message.user.nickname || '익명'}
                    </span>
                    <span style={{ marginLeft: '6px' }}>
                      님이 채팅방에 참가했습니다
                    </span>
                    <div style={{
                      fontSize: 'clamp(0.6rem, 2vw, 0.7rem)',
                      color: '#00cc00',
                      marginTop: '2px',
                      opacity: 0.8
                    }}>
                      {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // 일반 채팅 메시지 처리
            if ('content' in message && message.content !== 'SYSTEM_JOIN' && message.content !== 'SYSTEM_LEAVE') {
              const isOwnMessage = message.userId === user?.id;
              
              return (
                <div key={message.id} style={{
                  display: 'flex',
                  justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    maxWidth: 'clamp(200px, 70%, 400px)',
                    padding: 'clamp(8px, 2.5vw, 10px) clamp(12px, 3vw, 15px)',
                    borderRadius: 'clamp(10px, 3vw, 15px)',
                    background: isOwnMessage 
                      ? 'rgba(0,255,255,0.2)' 
                      : 'rgba(255,255,255,0.1)',
                    border: isOwnMessage 
                      ? '1px solid rgba(0,255,255,0.3)' 
                      : '1px solid rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    position: 'relative',
                    wordBreak: 'break-word'
                  }}>
                    {!isOwnMessage && (
                      <div style={{
                        fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)',
                        color: '#00ffff',
                        fontWeight: 'bold',
                        marginBottom: '3px'
                      }}>
                        {message.user.nickname || '익명'}
                      </div>
                    )}
                    <div style={{ 
                      fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', 
                      lineHeight: '1.4',
                      wordBreak: 'break-word'
                    }}>
                      {message.content}
                    </div>
                    <div style={{
                      fontSize: 'clamp(0.6rem, 2vw, 0.7rem)',
                      color: '#888888',
                      marginTop: '3px',
                      textAlign: isOwnMessage ? 'right' : 'left'
                    }}>
                      {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            return null; // 알 수 없는 메시지 타입
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력 */}
      <form onSubmit={sendMessage} style={{
        padding: 'clamp(10px, 3vw, 15px) clamp(12px, 4vw, 20px)',
        background: 'rgba(0,0,0,0.3)',
        borderTop: '1px solid rgba(0,255,255,0.2)',
        display: 'flex',
        gap: 'clamp(6px, 2vw, 10px)',
        alignItems: 'flex-end'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          style={{
            flex: 1,
            padding: 'clamp(10px, 3vw, 12px) clamp(12px, 3vw, 15px)',
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(0,255,255,0.3)',
            borderRadius: 'clamp(15px, 5vw, 20px)',
            color: '#ffffff',
            fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
            minHeight: '44px'
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          style={{
            padding: 'clamp(10px, 3vw, 12px) clamp(15px, 4vw, 20px)',
            background: newMessage.trim() ? 'rgba(0,255,255,0.2)' : 'rgba(255,255,255,0.1)',
            border: newMessage.trim() ? '2px solid rgba(0,255,255,0.5)' : '2px solid rgba(255,255,255,0.2)',
            color: newMessage.trim() ? '#00ffff' : '#666666',
            borderRadius: 'clamp(15px, 5vw, 20px)',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: 'clamp(0.7rem, 2.5vw, 0.9rem)',
            whiteSpace: 'nowrap',
            minHeight: '44px'
          }}
        >
          전송
        </button>
      </form>
    </div>
  );
} 