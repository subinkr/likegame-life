'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function BottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      label: '스탯',
      href: '/',
      icon: '📈',
      disabled: false
    },
    {
      label: '길드',
      href: '/guild',
      icon: '⚔️',
      disabled: false
    },
    {
      label: '채팅',
      href: '/chat',
      icon: '💬',
      disabled: false
    }
  ];

  // 관리자 권한이 있는 경우 관리 메뉴 추가
  if (user?.role === 'ADMIN') {
    navItems.push({ href: '/admin', label: '관리', icon: '⚙️', disabled: false });
  }

  return (
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
      padding: '0 4px',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)'
    }}>
      {navItems.map((item) => {
        // 활성 상태 판단을 더 정확하게 처리
        let isActive = false;
        if (item.href === '/') {
          // 메인 페이지는 정확히 '/'일 때만 활성
          isActive = pathname === '/';
        } else if (item.href === '/chat') {
          // 채팅 관련 페이지들 (/chat, /chat/[id])에서 채팅 탭 활성화
          isActive = pathname === '/chat' || pathname.startsWith('/chat/');
        } else if (item.href === '/guild') {
          // 길드 페이지
          isActive = pathname === '/guild';
        } else {
          // 기타 페이지들
          isActive = pathname === item.href;
        }
        
        const isDisabled = item.disabled;
        
        if (isDisabled) {
          return (
            <div
              key={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                minWidth: 0,
                padding: '6px 4px',
                opacity: 0.3,
                cursor: 'not-allowed',
                position: 'relative'
              }}
            >
              <div style={{
                fontSize: '1.2rem',
                marginBottom: '2px',
                opacity: 0.5,
                filter: 'grayscale(100%)'
              }}>
                {item.icon}
              </div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#666',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                fontFamily: 'Press Start 2P, cursive'
              }}>
                {item.label}
              </div>
              {/* 잠금 표시 */}
              <div style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                fontSize: '0.75rem',
                color: '#666'
              }}>
                🔒
              </div>
            </div>
          );
        }
        
        return (
          <Link
            key={item.href}
            href={item.href}
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
              margin: '0 2px'
            }}
          >
            {/* 활성 상태 배경 */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,255,255,0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(0,255,255,0.3)'
              }} />
            )}
            
            <div style={{
              fontSize: '1.2rem',
              marginBottom: '2px',
              opacity: isActive ? 1 : 0.8,
              zIndex: 1,
              position: 'relative'
            }}>
              {item.icon}
            </div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: isActive ? 700 : 600,
              color: isActive ? '#00ffff' : '#ffffff',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              fontFamily: 'Press Start 2P, cursive',
              zIndex: 1,
              position: 'relative'
            }}>
              {item.label}
            </div>

            {/* 새로운 메시지 알림 */}
            {/* hasNotification 속성이 제거되었으므로 이 부분은 제거 */}

            {/* 알림 애니메이션 스타일 */}
            <style jsx>{`
              @keyframes pulse {
                0% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.2); }
                100% { opacity: 1; transform: scale(1); }
              }
            `}</style>
          </Link>
        );
      })}
    </div>
  );
} 