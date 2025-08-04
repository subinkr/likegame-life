import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface ChatMessage {
  id: string;
  chatRoomId: string;
  userId: string;
  content: string;
  timestamp: string;
  user: {
    id: string;
    nickname: string;
  };
}

interface UseWebSocketOptions {
  onChatMessage?: (message: ChatMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isConnectingRef = useRef(false);
  const isDisconnectingRef = useRef(false);

  const connect = useCallback(() => {
    if (!user?.id || typeof window === 'undefined') {
      console.log('❌ 웹소켓 연결 조건 불충족:', { user: !!user?.id, window: typeof window });
      return;
    }

    // 이미 연결 중이거나 연결된 상태면 중복 연결 방지
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⚠️ 웹소켓 이미 연결됨:', { 
        isConnecting: isConnectingRef.current, 
        readyState: wsRef.current?.readyState 
      });
      return;
    }

    // 정리 중이면 연결하지 않음
    if (isDisconnectingRef.current) {
      console.log('⚠️ 웹소켓 정리 중 - 연결 대기');
      return;
    }

    console.log('🔌 웹소켓 연결 시도...');
    isConnectingRef.current = true;
    setIsConnecting(true);
    
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      console.log('🌐 웹소켓 URL:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log('⏰ 웹소켓 연결 타임아웃');
          ws.close();
          setIsConnecting(false);
          setIsConnected(false);
          isConnectingRef.current = false;
        }
      }, 5000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('🔌 웹소켓 연결 성공');
        setIsConnected(true);
        setIsConnecting(false);
        isConnectingRef.current = false;
        reconnectAttempts.current = 0;

        // 인증
        const authMessage = {
          type: 'auth',
          userId: user.id
        };
        ws.send(JSON.stringify(authMessage));
        console.log('🔐 웹소켓 인증 메시지 전송:', authMessage);

        options.onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 웹소켓 메시지 수신:', message);
          
          // 채팅 메시지인 경우 처리
          if (message.type === 'chat_message') {
            const chatMessage: ChatMessage = {
              id: message.id || Date.now().toString(),
              chatRoomId: message.chatRoomId,
              userId: message.userId,
              content: message.content,
              timestamp: message.timestamp || new Date().toISOString(),
              user: message.user
            };
            console.log('💬 채팅 메시지 처리:', chatMessage);
            options.onChatMessage?.(chatMessage);
          }
        } catch (error) {
          console.error('웹소켓 메시지 파싱 실패:', error);
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('🔌 웹소켓 연결 종료:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        isConnectingRef.current = false;
        wsRef.current = null;

        // 자동 재연결 (정상 종료가 아닌 경우에만)
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts && !isDisconnectingRef.current) {
          console.log('🔄 웹소켓 재연결 시도:', reconnectAttempts.current + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, 2000 * reconnectAttempts.current);
        }

        options.onDisconnect?.();
      };

      ws.onerror = (error) => {
        // 연결 중 에러는 무시 (onclose에서 처리됨)
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log('⚠️ 웹소켓 연결 중 에러 (무시됨)');
          return;
        }
        console.error('웹소켓 에러:', error);
      };
    } catch (error) {
      console.error('웹소켓 연결 실패:', error);
      setIsConnecting(false);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [user?.id]);

  const disconnect = useCallback(() => {
    // 재연결 타이머 정리
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // 정리 중 플래그 설정
    isDisconnectingRef.current = true;

    // 웹소켓 연결 정리
    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      
      // 연결된 상태에서만 정상 종료
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, '정상 종료');
      } else if (ws.readyState === WebSocket.CONNECTING) {
        // 연결 중이면 타임아웃 후 닫기
        setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
        }, 100);
      }
    }

    setIsConnected(false);
    setIsConnecting(false);
    isConnectingRef.current = false;
    reconnectAttempts.current = 0;
    
    // 정리 완료 후 플래그 해제
    setTimeout(() => {
      isDisconnectingRef.current = false;
    }, 100);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    // 웹소켓이 존재하고 연결된 상태인지 확인
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        console.log('✅ 웹소켓 메시지 전송 성공');
        return true;
      } catch (error) {
        console.error('❌ 웹소켓 메시지 전송 실패:', error);
        return false;
      }
    } else {
      // 웹소켓이 연결되지 않은 상태에서는 조용히 실패 처리
      return false;
    }
  }, []);

  const sendChatMessage = useCallback((chatRoomId: string, content: string) => {
    if (!user?.id) {
      console.error('❌ 사용자 정보 없음');
      return false;
    }
    
    console.log('💬 채팅 메시지 전송:', {
      chatRoomId,
      content,
      userId: user.id
    });
    
    return sendMessage({
      type: 'chat_message',
      chatRoomId,
      userId: user.id,
      content,
      user: {
        id: user.id,
        nickname: user.nickname || '익명'
      }
    });
  }, [user?.id, sendMessage]);

  const joinRoom = useCallback((roomId: string) => {
    if (!user?.id) {
      return;
    }
    
    const success = sendMessage({
      type: 'join_room',
      userId: user.id,
      chatRoomId: roomId
    });
    
    if (success) {
      console.log('👥 채팅방 참가 성공:', roomId);
    }
  }, [user?.id, sendMessage]);

  const leaveRoom = useCallback((roomId: string) => {
    if (!user?.id) {
      return;
    }
    
    const success = sendMessage({
      type: 'leave_room',
      userId: user.id,
      chatRoomId: roomId
    });
    
    if (success) {
      console.log('👋 채팅방 나가기 성공:', roomId);
    }
  }, [user?.id, sendMessage]);

  // 연결 관리
  useEffect(() => {
    console.log('🚀 웹소켓 연결 관리 시작:', { user: !!user?.id });
    
    if (user?.id) {
      // 사용자가 있으면 연결 시도
      const timer = setTimeout(() => {
        connect();
      }, 1000); // 1초 후 연결 시도
      
      return () => {
        clearTimeout(timer);
        disconnect();
      };
    } else {
      // 사용자가 없으면 연결 해제
      disconnect();
    }
  }, [user?.id, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    sendMessage,
    sendChatMessage,
    joinRoom,
    leaveRoom,
    connect,
    disconnect
  };
} 