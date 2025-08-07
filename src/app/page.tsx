'use client';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import { useStats } from '@/hooks/useStats';
import { useAchievements } from '@/hooks/useAchievements';
import { useSkills } from '@/hooks/useSkills';
import AuthGuard from '@/components/AuthGuard';

interface Stats {
  strength: number;
  agility: number;
  wisdom: number;
}

interface Title {
  id: string;
  name: string;
  description: string;
  rarity: string;
  achieved: boolean;
  selected?: boolean;
  required_badges?: string[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: string;
  achieved: boolean;
  icon: string;
}

function HomeContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { stats, loading: statsLoading, loadStats, getCurrentMonth } = useStats();
  const { badges, titles, loading: achievementsLoading, toggleBadge, selectTitle } = useAchievements();
  const { skills, loading: skillsLoading } = useSkills();
  
  // stats가 undefined일 때를 대비한 안전장치
  const safeStats = stats || { strength: 0, agility: 0, wisdom: 0 };
  
  // 선택된 칭호 찾기 (활성화된 칭호만)
  const selectedTitle = titles?.find(title => {
    if (!title.selected || !title.achieved) return false;
    
    // 필요한 뱃지가 모두 활성화되어 있는지 확인
    if (title.required_badges && title.required_badges.length > 0) {
      const hasAllRequiredBadges = title.required_badges.every(badgeName => {
        const badge = badges.find(b => b.name === badgeName);
        return badge && badge.achieved;
      });
      return hasAllRequiredBadges;
    }
    
    return true; // required_badges가 없으면 활성화된 것으로 간주
  });
  


  // 페이지 포커스 시 스탯 새로고침
  useEffect(() => {
    const handleFocus = () => {
      if (user && !statsLoading) {
        const currentMonth = getCurrentMonth();
        loadStats(currentMonth);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, loadStats, statsLoading]);



  // 스탯 등급 계산
  const getRank = (value: number, type: 'strength' | 'agility' | 'wisdom') => {
    const thresholds = {
      strength: { F: 0, E: 100, D: 200, C: 300, B: 400, A: 500, S: 600 },
      agility: { F: 0, E: 100, D: 200, C: 300, B: 400, A: 500, S: 600 },
      wisdom: { F: 0, E: 30, D: 60, C: 90, B: 120, A: 150, S: 180 }
    };

    const currentThresholds = thresholds[type];
    
    if (value >= currentThresholds.S) return 'S';
    if (value >= currentThresholds.A) return 'A';
    if (value >= currentThresholds.B) return 'B';
    if (value >= currentThresholds.C) return 'C';
    if (value >= currentThresholds.D) return 'D';
    if (value >= currentThresholds.E) return 'E';
    return 'F';
  };

  // 다음 랭크까지의 진행률 계산
  const getProgressToNextRank = (value: number, type: 'strength' | 'agility' | 'wisdom') => {
    const thresholds = {
      strength: { F: 0, E: 100, D: 200, C: 300, B: 400, A: 500, S: 600 },
      agility: { F: 0, E: 100, D: 200, C: 300, B: 400, A: 500, S: 600 },
      wisdom: { F: 0, E: 30, D: 60, C: 90, B: 120, A: 150, S: 180 }
    };

    const currentThresholds = thresholds[type];
    const currentRank = getRank(value, type);
    
    // S랭크는 이미 최고 등급
    if (currentRank === 'S') return { progress: 100, nextRank: 'S', currentThreshold: currentThresholds.S, nextThreshold: currentThresholds.S };
    
    // 현재 등급의 임계값과 다음 등급의 임계값 찾기
    let currentThreshold = 0;
    let nextThreshold = 0;
    let nextRank = 'S';
    
    if (currentRank === 'F') {
      currentThreshold = currentThresholds.F;
      nextThreshold = currentThresholds.E;
      nextRank = 'E';
    } else if (currentRank === 'E') {
      currentThreshold = currentThresholds.E;
      nextThreshold = currentThresholds.D;
      nextRank = 'D';
    } else if (currentRank === 'D') {
      currentThreshold = currentThresholds.D;
      nextThreshold = currentThresholds.C;
      nextRank = 'C';
    } else if (currentRank === 'C') {
      currentThreshold = currentThresholds.C;
      nextThreshold = currentThresholds.B;
      nextRank = 'B';
    } else if (currentRank === 'B') {
      currentThreshold = currentThresholds.B;
      nextThreshold = currentThresholds.A;
      nextRank = 'A';
    } else if (currentRank === 'A') {
      currentThreshold = currentThresholds.A;
      nextThreshold = currentThresholds.S;
      nextRank = 'S';
    }
    
    const progress = Math.min(100, ((value - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
    
    return { progress, nextRank, currentThreshold, nextThreshold };
  };

  // 통계 계산
  const achievedTitles = titles.filter(t => {
    if (!t.achieved) return false;
          const hasRequiredBadges = t.required_badges?.every((badgeName: string) => {
        const badge = badges.find(b => b.name === badgeName);
        return badge && badge.achieved;
      });
      return hasRequiredBadges;
  }).length;
  const totalTitles = titles.length;
  const achievedBadges = badges.filter(b => b.achieved).length;
  const totalBadges = badges.length;

  // 로딩 중인 경우
  if (statsLoading || achievementsLoading || skillsLoading) {
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
        }}>📈</div>
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



  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden'
    }}>
      {/* 스크롤 가능한 메인 콘텐츠 영역 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minHeight: 0
      }}>
      {/* 핵심 상태 요약 - 미니멀하게 */}
      <div style={{
        background: 'rgba(0,255,255,0.05)',
        borderRadius: '8px',
        padding: '12px',
        textAlign: 'center'
      }}>
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* 선택된 칭호 */}
            {selectedTitle ? (
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '4px 8px',
                background: 'rgba(255,255,0,0.2)',
                color: '#ffff00',
                borderRadius: '6px',
                display: 'inline-block',
                margin: '0 auto',
                fontFamily: 'Press Start 2P, cursive'
              }}>
                <span style={{fontSize: '0.9rem', marginRight: '4px'}}>👑</span>
                {selectedTitle.name}
              </div>
            ) : (
              <div style={{
                display: 'inline-block',
                color: '#666',
                fontSize: '0.75rem',
                padding: '4px 6px',
                borderRadius: '6px',
                background: 'rgba(102,102,102,0.1)',
                fontFamily: 'Orbitron, monospace'
              }}>
                <span style={{fontSize: '0.8rem', marginRight: '3px'}}>🏆</span>
                칭호 없음
              </div>
            )}
            
            {/* 닉네임 */}
            <div style={{
              color: '#ffffff',
              fontSize: '1.2rem',
              fontWeight: 700,
              fontFamily: 'Press Start 2P, cursive'
            }}>
              {user.user_metadata?.nickname || user.email?.split('@')[0] || '플레이어'}
            </div>
          </div>
        )}
      </div>

      {/* 스탯 섹션 - 미니멀하게 */}
      <div style={{
        background: 'rgba(0,255,255,0.05)',
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
          스탯
        </div>
        
        {/* 스탯을 미니멀하게 표시 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* 힘 스탯 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '8px',
            background: 'rgba(255,0,102,0.05)',
            borderRadius: '6px',
            cursor: 'pointer',
            border: '2px solid rgba(255,0,102,0.3)'
          }}
          onClick={() => router.push('/strength')}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{fontSize: '1.1rem'}}>💪</span>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  fontFamily: 'Orbitron, monospace'
                }}>힘</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#ff0066',
                  fontFamily: 'Press Start 2P, cursive'
                }}>{safeStats.strength}kg</span>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '2px 4px',
                  background: 'rgba(255,0,102,0.3)',
                  color: '#fff',
                  borderRadius: '4px',
                  fontFamily: 'Press Start 2P, cursive'
                }}>
                  {getRank(safeStats.strength, 'strength')}
                </div>
              </div>
            </div>
            {/* 프로그레스 바 */}
            {(() => {
              const progress = getProgressToNextRank(safeStats.strength, 'strength');
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: '#666',
                    fontFamily: 'Orbitron, monospace'
                  }}>
                    <span>F→E→D→C→B→A→S</span>
                    <span>{progress.nextRank !== 'S' ? `다음: ${progress.nextRank}` : '최고'}</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '3px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${progress.progress}%`,
                      height: '100%',
                      background: '#ff0066',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#666',
                    textAlign: 'right',
                    fontFamily: 'Orbitron, monospace'
                  }}>
                    {progress.nextRank !== 'S' ? `${safeStats.strength}/${progress.nextThreshold}kg` : '최고 등급'}
                  </div>
                </div>
              );
            })()}
          </div>
          
          {/* 민첩 스탯 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '8px',
            background: 'rgba(0,255,255,0.05)',
            borderRadius: '6px',
            cursor: 'pointer',
            border: '2px solid rgba(0,255,255,0.3)'
          }}
          onClick={() => router.push('/agility')}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{fontSize: '1.1rem'}}>🏃</span>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  fontFamily: 'Orbitron, monospace'
                }}>민첩</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#00ffff',
                  fontFamily: 'Press Start 2P, cursive'
                }}>{safeStats.agility}km</span>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '2px 4px',
                  background: 'rgba(0,255,255,0.3)',
                  color: '#fff',
                  borderRadius: '4px',
                  fontFamily: 'Press Start 2P, cursive'
                }}>
                  {getRank(safeStats.agility, 'agility')}
                </div>
              </div>
            </div>
            {/* 프로그레스 바 */}
            {(() => {
              const progress = getProgressToNextRank(safeStats.agility, 'agility');
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: '#666',
                    fontFamily: 'Orbitron, monospace'
                  }}>
                    <span>F→E→D→C→B→A→S</span>
                    <span>{progress.nextRank !== 'S' ? `다음: ${progress.nextRank}` : '최고'}</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '3px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${progress.progress}%`,
                      height: '100%',
                      background: '#00ffff',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#666',
                    textAlign: 'right',
                    fontFamily: 'Orbitron, monospace'
                  }}>
                    {progress.nextRank !== 'S' ? `${safeStats.agility}/${progress.nextThreshold}km` : '최고 등급'}
                  </div>
                </div>
              );
            })()}
          </div>
          
          {/* 지혜 스탯 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '8px',
            background: 'rgba(153,0,255,0.05)',
            borderRadius: '6px',
            cursor: 'pointer',
            border: '2px solid rgba(153,0,255,0.3)'
          }}
          onClick={() => router.push('/wisdom')}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{fontSize: '1.1rem'}}>🧠</span>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  fontFamily: 'Orbitron, monospace'
                }}>지혜</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#9900ff',
                  fontFamily: 'Press Start 2P, cursive'
                }}>{safeStats.wisdom}개</span>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '2px 4px',
                  background: 'rgba(153,0,255,0.3)',
                  color: '#fff',
                  borderRadius: '4px',
                  fontFamily: 'Press Start 2P, cursive'
                }}>
                  {getRank(safeStats.wisdom, 'wisdom')}
                </div>
              </div>
            </div>
            {/* 프로그레스 바 */}
            {(() => {
              const progress = getProgressToNextRank(safeStats.wisdom, 'wisdom');
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: '#666',
                    fontFamily: 'Orbitron, monospace'
                  }}>
                    <span>F→E→D→C→B→A→S</span>
                    <span>{progress.nextRank !== 'S' ? `다음: ${progress.nextRank}` : '최고'}</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '3px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${progress.progress}%`,
                      height: '100%',
                      background: '#9900ff',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#666',
                    textAlign: 'right',
                    fontFamily: 'Orbitron, monospace'
                  }}>
                    {progress.nextRank !== 'S' ? `${safeStats.wisdom}/${progress.nextThreshold}개` : '최고 등급'}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 업적 요약 - 미니멀하게 */}
      <div style={{
        background: 'rgba(0,255,255,0.05)',
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
          업적
        </div>
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
            flex: 1,
            cursor: 'pointer',
            border: '2px solid rgba(0,255,255,0.3)'
          }}
          onClick={() => router.push('/skills')}
          >
            <div style={{fontSize: '1.2rem', marginBottom: '2px'}}>📜</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive'
            }}>스킬</div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#00ffff',
              fontFamily: 'Press Start 2P, cursive'
            }}>{skills.length}</div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '6px',
            background: 'rgba(255,255,0,0.1)',
            borderRadius: '4px',
            flex: 1,
            cursor: 'pointer',
            border: '2px solid rgba(255,255,0,0.3)'
          }}
          onClick={() => router.push('/achievements?tab=titles')}
          >
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
            }}>{achievedTitles}/{totalTitles}</div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '6px',
            background: 'rgba(255,0,102,0.1)',
            borderRadius: '4px',
            flex: 1,
            cursor: 'pointer',
            border: '2px solid rgba(255,0,102,0.3)'
          }}
          onClick={() => router.push('/achievements?tab=badges')}
          >
            <div style={{fontSize: '1.2rem', marginBottom: '2px'}}>🎖️</div>
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
            }}>{achievedBadges}/{totalBadges}</div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}

