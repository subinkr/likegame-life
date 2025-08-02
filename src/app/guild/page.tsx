'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function GuildPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#ffffff',
        fontFamily: 'Press Start 2P, cursive'
      }}>
        로딩 중...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '16px',
      color: '#ffffff'
    }}>
      {/* 뒤로가기 버튼 */}
      <div style={{
        background: 'rgba(153,0,255,0.05)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'rgba(153,0,255,0.1)',
            border: '1px solid rgba(153,0,255,0.3)',
            color: '#9900ff',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: 'Press Start 2P, cursive',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(153,0,255,0.2)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(153,0,255,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(153,0,255,0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ← 뒤로
        </button>
      </div>
      
      {/* 길드 요약 */}
      <div style={{
        background: 'rgba(153,0,255,0.05)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#9900ff',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive'
        }}>
          🏰 길드
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          gap: '4px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '6px',
            background: 'rgba(153,0,255,0.1)',
            borderRadius: '4px',
            flex: 1
          }}>
            <div style={{fontSize: '1.2rem', marginBottom: '2px'}}>📋</div>
            <div style={{
              fontSize: '0.6rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive'
            }}>퀘스트</div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#9900ff',
              fontFamily: 'Press Start 2P, cursive'
            }}>준비 중</div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '6px',
            background: 'rgba(255,215,0,0.1)',
            borderRadius: '4px',
            flex: 1
          }}>
            <div style={{fontSize: '1.2rem', marginBottom: '2px'}}>👥</div>
            <div style={{
              fontSize: '0.6rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive'
            }}>파티</div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#ffff00',
              fontFamily: 'Press Start 2P, cursive'
            }}>준비 중</div>
          </div>
        </div>
      </div>

      {/* 길드 대시보드 */}
      <div style={{
        background: 'rgba(255,215,0,0.05)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#ffff00',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive'
        }}>
          🏰 길드 대시보드
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          background: 'rgba(255,215,0,0.1)',
          borderRadius: '6px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #9900ff 0%, #ff0066 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(153,0,255,0.5)'
          }}>
            <div style={{fontSize: '2rem'}}>🏰</div>
          </div>
          <div style={{
            fontWeight: 700,
            fontSize: '1rem',
            color: '#ffff00',
            fontFamily: 'Press Start 2P, cursive'
          }}>
            길드
          </div>
          <div style={{
            fontSize: '0.7rem',
            color: '#666',
            textAlign: 'center',
            fontFamily: 'Orbitron, monospace'
          }}>
            퀘스트와 파티 기능이 준비 중입니다
          </div>
        </div>
      </div>

      {/* 준비 중 메시지 */}
      <div style={{
        background: 'rgba(255,0,102,0.05)',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#ff0066',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive'
        }}>
          🚧 개발 진행 상황
        </div>
        <div style={{
          textAlign: 'center',
          color: '#ffffff',
          fontSize: '0.8rem',
          padding: '20px',
          fontFamily: 'Orbitron, monospace'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '12px'
          }}>
            🚧
          </div>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#ff0066',
            marginBottom: '8px',
            fontFamily: 'Press Start 2P, cursive'
          }}>
            길드 기능 준비 중
          </div>
          <div style={{
            fontSize: '0.7rem',
            lineHeight: '1.5',
            color: '#666'
          }}>
            퀘스트 생성, 파티 모집, 관심사 기반 매칭 등<br />
            다양한 길드 기능을 준비하고 있습니다.<br />
            조금만 기다려주세요!
          </div>
        </div>
      </div>
    </div>
  );
} 