'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Stats {
  strength: number;
  agility: number;
  wisdom: number;
}

export default function AppBar() {
  const pathname = usePathname();
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

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return '#ffd700';
      case 'A': return '#ff6b6b';
      case 'B': return '#4ecdc4';
      case 'C': return '#45b7d1';
      case 'D': return '#96ceb4';
      case 'E': return '#feca57';
      case 'F': return '#ff9ff3';
      default: return '#9ca3af';
    }
  };

  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return '스탯 대시보드';
      case '/skills':
        return '스킬';
      case '/achievements':
        return '업적';
      case '/guild':
        return '길드';
      case '/shop':
        return '상점';
      default:
        return 'LikeGame';
    }
  };

  const getPageIcon = () => {
    switch (pathname) {
      case '/':
        return '⚔️';
      case '/skills':
        return '📜';
      case '/achievements':
        return '🏆';
      case '/guild':
        return '🏰';
      case '/shop':
        return '🛒';
      default:
        return '🎮';
    }
  };

  // 메인화면일 때 스탯 정보 표시
  const isMainPage = pathname === '/';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '56px',
      background: 'rgba(34,40,60,0.98)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(79,140,255,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      zIndex: 1000,
      boxShadow: '0 2px 20px rgba(0,0,0,0.3)'
    }}>
      {/* 왼쪽: 로고 및 페이지 정보 */}
      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#4f8cff 0%,#ffd700 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          boxShadow: '0 2px 8px rgba(79,140,255,0.3)',
          flexShrink: 0
        }}>
          {getPageIcon()}
        </div>
        <div style={{minWidth: 0}}>
          <div style={{
            fontWeight: 700, 
            fontSize: '0.9rem', 
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {getPageTitle()}
          </div>
          <div style={{
            fontSize: '0.7rem', 
            color: '#bfc9d9',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            LikeGame
          </div>
        </div>
      </div>

      {/* 오른쪽: 액션 버튼들 */}
      <div style={{display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0}}>
        <button style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(79,140,255,0.1)',
          color: '#4f8cff',
          fontSize: '0.8rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}>
          🔔
        </button>
        <button style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(167,139,250,0.1)',
          color: '#a78bfa',
          fontSize: '0.8rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}>
          ⚙️
        </button>
        <button style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(52,211,153,0.1)',
          color: '#34d399',
          fontSize: '0.8rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}>
          👤
        </button>
      </div>
    </div>
  );
} 