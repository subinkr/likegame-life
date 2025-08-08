'use client';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import AppBar from "./components/AppBar";
import BottomNavigation from "./components/BottomNavigation";
import { useEffect } from 'react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { setCurrentRoom } = useChat();
  const isAuthPage = pathname?.startsWith('/auth/');
  const isChatPage = pathname?.startsWith('/chat/');

  // 채팅 페이지에 있을 때 해당 채팅방 설정
  useEffect(() => {
    if (isChatPage && user?.id) {
      const chatRoomId = pathname.split('/')[2]; // /chat/[id]에서 id 추출
      if (chatRoomId) {
        setCurrentRoom(chatRoomId);
      }
    } else if (!isChatPage) {
      // 채팅 페이지가 아니면 현재 채팅방 해제
      setCurrentRoom(null);
    }
  }, [isChatPage, pathname, user?.id, setCurrentRoom]);

  return (
    <div style={{ 
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      height: '100dvh'
    }}>
      {!isAuthPage && !isChatPage && <AppBar />}
      <main style={{ 
        flex: 1,
        width: '100%',
        marginTop: (isAuthPage || isChatPage) ? '0' : '60px',
        marginBottom: (isAuthPage || isChatPage) ? '0' : '60px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: isChatPage ? '100dvh' : 'auto',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {children}
      </main>
      {!isAuthPage && !isChatPage && <BottomNavigation />}
    </div>
  );
} 