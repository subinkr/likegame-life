'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

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

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  participants: Array<{
    id: string;
    nickname: string;
  }>;
}

interface ChatContextType {
  // 상태
  messages: Record<string, ChatMessage[]>;
  currentRoomId: string | null;
  
  // 액션
  setCurrentRoom: (roomId: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  loadMessages: (roomId: string, messages: ChatMessage[]) => void;
  clearMessages: (roomId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  // 현재 채팅방 설정
  const setCurrentRoom = useCallback((roomId: string | null) => {
    setCurrentRoomId(roomId);
  }, []);

  // 메시지 추가
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => {
      const existingMessages = prev[message.chatRoomId] || [];
      const updatedMessages = [...existingMessages, message];
      
      // 시간순으로 정렬
      updatedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      return {
        ...prev,
        [message.chatRoomId]: updatedMessages
      };
    });
  }, []);

  // 메시지 로드
  const loadMessages = useCallback((roomId: string, newMessages: ChatMessage[]) => {
    setMessages(prev => ({
      ...prev,
      [roomId]: newMessages
    }));
  }, []);

  // 메시지 초기화
  const clearMessages = useCallback((roomId: string) => {
    setMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[roomId];
      return newMessages;
    });
  }, []);

  const value: ChatContextType = {
    messages,
    currentRoomId,
    setCurrentRoom,
    addMessage,
    loadMessages,
    clearMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 