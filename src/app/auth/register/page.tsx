'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, nickname }),
      });

      if (response.ok) {
        router.push('/auth/login');
      } else {
        const data = await response.json();
        setError(data.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'Orbitron, monospace'
    }}>
      <div style={{
        background: 'rgba(34,40,60,0.98)',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid #2e3650',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '8px',
            fontFamily: 'Press Start 2P, cursive'
          }}>
            🎮 LikeGame.life
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#bfc9d9',
            fontFamily: 'Orbitron, monospace'
          }}>
            게임을 시작하세요
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '0.9rem',
              color: '#ffffff',
              fontWeight: 600
            }}>
              👤 닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              style={{
                height: 40,
                borderRadius: 8,
                fontSize: '0.9rem',
                padding: '0 12px',
                boxSizing: 'border-box',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid #334155',
                color: '#ffffff'
              }}
              placeholder="게임 닉네임"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '0.9rem',
              color: '#ffffff',
              fontWeight: 600
            }}>
              📧 이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                height: 40,
                borderRadius: 8,
                fontSize: '0.9rem',
                padding: '0 12px',
                boxSizing: 'border-box',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid #334155',
                color: '#ffffff'
              }}
              placeholder="example@email.com"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '0.9rem',
              color: '#ffffff',
              fontWeight: 600
            }}>
              🔒 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                height: 40,
                borderRadius: 8,
                fontSize: '0.9rem',
                padding: '0 12px',
                boxSizing: 'border-box',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid #334155',
                color: '#ffffff'
              }}
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '0.9rem',
              color: '#ffffff',
              fontWeight: 600
            }}>
              🔒 비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                height: 40,
                borderRadius: 8,
                fontSize: '0.9rem',
                padding: '0 12px',
                boxSizing: 'border-box',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid #334155',
                color: '#ffffff'
              }}
              placeholder="비밀번호를 다시 입력하세요"
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171',
              padding: '12px',
              borderRadius: 8,
              fontSize: '0.8rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>

          <div style={{
            textAlign: 'center',
            marginTop: '8px',
            fontSize: '0.8rem'
          }}>
            <span style={{ color: '#64748b' }}>이미 계정이 있으신가요? </span>
            <Link href="/auth/login" style={{
              color: '#3b82f6',
              textDecoration: 'none',
              fontWeight: 600
            }}>
              로그인
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 