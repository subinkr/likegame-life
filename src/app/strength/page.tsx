'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface StrengthRecord {
  id: string;
  month: string;
  bench: number;
  squat: number;
  deadlift: number;
  total: number;
  createdAt: string;
  isBestRecord?: boolean;
}

export default function StrengthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<StrengthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    bench: 0,
    squat: 0,
    deadlift: 0,
  });

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchStrengthRecords();
    }
  }, [user, loading, router]);

  const fetchStrengthRecords = async () => {
    try {
      const response = await fetch('/api/stats/strength');
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      // 힘 기록 로드 실패
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/stats/strength', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ bench: 0, squat: 0, deadlift: 0 });
        setShowAddForm(false);
        fetchStrengthRecords();
      }
    } catch (error) {
      // 힘 기록 생성 실패
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('정말로 이 기록을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/stats/strength/${recordId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchStrengthRecords();
        // 삭제 후 메인 페이지 스탯 새로고침을 위해 localStorage 업데이트
        if (typeof window !== 'undefined') {
          const currentStats = localStorage.getItem('likegame-stats');
          if (currentStats) {
            const stats = JSON.parse(currentStats);
            // 힘 스탯을 0으로 초기화 (실제 값은 API에서 다시 계산됨)
            stats.strength = 0;
            localStorage.setItem('likegame-stats', JSON.stringify(stats));
          }
        }
      } else {
        alert('기록 삭제에 실패했습니다.');
      }
    } catch (error) {
      // 힘 기록 삭제 실패
      alert('기록 삭제 중 오류가 발생했습니다.');
    }
  };

  const getRank = (total: number) => {
    if (total >= 600) return 'S';
    if (total >= 500) return 'A';
    if (total >= 400) return 'B';
    if (total >= 300) return 'C';
    if (total >= 200) return 'D';
    if (total >= 100) return 'E';
    return 'F';
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'S': return '#ff0066';
      case 'A': return '#ff6600';
      case 'B': return '#ffff00';
      case 'C': return '#00ff00';
      case 'D': return '#00ffff';
      case 'E': return '#0066ff';
      default: return '#666666';
    }
  };

  if (loading || isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 130px)',
        flexDirection: 'column',
        gap: '24px',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)'
      }}>
        <div style={{ 
          fontSize: '3rem',
          animation: 'pulse 2s ease-in-out infinite',
          filter: 'drop-shadow(0 0 15px rgba(0, 255, 255, 0.8))'
        }}>💪</div>
        <div style={{ 
          color: '#00ffff', 
          fontSize: '1rem',
          fontFamily: 'Press Start 2P, cursive',
          textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
          textAlign: 'center'
        }}>
          시스템 로딩 중...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '16px',
      color: '#ffffff',
      minHeight: 'calc(100vh - 130px)'
    }}>
      {/* 힘 요약 */}
      <div style={{
        background: 'rgba(255,0,102,0.05)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          gap: '4px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '6px',
            background: 'rgba(255,0,102,0.1)',
            borderRadius: '4px',
            flex: 1
          }}>
            <div style={{fontSize: '1.2rem', marginBottom: '2px'}}>📊</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive'
            }}>기록</div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#ff0066',
              fontFamily: 'Press Start 2P, cursive'
            }}>{records.length}</div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '6px',
            background: 'rgba(255,215,0,0.1)',
            borderRadius: '4px',
            flex: 1
          }}>
            <div style={{fontSize: '1.2rem', marginBottom: '2px'}}>🏆</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive'
            }}>최고</div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#ffff00',
              fontFamily: 'Press Start 2P, cursive'
            }}>{records.length > 0 ? Math.max(...records.map(r => r.total)) : 0}kg</div>
          </div>
        </div>
      </div>

      {/* 힘 기록 추가 */}
      <div style={{
        background: 'rgba(255,0,102,0.05)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#ffffff',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive'
        }}>
          기록 추가
        </div>
        <div 
          style={{
            padding: '8px',
            background: 'rgba(255,0,102,0.1)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            color: '#ffffff',
            fontWeight: 600,
            fontFamily: 'Press Start 2P, cursive',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            border: '2px solid rgba(255,0,102,0.3)'
          }}
          onClick={() => setShowAddForm(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,0,102,0.2)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(255,0,102,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,0,102,0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          새 기록
        </div>
      </div>

      {/* 힘 기록 목록 */}
      <div style={{
        background: 'rgba(255,215,0,0.05)',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#ffffff',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive'
        }}>
          기록 목록
        </div>
        
        {records.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '0.75rem',
            padding: '12px',
            fontFamily: 'Orbitron, monospace'
          }}>
            기록이 없습니다
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
            {records.map(record => {
              const rank = getRank(record.total);
              const rankColor = getRankColor(rank);
              return (
                <div key={record.id} style={{
                  background: record.isBestRecord ? 'rgba(255,0,102,0.2)' : 'rgba(255,0,102,0.1)',
                  borderRadius: '6px',
                  padding: '8px',
                  position: 'relative',
                  border: record.isBestRecord ? '2px solid #ff0066' : '1px solid rgba(255,0,102,0.3)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px'}}>
                    <div style={{flex: 1}}>
                      <div style={{
                        fontWeight: 700,
                        color: '#ff0066',
                        fontSize: '0.75rem',
                        marginBottom: '2px',
                        fontFamily: 'Press Start 2P, cursive'
                      }}>
                        {record.isBestRecord ? `🏆 ${record.total}kg` : `${record.total}kg`}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#666',
                        marginBottom: '4px',
                        fontFamily: 'Orbitron, monospace'
                      }}>
                        {new Date(record.createdAt).toLocaleDateString('ko-KR', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit' 
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(record.id)}
                      style={{
                        background: 'rgba(255,0,102,0.2)',
                        border: '1px solid rgba(255,0,102,0.3)',
                        color: '#ff0066',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '32px',
                        fontFamily: 'Press Start 2P, cursive',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,0,102,0.3)';
                        e.currentTarget.style.boxShadow = '0 0 5px rgba(255,0,102,0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,0,102,0.2)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      삭제
                    </button>
                  </div>
                  
                  {/* 개별 운동 기록 */}
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '4px',
                      background: 'rgba(255,0,102,0.1)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'Orbitron, monospace'
                    }}>
                      <div style={{color: '#ff0066', fontWeight: 600}}>벤치</div>
                      <div style={{color: '#ffffff'}}>{record.bench}kg</div>
                    </div>
                    <div style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '4px',
                      background: 'rgba(255,0,102,0.1)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'Orbitron, monospace'
                    }}>
                      <div style={{color: '#ff0066', fontWeight: 600}}>스쿼트</div>
                      <div style={{color: '#ffffff'}}>{record.squat}kg</div>
                    </div>
                    <div style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '4px',
                      background: 'rgba(255,0,102,0.1)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'Orbitron, monospace'
                    }}>
                      <div style={{color: '#ff0066', fontWeight: 600}}>데드</div>
                      <div style={{color: '#ffffff'}}>{record.deadlift}kg</div>
                    </div>
                  </div>
                  

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 기록 추가 모달 */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a1a',
            padding: '12px',
            borderRadius: '15px',
            border: '2px solid rgba(0,255,255,0.3)',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2 style={{ 
              color: '#00ffff', 
              marginTop: '16px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              힘 기록 추가
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                  벤치프레스 (kg)
                </label>
                <input
                  type="number"
                  value={formData.bench}
                  onChange={(e) => setFormData({...formData, bench: Number(e.target.value)})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(0,255,255,0.3)',
                    borderRadius: '6px',
                    color: '#ffffff'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                  스쿼트 (kg)
                </label>
                <input
                  type="number"
                  value={formData.squat}
                  onChange={(e) => setFormData({...formData, squat: Number(e.target.value)})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(0,255,255,0.3)',
                    borderRadius: '6px',
                    color: '#ffffff'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                  데드리프트 (kg)
                </label>
                <input
                  type="number"
                  value={formData.deadlift}
                  onChange={(e) => setFormData({...formData, deadlift: Number(e.target.value)})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(0,255,255,0.3)',
                    borderRadius: '6px',
                    color: '#ffffff'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(0,255,255,0.2)',
                    border: '2px solid rgba(0,255,255,0.5)',
                    color: '#00ffff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    color: '#ffffff',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 