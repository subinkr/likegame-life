'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { agilityAPI } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';

interface AgilityRecord {
  id: string;
  distance: number;
  created_at: string;
}

function AgilityPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<AgilityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    distance: 0,
  });

  useEffect(() => {
    if (user) {
      fetchAgilityRecords();
    }
  }, [user]);

  const fetchAgilityRecords = async () => {
    try {
      const data = await agilityAPI.get();
      setRecords(data);
    } catch (error) {
      // Error fetching agility records
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await agilityAPI.create(formData);
      setFormData({ distance: 0 });
      setShowAddForm(false);
      fetchAgilityRecords();
    } catch (error) {
      // Error creating agility record
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('정말로 이 기록을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await agilityAPI.delete(recordId);
      fetchAgilityRecords();
    } catch (error) {
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

  if (isLoading) {
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
                      걷기, 달리기 거리 기록 로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      color: '#ffffff',
      minHeight: 'calc(100dvh - 120px)',
      marginTop: '60px',
      marginBottom: '60px'
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
            }}>최고</div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#ffd700',
              fontFamily: 'Press Start 2P, cursive'
            }}>{records.length > 0 ? Math.max(...records.map(r => r.distance)) : 0}km</div>
          </div>
        </div>
      </div>

      {/* 기록 추가 버튼 */}
      <div style={{
        background: 'rgba(0,255,255,0.05)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(0,255,255,0.2)',
            border: '2px solid rgba(0,255,255,0.5)',
            color: '#00ffff',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            fontFamily: 'Press Start 2P, cursive'
          }}
        >
          🏃 새 기록 추가
        </button>
      </div>

      {/* 기록 목록 */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
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
                      걷기, 달리기 거리 목록
        </div>
        
        {records.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '0.8rem',
            padding: '20px',
            fontFamily: 'Orbitron, monospace'
          }}>
            아직 걷기, 달리기 거리 기록이 없습니다.
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {records.map((record) => (
              <div key={record.id} style={{
                background: 'rgba(0,255,255,0.1)',
                borderRadius: '6px',
                padding: '12px',
                border: '1px solid rgba(0,255,255,0.3)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{flex: 1}}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#666',
                      marginBottom: '4px',
                      fontFamily: 'Orbitron, monospace'
                    }}>
                      📅 {formatDate(record.created_at)}
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
                
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px',
                  padding: '8px'
                }}>

                  <div style={{
                    fontSize: '0.9rem',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontFamily: 'Press Start 2P, cursive',
                    textAlign: 'center'
                  }}>
                    {record.distance}km
                  </div>
                </div>
              </div>
            ))}
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
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid rgba(0,255,255,0.3)',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{
              color: '#00ffff',
              marginTop: 0,
              marginBottom: '20px',
              textAlign: 'center',
              fontFamily: 'Press Start 2P, cursive'
            }}>
              새 기록 추가
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                  걷기, 달리기 거리 (km)
                </label>
                <input
                  type="number"
                  value={formData.distance}
                  onChange={(e) => setFormData({...formData, distance: parseFloat(e.target.value) || 0})}
                  required
                  min="0"
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(0,255,255,0.3)',
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
                    background: 'rgba(0,255,255,0.2)',
                    border: '2px solid rgba(0,255,255,0.5)',
                    color: '#00ffff',
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

export default function AgilityPage() {
  return (
    <AuthGuard>
      <AgilityPageContent />
    </AuthGuard>
  );
} 