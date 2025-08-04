'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSkills } from '@/hooks/useSkills';
import Link from 'next/link';

interface Stats {
  strength: number;
  agility: number;
  wisdom: number;
}

function AppBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats>({ strength: 0, agility: 0, wisdom: 0 });

  // 스탯 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStats = localStorage.getItem('likegame-stats');
      if (savedStats) {
        try {
          setStats(JSON.parse(savedStats));
        } catch {}
      }
    }
  }, []);

  // 스탯 등급 계산
  const getStatGrade = (value: number, type: 'strength' | 'agility' | 'wisdom') => {
    const thresholds = {
      strength: { F: 0, E: 100, D: 200, C: 300, B: 400, A: 500, S: 600 },
      agility: { F: 0, E: 100, D: 200, C: 300, B: 400, A: 500, S: 600 },
      wisdom: { F: 0, E: 30, D: 60, C: 90, B: 120, A: 150, S: 180 }
    };
    
    const threshold = thresholds[type];
    if (value >= threshold.S) return 'S';
    if (value >= threshold.A) return 'A';
    if (value >= threshold.B) return 'B';
    if (value >= threshold.C) return 'C';
    if (value >= threshold.D) return 'D';
    if (value >= threshold.E) return 'E';
    return 'F';
  };

  const getPageTitle = () => {
    switch (pathname) {
      case '/': return '스탯';
      case '/skills': return '스킬';
      case '/achievements': 
        // URL 파라미터 확인하여 탭 구분
        const tab = searchParams.get('tab');
        return tab === 'badges' ? '뱃지' : '칭호';
      case '/guild': return '길드';
      case '/chat': return '채팅';
      case '/shop': return '상점';
      case '/strength': return '힘';
      case '/agility': return '민첩';
      case '/wisdom': return '지혜';
      case '/wisdom/new': return '지혜 기록';
      case '/books': return '도서';
      case '/admin': return '관리';
      default:
        if (pathname.startsWith('/chat/')) { return '채팅방'; }
        return '라이크게임';
    }
  };

  const getPageIcon = () => {
    switch (pathname) {
      case '/': return '📈';
      case '/skills': return '📜';
      case '/achievements': 
        // URL 파라미터 확인하여 탭 구분
        const tab = searchParams.get('tab');
        return tab === 'badges' ? '🎖️' : '👑';
      case '/guild': return '⚔️';
      case '/chat': return '💬';
      case '/shop': return '🛒';
      case '/strength': return '💪';
      case '/agility': return '🏃';
      case '/wisdom': return '🧠';
      case '/wisdom/new': return '✍️';
      case '/books': return '📚';
      case '/admin': return '⚙️';
      default:
        if (pathname.startsWith('/chat/')) { return '💬'; }
        return '🎮';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: 'rgba(0,255,255,0.05)',
      backdropFilter: 'blur(20px)',
      borderBottom: '2px solid rgba(0,255,255,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      zIndex: 10000
    }}>
      {/* 왼쪽: 페이지 정보 */}
      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'rgba(0,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          border: '1px solid rgba(0,255,255,0.3)'
        }}>
          {getPageIcon()}
        </div>
        <div style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#ffffff',
          fontFamily: 'Press Start 2P, cursive'
        }}>
          {getPageTitle()}
        </div>
      </div>

      {/* 오른쪽: 액션 버튼들 */}
      <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
        {user ? (
          <button 
            onClick={logout}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid rgba(255,0,102,0.3)',
              background: 'rgba(255,0,102,0.1)',
              color: '#ff0066',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            🚪
          </button>
        ) : (
          <Link href="/auth/login">
            <button style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid rgba(0,255,0,0.3)',
              background: 'rgba(0,255,0,0.1)',
              color: '#00ff00',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              👤
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function AppBar() {
  return (
    <Suspense fallback={
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'rgba(0,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderBottom: '2px solid rgba(0,255,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        zIndex: 10000
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(0,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            border: '1px solid rgba(0,255,255,0.3)'
          }}>
            🎮
          </div>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#ffffff',
            fontFamily: 'Press Start 2P, cursive'
          }}>
            로딩...
          </div>
        </div>
      </div>
    }>
      <AppBarContent />
    </Suspense>
  );
} 