'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AgilityRecord {
  id: string;
  month: string;
  distance: number;
  createdAt: string;
  recordCount?: number;
  isCumulative?: boolean;
}

export default function AgilityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<AgilityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    distance: 0,
  });

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchAgilityRecords();
    }
  }, [user, loading, router]);

  const fetchAgilityRecords = async () => {
    try {
      const response = await fetch('/api/stats/agility', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching agility records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/stats/agility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ distance: 0 });
        setShowAddForm(false);
        fetchAgilityRecords();
      }
    } catch (error) {
      console.error('Error creating agility record:', error);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('정말로 이 기록을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/stats/agility/${recordId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchAgilityRecords();
      } else {
        alert('기록 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting agility record:', error);
      alert('기록 삭제 중 오류가 발생했습니다.');
    }
  };

  const getRank = (distance: number) => {
    if (distance >= 600) return 'S';
    if (distance >= 500) return 'A';
    if (distance >= 400) return 'B';
    if (distance >= 300) return 'C';
    if (distance >= 200) return 'D';
    if (distance >= 100) return 'E';
    return 'F';
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'S': return '#00ffff';
      case 'A': return '#ff6600';
      case 'B': return '#ffff00';
      case 'C': return '#00ff00';
      case 'D': return '#ff0066';
      case 'E': return '#0066ff';
      default: return '#666666';
    }
  };

  if (loading || !user) {
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
        }}>🏃</div>
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
      {/* 민첩 요약 */}
      <div style={{
        background: 'rgba(0,255,255,0.05)',
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
            background: 'rgba(0,255,255,0.1)',
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
              color: '#00ffff',
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
            }}>누적</div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#ffff00',
              fontFamily: 'Press Start 2P, cursive'
            }}>{records.length > 0 ? records.reduce((sum, r) => sum + r.distance, 0) : 0}km</div>
          </div>
        </div>
      </div>

      {/* 민첩 기록 추가 */}
      <div style={{
        background: 'rgba(0,255,255,0.05)',
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
            background: 'rgba(0,255,255,0.1)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            color: '#ffffff',
            fontWeight: 600,
            fontFamily: 'Press Start 2P, cursive',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            border: '2px solid rgba(0,255,255,0.3)'
          }}
          onClick={() => setShowAddForm(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,255,255,0.2)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,255,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,255,255,0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          새 기록
        </div>
      </div>

      {/* 민첩 기록 목록 */}
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
              const rank = getRank(record.distance);
              const rankColor = getRankColor(rank);
              return (
                <div key={record.id} style={{
                  background: record.isCumulative ? 'rgba(0,255,255,0.2)' : 'rgba(0,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '8px',
                  position: 'relative',
                  border: record.isCumulative ? '2px solid #00ffff' : '1px solid rgba(0,255,255,0.3)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px'}}>
                    <div style={{flex: 1}}>
                      <div style={{
                        fontWeight: 700,
                        color: '#00ffff',
                        fontSize: '0.75rem',
                        marginBottom: '2px',
                        fontFamily: 'Press Start 2P, cursive'
                      }}>
                        {record.isCumulative ? `🏆 ${record.distance}km` : `${record.distance}km`}
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
                        background: 'rgba(0,255,255,0.2)',
                        border: '1px solid rgba(0,255,255,0.3)',
                        color: '#00ffff',
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
                        e.currentTarget.style.background = 'rgba(0,255,255,0.3)';
                        e.currentTarget.style.boxShadow = '0 0 5px rgba(0,255,255,0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0,255,255,0.2)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      삭제
                    </button>
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
              민첩 기록 추가
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                  걷기, 달리기 한 거리 (km)
                </label>
                <input
                  type="number"
                  value={formData.distance}
                  onChange={(e) => setFormData({...formData, distance: Number(e.target.value)})}
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