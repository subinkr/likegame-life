'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const router = useRouter();
  const { signUp } = useAuth();

  // 닉네임 중복 확인
  const checkNickname = async (nickname: string) => {
    if (!nickname || nickname.trim() === '') {
      setNicknameAvailable(null);
      return;
    }

    setNicknameChecking(true);
    try {
      const response = await fetch('/api/auth/check-nickname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '닉네임 확인 중 오류가 발생했습니다.');
      }

      setNicknameAvailable(!result.exists);
    } catch (error: any) {
      console.error('닉네임 확인 오류:', error);
      setNicknameAvailable(null);
    } finally {
      setNicknameChecking(false);
    }
  };

  // 닉네임 입력 핸들러
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    setError(''); // 에러 메시지 초기화

    // 디바운스: 500ms 후에 중복 확인
    const timeoutId = setTimeout(() => {
      checkNickname(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (nicknameAvailable === false) {
      setError('이미 사용 중인 닉네임입니다.');
      setLoading(false);
      return;
    }

    if (nicknameAvailable === null) {
      setError('닉네임을 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      // 먼저 이메일 중복 확인
      const checkResponse = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const checkResult = await checkResponse.json();

      if (!checkResponse.ok) {
        throw new Error(checkResult.error || '이메일 확인 중 오류가 발생했습니다.');
      }

      if (checkResult.exists) {
        setError('이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.');
        setLoading(false);
        return;
      }

      // 이메일이 중복되지 않으면 회원가입 진행
      await signUp({ email, password, nickname: nickname.trim() });
      alert('📧 이메일 확인이 필요합니다.\n\n가입하신 이메일로 확인 메일을 보냈습니다.\n이메일을 확인하고 링크를 클릭해주세요.');
      router.push('/auth/login');
    } catch (error: any) {
      setError(error.message || '회원가입에 실패했습니다.');
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
            🎮 Like Game
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#bfc9d9',
            fontFamily: 'Orbitron, monospace'
          }}>
            인생을 게임처럼
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
              onChange={handleNicknameChange}
              required
              style={{
                height: 40,
                borderRadius: 8,
                fontSize: '0.9rem',
                padding: '0 12px',
                boxSizing: 'border-box',
                background: 'rgba(15,23,42,0.8)',
                border: nicknameAvailable === false 
                  ? '1px solid #ef4444' 
                  : nicknameAvailable === true 
                    ? '1px solid #10b981'
                    : '1px solid #334155',
                color: '#ffffff'
              }}
              placeholder="게임 닉네임"
            />
            {nicknameChecking && (
              <div style={{
                fontSize: '0.75rem',
                color: '#f59e0b',
                marginTop: '4px'
              }}>
                🔍 닉네임 확인 중...
              </div>
            )}
            {nicknameAvailable === true && !nicknameChecking && (
              <div style={{
                fontSize: '0.75rem',
                color: '#10b981',
                marginTop: '4px'
              }}>
                ✅ 사용 가능한 닉네임입니다.
              </div>
            )}
            {nicknameAvailable === false && !nicknameChecking && (
              <div style={{
                fontSize: '0.75rem',
                color: '#ef4444',
                marginTop: '4px'
              }}>
                ❌ 이미 사용 중인 닉네임입니다.
              </div>
            )}
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
              placeholder="영문 대문자, 소문자, 숫자 포함 8자 이상"
            />
            <div style={{
              fontSize: '0.75rem',
              color: '#64748b',
              marginTop: '4px'
            }}>
              ⚠️ 비밀번호는 영문 대문자, 소문자, 숫자를 모두 포함하여 8자 이상이어야 합니다.
            </div>
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
            disabled={loading || nicknameChecking || nicknameAvailable === false}
            style={{
              padding: '12px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: (loading || nicknameChecking || nicknameAvailable === false) ? 'not-allowed' : 'pointer',
              opacity: (loading || nicknameChecking || nicknameAvailable === false) ? 0.7 : 1
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