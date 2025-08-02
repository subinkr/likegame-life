'use client';
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievements } from '@/hooks/useAchievements';
import Link from 'next/link';

interface Title {
  id: string;
  name: string;
  description: string;
  category: 'personal' | 'career' | 'education' | 'hobby' | 'social' | 'challenge' | 'milestone' | 'creative';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  achieved: boolean;
  achievedDate?: string;
  selected?: boolean;
  requiredBadges: string[]; // 필요한 뱃지 ID들
}

interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'donation' | 'visit' | 'exercise' | 'study' | 'creative' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  achieved: boolean;
  achievedDate?: string;
  icon: string;
}

export default function AchievementsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { badges, titles, loading, error: achievementsError, toggleBadge, selectTitle } = useAchievements();
  
  // URL 파라미터에서 탭 상태 읽기
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'titles' | 'badges'>(
    tabParam === 'badges' ? 'badges' : 'titles'
  );
  const [error, setError] = useState("");

  // URL 파라미터가 변경될 때 탭 상태 업데이트
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'badges') {
      setActiveTab('badges');
    } else {
      setActiveTab('titles');
    }
  }, [searchParams]);

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (tab: 'titles' | 'badges') => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    if (tab === 'badges') {
      params.set('tab', 'badges');
    }
    router.push(`/achievements?${params.toString()}`);
  };

  const toggleBadgeAchievement = async (id: string) => {
    try {
      await toggleBadge(id);
    } catch (err: any) {
      setError(err.message || '뱃지 토글에 실패했습니다.');
    }
  };

  const selectTitleForDisplay = async (id: string) => {
    try {
      const response = await fetch(`/api/titles/${id}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (response.ok) {
        // 선택 성공 시 페이지 새로고침
        window.location.reload();
      } else {
        alert(result.error || '칭호 선택에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '칭호 선택에 실패했습니다.');
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'personal': return '개인';
      case 'career': return '직업';
      case 'education': return '교육';
      case 'hobby': return '취미';
      case 'social': return '사회';
      case 'challenge': return '도전';
      case 'milestone': return '이정표';
      case 'creative': return '창작';
      case 'donation': return '기부';
      case 'visit': return '방문';
      case 'exercise': return '운동';
      case 'study': return '학습';
      case 'special': return '특별';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'personal': return '#ff0066';
      case 'career': return '#00ffff';
      case 'education': return '#00ff00';
      case 'hobby': return '#ffff00';
      case 'social': return '#9900ff';
      case 'challenge': return '#ff6600';
      case 'milestone': return '#ff00ff';
      case 'creative': return '#00ffff';
      case 'donation': return '#00ff00';
      case 'visit': return '#ffff00';
      case 'exercise': return '#ff0066';
      case 'study': return '#00ffff';
      case 'special': return '#ff00ff';
      default: return '#666666';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '#ff00ff';
      case 'epic': return '#9900ff';
      case 'rare': return '#00ffff';
      case 'common': return '#00ff00';
      default: return '#666666';
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '전설';
      case 'epic': return '희귀';
      case 'rare': return '레어';
      case 'common': return '일반';
      default: return rarity;
    }
  };

  const getTitleStats = () => {
    const total = titles.length;
    const achieved = titles.filter(t => t.achieved).length;
    const selected = titles.filter(t => t.selected).length;
    return { total, achieved, selected };
  };

  const getBadgeStats = () => {
    const total = badges.length;
    const achieved = badges.filter(b => b.achieved).length;
    return { total, achieved };
  };

  if (loading) {
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
        }}>⚡</div>
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

  const titleStats = getTitleStats();
  const badgeStats = getBadgeStats();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '16px',
      color: '#ffffff',
      minHeight: 'calc(100vh - 130px)'
    }}>
      {/* 뒤로가기 버튼 */}
      <div style={{
        background: 'rgba(255,215,0,0.05)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'rgba(255,215,0,0.1)',
            border: '1px solid rgba(255,215,0,0.3)',
            color: '#ffff00',
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
            e.currentTarget.style.background = 'rgba(255,215,0,0.2)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(255,215,0,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,215,0,0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ← 뒤로
        </button>
      </div>
      
      {/* 업적 요약 */}
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
          🏆 업적
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          gap: '4px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '6px',
            background: 'rgba(255,215,0,0.1)',
            borderRadius: '4px',
            flex: 1
          }}>
            <div style={{fontSize: '1.2rem', marginBottom: '2px'}}>👑</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive'
            }}>칭호</div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#ffff00',
              fontFamily: 'Press Start 2P, cursive'
            }}>{titleStats.total}</div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '6px',
            background: 'rgba(255,0,102,0.1)',
            borderRadius: '4px',
            flex: 1
          }}>
            <div style={{fontSize: '1.2rem', marginBottom: '2px'}}>🏅</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive'
            }}>뱃지</div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#ff0066',
              fontFamily: 'Press Start 2P, cursive'
            }}>{badgeStats.total}</div>
          </div>
        </div>
      </div>

      {/* 탭 선택 */}
      <div style={{
        background: 'rgba(0,255,255,0.05)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#00ffff',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive'
        }}>
          📋 탭 선택
        </div>
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <div 
            style={{
              flex: 1,
              padding: '8px',
              background: activeTab === 'titles' ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.1)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: '#ffff00',
              fontWeight: 600,
              fontFamily: 'Press Start 2P, cursive',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              border: activeTab === 'titles' ? '2px solid #ffff00' : '1px solid rgba(255,215,0,0.3)'
            }}
            onClick={() => handleTabChange('titles')}
            onMouseEnter={(e) => {
              if (activeTab !== 'titles') {
                e.currentTarget.style.background = 'rgba(255,215,0,0.2)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(255,215,0,0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'titles') {
                e.currentTarget.style.background = 'rgba(255,215,0,0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            👑 칭호 ({titleStats.achieved}/{titleStats.total})
          </div>
          <div 
            style={{
              flex: 1,
              padding: '8px',
              background: activeTab === 'badges' ? 'rgba(255,0,102,0.2)' : 'rgba(255,0,102,0.1)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: '#ff0066',
              fontWeight: 600,
              fontFamily: 'Press Start 2P, cursive',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              border: activeTab === 'badges' ? '2px solid #ff0066' : '1px solid rgba(255,0,102,0.3)'
            }}
            onClick={() => handleTabChange('badges')}
            onMouseEnter={(e) => {
              if (activeTab !== 'badges') {
                e.currentTarget.style.background = 'rgba(255,0,102,0.2)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(255,0,102,0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'badges') {
                e.currentTarget.style.background = 'rgba(255,0,102,0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            🏅 뱃지 ({badgeStats.achieved}/{badgeStats.total})
          </div>
        </div>
      </div>

      {/* 칭호 목록 */}
      {activeTab === 'titles' && (
        <div style={{
          background: 'rgba(255,215,0,0.05)',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <div style={{
            fontSize: '0.9rem',
            color: '#ffff00',
            marginBottom: '8px',
            textAlign: 'center',
            fontWeight: 600,
            fontFamily: 'Press Start 2P, cursive'
          }}>
            👑 칭호 목록
          </div>
          
          {titles.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '0.7rem',
              padding: '12px',
              fontFamily: 'Orbitron, monospace'
            }}>
              칭호가 없습니다
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {titles.map(title => {
                const categoryColor = getCategoryColor(title.category);
                const rarityColor = getRarityColor(title.rarity);
                return (
                                  <div key={title.id} style={{
                  background: title.achieved ? 'rgba(255,215,0,0.15)' : 'rgba(255,215,0,0.05)',
                  borderRadius: '8px',
                  padding: '12px',
                  border: title.achieved ? '2px solid rgba(255,215,0,0.5)' : '1px solid rgba(255,215,0,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                  onClick={() => {
                    if (title.achieved) {
                      selectTitleForDisplay(title.id);
                    } else {
                      // 조건을 만족하지 않는 경우 안내창
                      const requiredBadges = title.requiredBadges || [];
                      alert(`이 칭호를 획득하려면 다음 뱃지가 필요합니다:\n${requiredBadges.join(', ')}`);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = title.achieved ? 'rgba(255,215,0,0.25)' : 'rgba(255,215,0,0.1)';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(255,215,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = title.achieved ? 'rgba(255,215,0,0.15)' : 'rgba(255,215,0,0.05)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                    {/* 선택된 칭호 표시 */}
                    {title.selected && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#00ff00',
                        color: '#000',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '12px',
                        fontFamily: 'Press Start 2P, cursive',
                        boxShadow: '0 0 8px rgba(0,255,0,0.5)',
                        zIndex: 1
                      }}>
                        선택됨
                      </div>
                    )}
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{flex: 1}}>
                        <div style={{
                          fontWeight: 700,
                          color: '#ffff00',
                          fontSize: '0.7rem',
                          marginBottom: '4px',
                          fontFamily: 'Press Start 2P, cursive'
                        }}>
                          {title.name}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#999',
                          marginBottom: '4px',
                          fontFamily: 'Orbitron, monospace'
                        }}>
                          {title.description}
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        alignItems: 'flex-end'
                      }}>

                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 4px',
                          background: `rgba(${rarityColor === '#ff00ff' ? '255,0,255' : rarityColor === '#9900ff' ? '153,0,255' : rarityColor === '#00ffff' ? '0,255,255' : rarityColor === '#00ff00' ? '0,255,0' : '102,102,102'},0.3)`,
                          color: rarityColor,
                          borderRadius: '4px',
                          fontFamily: 'Press Start 2P, cursive'
                        }}>
                          {getRarityText(title.rarity)}
                        </div>
                      </div>
                    </div>
                    
                    {/* 상태 표시 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '6px'
                    }}>
                      <div style={{
                        display: 'inline-block',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        background: title.achieved ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,102,0.3)',
                        color: title.achieved ? '#00ff00' : '#ff0066',
                        borderRadius: '4px',
                        fontFamily: 'Press Start 2P, cursive'
                      }}>
                        {title.achieved ? '획득' : '미획득'}
                      </div>
                      
                      {title.achieved && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#666',
                          fontFamily: 'Orbitron, monospace'
                        }}>
                          📅 {title.achievedDate ? new Date(title.achievedDate).toLocaleDateString('ko-KR') : '날짜 없음'}
                        </div>
                      )}
                    </div>
                    

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 뱃지 목록 */}
      {activeTab === 'badges' && (
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
            🏅 뱃지 목록
          </div>
          
          {badges.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '0.7rem',
              padding: '12px',
              fontFamily: 'Orbitron, monospace'
            }}>
              뱃지가 없습니다
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {badges.map(badge => {
                const categoryColor = getCategoryColor(badge.category);
                const rarityColor = getRarityColor(badge.rarity);
                return (
                  <div key={badge.id} style={{
                    background: badge.achieved ? 'rgba(255,0,102,0.15)' : 'rgba(255,0,102,0.05)',
                    borderRadius: '8px',
                    padding: '12px',
                    border: badge.achieved ? '2px solid rgba(255,0,102,0.5)' : '1px solid rgba(255,0,102,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => toggleBadgeAchievement(badge.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = badge.achieved ? 'rgba(255,0,102,0.25)' : 'rgba(255,0,102,0.1)';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(255,0,102,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = badge.achieved ? 'rgba(255,0,102,0.15)' : 'rgba(255,0,102,0.05)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{flex: 1}}>
                        <div style={{
                          fontWeight: 700,
                          color: '#ff0066',
                          fontSize: '0.7rem',
                          marginBottom: '4px',
                          fontFamily: 'Press Start 2P, cursive'
                        }}>
                          {badge.icon} {badge.name}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#999',
                          marginBottom: '4px',
                          fontFamily: 'Orbitron, monospace'
                        }}>
                          {badge.description}
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        alignItems: 'flex-end'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 4px',
                          background: `rgba(${categoryColor === '#ff0066' ? '255,0,102' : categoryColor === '#00ffff' ? '0,255,255' : categoryColor === '#00ff00' ? '0,255,0' : categoryColor === '#ffff00' ? '255,255,0' : categoryColor === '#9900ff' ? '153,0,255' : categoryColor === '#ff6600' ? '255,102,0' : categoryColor === '#ff00ff' ? '255,0,255' : '102,102,102'},0.3)`,
                          color: categoryColor,
                          borderRadius: '4px',
                          fontFamily: 'Press Start 2P, cursive'
                        }}>
                          {getCategoryText(badge.category)}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 4px',
                          background: `rgba(${rarityColor === '#ff00ff' ? '255,0,255' : rarityColor === '#9900ff' ? '153,0,255' : rarityColor === '#00ffff' ? '0,255,255' : rarityColor === '#00ff00' ? '0,255,0' : '102,102,102'},0.3)`,
                          color: rarityColor,
                          borderRadius: '4px',
                          fontFamily: 'Press Start 2P, cursive'
                        }}>
                          {getRarityText(badge.rarity)}
                        </div>
                      </div>
                    </div>
                    
                    {/* 상태 표시 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '6px'
                    }}>
                      <div style={{
                        display: 'inline-block',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        background: badge.achieved ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,102,0.3)',
                        color: badge.achieved ? '#00ff00' : '#ff0066',
                        borderRadius: '4px',
                        fontFamily: 'Press Start 2P, cursive'
                      }}>
                        {badge.achieved ? '획득' : '미획득'}
                      </div>
                      
                      {badge.achieved && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#666',
                          fontFamily: 'Orbitron, monospace'
                        }}>
                          📅 {badge.achievedDate ? new Date(badge.achievedDate).toLocaleDateString('ko-KR') : '날짜 없음'}
                        </div>
                      )}
                    </div>
                    

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div style={{
          background: 'rgba(255,0,102,0.1)',
          borderRadius: '8px',
          padding: '12px',
          marginTop: '12px',
          color: '#ff0066',
          fontSize: '0.7rem',
          textAlign: 'center',
          fontFamily: 'Press Start 2P, cursive'
        }}>
          {error}
        </div>
      )}
    </div>
  );
} 