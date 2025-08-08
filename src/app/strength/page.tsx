'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { strengthAPI } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';

interface StrengthRecord {
  id: string;
  bench: number;
  squat: number;
  deadlift: number;
  total: number;
  created_at: string;
}

function StrengthPageContent() {
  const { user } = useAuth();
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
    if (user) {
      fetchStrengthRecords();
    }
  }, [user]);

  const fetchStrengthRecords = async () => {
    try {
      const data = await strengthAPI.get();
      setRecords(data.records || []);
    } catch (error) {
      // 힘 기록 로드 실패
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await strengthAPI.create(formData);
      setFormData({ bench: 0, squat: 0, deadlift: 0 });
      setShowAddForm(false);
      fetchStrengthRecords();
    } catch (error) {
      // 힘 기록 생성 실패
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('정말로 이 기록을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await strengthAPI.delete(recordId);
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

  const getProgressToNextRank = (total: number) => {
    const thresholds = { F: 0, E: 100, D: 200, C: 300, B: 400, A: 500, S: 600 };
    const currentRank = getRank(total);
    
    if (currentRank === 'S') return { progress: 100, nextRank: 'S', currentThreshold: thresholds.S, nextThreshold: thresholds.S };
    
    let currentThreshold = 0;
    let nextThreshold = 0;
    let nextRank = 'S';
    
    if (currentRank === 'F') {
      currentThreshold = thresholds.F;
      nextThreshold = thresholds.E;
      nextRank = 'E';
    } else if (currentRank === 'E') {
      currentThreshold = thresholds.E;
      nextThreshold = thresholds.D;
      nextRank = 'D';
    } else if (currentRank === 'D') {
      currentThreshold = thresholds.D;
      nextThreshold = thresholds.C;
      nextRank = 'C';
    } else if (currentRank === 'C') {
      currentThreshold = thresholds.C;
      nextThreshold = thresholds.B;
      nextRank = 'B';
    } else if (currentRank === 'B') {
      currentThreshold = thresholds.B;
      nextThreshold = thresholds.A;
      nextRank = 'A';
    } else if (currentRank === 'A') {
      currentThreshold = thresholds.A;
      nextThreshold = thresholds.S;
      nextRank = 'S';
    }
    
    const progress = Math.min(100, ((total - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
    
    return { progress, nextRank, currentThreshold, nextThreshold };
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return '날짜 없음';
    }
  };

  // 통계 계산
  const totalRecords = records.length;
  const maxTotal = records.length > 0 ? Math.max(...records.map(r => r.total)) : 0;
  const avgTotal = records.length > 0 ? Math.round(records.reduce((sum, r) => sum + r.total, 0) / records.length) : 0;

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '24px',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        zIndex: 1000
      }}>
        <div style={{ 
          fontSize: '3rem',
          animation: 'pulse 2s ease-in-out infinite',
          filter: 'drop-shadow(0 0 15px rgba(255, 0, 102, 0.8))'
        }}>💪</div>
        <div style={{ 
          color: '#ff0066', 
          fontSize: '1rem',
          fontFamily: 'Press Start 2P, cursive',
          textShadow: '0 0 10px rgba(255, 0, 102, 0.8)',
          textAlign: 'center'
        }}>
          시스템 로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      minHeight: 'calc(100dvh - 140px)',
      height: '100%',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}>
      {/* 스크롤 가능한 메인 콘텐츠 영역 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flex: 1,
        paddingBottom: '20px'
      }}>
      


      {/* 통계 요약 - 그리드 스타일 */}
      <div style={{
        padding: '0 4px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#ffffff',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive',
          textShadow: '0 0 8px rgba(255,0,102,0.6)'
        }}>
          통계
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '12px 6px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(255,0,102,0.1) 0%, rgba(255,0,102,0.05) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(255,0,102,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 30%, rgba(255,0,102,0.1) 0%, transparent 50%)',
              opacity: 0.5
            }} />
            <div style={{fontSize: '1.4rem', marginBottom: '4px', position: 'relative', zIndex: 1}}>📊</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive',
              position: 'relative',
              zIndex: 1
            }}>기록</div>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#ff0066',
              fontFamily: 'Press Start 2P, cursive',
              textShadow: '0 0 10px rgba(255,0,102,0.6)',
              position: 'relative',
              zIndex: 1
            }}>{totalRecords}</div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '12px 6px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(255,215,0,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 70% 70%, rgba(255,215,0,0.1) 0%, transparent 50%)',
              opacity: 0.5
            }} />
            <div style={{fontSize: '1.4rem', marginBottom: '4px', position: 'relative', zIndex: 1}}>🏆</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive',
              position: 'relative',
              zIndex: 1
            }}>최고</div>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#ffd700',
              fontFamily: 'Press Start 2P, cursive',
              textShadow: '0 0 10px rgba(255,215,0,0.6)',
              position: 'relative',
              zIndex: 1
            }}>{maxTotal}kg</div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '12px 6px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(0,255,255,0.1) 0%, rgba(0,255,255,0.05) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(0,255,255,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(0,255,255,0.1) 0%, transparent 50%)',
              opacity: 0.5
            }} />
            <div style={{fontSize: '1.4rem', marginBottom: '4px', position: 'relative', zIndex: 1}}>📈</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive',
              position: 'relative',
              zIndex: 1
            }}>평균</div>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#00ffff',
              fontFamily: 'Press Start 2P, cursive',
              textShadow: '0 0 10px rgba(0,255,255,0.6)',
              position: 'relative',
              zIndex: 1
            }}>{avgTotal}kg</div>
          </div>
        </div>
      </div>

      {/* 현재 랭크 표시 */}
      {maxTotal > 0 && (
        <div style={{
          padding: '0 4px'
        }}>
          <div style={{
            fontSize: '0.9rem',
            color: '#ffffff',
            marginBottom: '8px',
            textAlign: 'center',
            fontWeight: 600,
            fontFamily: 'Press Start 2P, cursive',
            textShadow: '0 0 8px rgba(255,0,102,0.6)'
          }}>
            현재 랭크
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '8px 12px',
            background: 'rgba(255,0,102,0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255,0,102,0.2)',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{fontSize: '1rem'}}>💪</span>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  fontFamily: 'Orbitron, monospace'
                }}>최고 기록</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#ff0066',
                  fontFamily: 'Press Start 2P, cursive'
                }}>{maxTotal}kg</span>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  background: 'rgba(255,0,102,0.3)',
                  color: '#fff',
                  borderRadius: '6px',
                  fontFamily: 'Press Start 2P, cursive',
                  border: '1px solid rgba(255,0,102,0.5)'
                }}>
                  {getRank(maxTotal)}
                </div>
              </div>
            </div>
            
            {/* 프로그레스 바 */}
            {(() => {
              const progress = getProgressToNextRank(maxTotal);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{
                    width: '100%',
                    height: '4px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <div style={{
                      width: `${progress.progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #ff0066 0%, #ff4080 100%)',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease',
                      boxShadow: '0 0 6px rgba(255,0,102,0.4)'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#888',
                    textAlign: 'right',
                    fontFamily: 'Orbitron, monospace'
                  }}>
                    {progress.nextRank !== 'S' ? `${maxTotal}/${progress.nextThreshold}kg` : '최고 등급'}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 기록 추가 버튼 */}
      <div style={{
        padding: '0 4px'
      }}>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(255,0,102,0.2)',
            border: '2px solid rgba(255,0,102,0.5)',
            color: '#ff0066',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            fontFamily: 'Press Start 2P, cursive',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 10px rgba(255,0,102,0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,0,102,0.3)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(255,0,102,0.5)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,0,102,0.2)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(255,0,102,0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          💪 새 기록 추가
        </button>
      </div>

      {/* 기록 목록 */}
      <div style={{
        padding: '0 4px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#ffffff',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive',
          textShadow: '0 0 8px rgba(255,0,102,0.6)'
        }}>
          3대 운동 목록
        </div>
        
        {records.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '0.8rem',
            padding: '20px',
            fontFamily: 'Orbitron, monospace',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            아직 3대 운동 기록이 없습니다.
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {records.map((record) => (
              <div key={record.id} style={{
                background: 'rgba(255,0,102,0.1)',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid rgba(255,0,102,0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,0,102,0.15)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(255,0,102,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,0,102,0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#666',
                    fontFamily: 'Orbitron, monospace'
                  }}>
                    📅 {formatDate(record.created_at)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(record.id);
                    }}
                    style={{
                      background: 'rgba(255,0,0,0.2)',
                      border: '1px solid rgba(255,0,0,0.3)',
                      color: '#ff0000',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontFamily: 'Press Start 2P, cursive',
                      transition: 'all 0.3s ease',
                      minWidth: '50px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,0,0,0.3)';
                      e.currentTarget.style.boxShadow = '0 0 5px rgba(255,0,0,0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,0,0,0.2)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    삭제
                  </button>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  fontSize: '0.8rem',
                  color: '#ffffff',
                  fontFamily: 'Orbitron, monospace',
                  marginBottom: '8px'
                }}>
                  <div style={{ 
                    textAlign: 'center',
                    padding: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ color: '#888', marginBottom: '2px', fontSize: '0.75rem' }}>벤치</div>
                    <div style={{ fontWeight: 'bold', color: '#ff0066' }}>{record.bench}kg</div>
                  </div>
                  <div style={{ 
                    textAlign: 'center',
                    padding: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ color: '#888', marginBottom: '2px', fontSize: '0.75rem' }}>스쿼트</div>
                    <div style={{ fontWeight: 'bold', color: '#ff0066' }}>{record.squat}kg</div>
                  </div>
                  <div style={{ 
                    textAlign: 'center',
                    padding: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ color: '#888', marginBottom: '2px', fontSize: '0.75rem' }}>데드</div>
                    <div style={{ fontWeight: 'bold', color: '#ff0066' }}>{record.deadlift}kg</div>
                  </div>
                </div>
                
                {/* 총합을 아래쪽에 별도로 배치 */}
                <div style={{ 
                  textAlign: 'center',
                  padding: '8px',
                  background: 'rgba(255,215,0,0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,215,0,0.3)',
                  marginTop: '4px'
                }}>
                  <div style={{ color: '#ffd700', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>총합</div>
                  <div style={{ fontWeight: 'bold', color: '#ffd700', fontSize: '1rem' }}>{record.total}kg</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid rgba(255,0,102,0.3)',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{
              color: '#ff0066',
              marginTop: 0,
              marginBottom: '20px',
              textAlign: 'center',
              fontFamily: 'Press Start 2P, cursive'
            }}>
              새 기록 추가
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                  벤치프레스 (kg)
                </label>
                <input
                  type="number"
                  value={formData.bench}
                  onChange={(e) => setFormData({...formData, bench: parseInt(e.target.value) || 0})}
                  required
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,0,102,0.3)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontFamily: 'Press Start 2P, cursive'
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
                  onChange={(e) => setFormData({...formData, squat: parseInt(e.target.value) || 0})}
                  required
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,0,102,0.3)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontFamily: 'Press Start 2P, cursive'
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
                  onChange={(e) => setFormData({...formData, deadlift: parseInt(e.target.value) || 0})}
                  required
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,0,102,0.3)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontFamily: 'Press Start 2P, cursive'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(255,0,102,0.2)',
                    border: '2px solid rgba(255,0,102,0.5)',
                    color: '#ff0066',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    fontFamily: 'Press Start 2P, cursive'
                  }}
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    color: '#ffffff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontFamily: 'Press Start 2P, cursive'
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

export default function StrengthPage() {
  return (
    <AuthGuard>
      <StrengthPageContent />
    </AuthGuard>
  );
} 