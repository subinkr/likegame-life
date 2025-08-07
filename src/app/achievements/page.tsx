'use client';
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievements } from '@/hooks/useAchievements';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';

interface Title {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  achieved: boolean;
  achieved_date: string | null;
  selected?: boolean;
  required_badges: string[]; // snake_case로 수정
}

interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  achieved: boolean;
  achieved_date: string | null;
  icon: string;
}

function AchievementsPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { badges, titles, loading, toggleBadge, selectTitle, optimisticUpdates } = useAchievements();
  
  // URL 파라미터에서 탭 상태 읽기
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'titles' | 'badges'>(
    tabParam === 'badges' ? 'badges' : 'titles'
  );
  const [error, setError] = useState("");

  // 필터링 상태
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

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
    } else {
      params.set('tab', 'titles');
    }
    router.push(`/achievements?${params.toString()}`);
  };

  const toggleBadgeAchievement = async (id: string) => {
    // 이미 처리 중인 뱃지인지 확인
    if (optimisticUpdates.has(id)) {
      return;
    }
    
    // 새로운 optimistic update 방식 사용
    await toggleBadge(id);
  };



  const selectTitleForDisplay = async (id: string) => {
    // 이미 처리 중인 칭호인지 확인
    if (optimisticUpdates.has(id)) {
      return;
    }
    
    try {
      // 선택하려는 칭호 찾기
      const targetTitle = titles.find(title => title.id === id);
      if (!targetTitle) {
        alert('칭호를 찾을 수 없습니다.');
        return;
      }

      // 칭호의 획득 상태 확인
      const hasRequiredBadges = targetTitle.required_badges?.length > 0 && 
        targetTitle.required_badges.every(badgeName => {
          const badge = badges.find(b => b.name === badgeName);
          return badge && badge.achieved;
        });
      
      const isAchieved = targetTitle.required_badges?.length === 0 || hasRequiredBadges;

      // 미획득 칭호는 선택할 수 없음
      if (!isAchieved) {
        alert('아직 획득하지 못한 칭호입니다. 필요한 뱃지를 모두 획득한 후 선택할 수 있습니다.');
        return;
      }

      // 새로운 optimistic update 방식 사용
      await selectTitle(id);
    } catch (err: any) {
      setError(err.message || '칭호 선택에 실패했습니다.');
    }
  };



  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '#ffff00'; // SSR - 노란색
      case 'epic': return '#9900ff'; // SR - 보라색
      case 'rare': return '#0066ff'; // R - 파란색
      case 'uncommon': return '#00ff00'; // UC - 녹색
      case 'common': return '#ffffff'; // C - 흰색
      default: return '#666666';
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'SSR';
      case 'epic': return 'SR';
      case 'rare': return 'R';
      case 'uncommon': return 'UC';
      case 'common': return 'C';
      default: return rarity;
    }
  };

  // 필터링된 데이터
  const getFilteredTitles = () => {
    return titles.filter(title => {
      const matchesRarity = rarityFilter === 'all' || title.rarity === rarityFilter;
      
      // 칭호의 achieved 상태를 실시간으로 계산
      const hasRequiredBadges = title.required_badges?.length > 0 && 
        title.required_badges.every(badgeName => {
          const badge = badges.find(b => b.name === badgeName);
          return badge && badge.achieved;
        });
      
      const isAchieved = title.required_badges?.length === 0 || hasRequiredBadges;
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'achieved' && isAchieved) ||
        (statusFilter === 'not-achieved' && !isAchieved);
      const matchesSearch = searchTerm === '' || 
        title.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        title.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesRarity && matchesStatus && matchesSearch;
    }).sort((a, b) => {
      // 칭호의 achieved 상태를 실시간으로 계산
      const aHasRequiredBadges = a.required_badges?.length > 0 && 
        a.required_badges.every(badgeName => {
          const badge = badges.find(b => b.name === badgeName);
          return badge && badge.achieved;
        });
      const bHasRequiredBadges = b.required_badges?.length > 0 && 
        b.required_badges.every(badgeName => {
          const badge = badges.find(b => b.name === badgeName);
          return badge && badge.achieved;
        });
      
      const aIsAchieved = a.required_badges?.length === 0 || aHasRequiredBadges;
      const bIsAchieved = b.required_badges?.length === 0 || bHasRequiredBadges;
      
      // 활성화된 항목을 위로 정렬
      if (aIsAchieved && !bIsAchieved) return -1;
      if (!aIsAchieved && bIsAchieved) return 1;
      // 둘 다 활성화되거나 둘 다 비활성화된 경우 이름순 정렬
      return a.name.localeCompare(b.name);
    });
  };

  const getFilteredBadges = () => {
    return badges.filter(badge => {
      const matchesRarity = rarityFilter === 'all' || badge.rarity === rarityFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'achieved' && badge.achieved) ||
        (statusFilter === 'not-achieved' && !badge.achieved);
      const matchesSearch = searchTerm === '' || 
        badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesRarity && matchesStatus && matchesSearch;
    }).sort((a, b) => {
      // 활성화된 항목을 위로 정렬
      if (a.achieved && !b.achieved) return -1;
      if (!a.achieved && b.achieved) return 1;
      // 둘 다 활성화되거나 둘 다 비활성화된 경우 이름순 정렬
      return a.name.localeCompare(b.name);
    });
  };

  const getTitleStats = () => {
    const total = titles.length;
    const achieved = titles.filter(t => {
      // 실시간으로 뱃지 상태를 기반으로 칭호 획득 여부 계산
      const hasRequiredBadges = t.required_badges?.length > 0 && 
        t.required_badges.every(badgeName => {
          const badge = badges.find(b => b.name === badgeName);
          return badge && badge.achieved;
        });
      
      const isAchieved = t.required_badges?.length === 0 || hasRequiredBadges;
      return isAchieved;
    }).length;
    const selected = titles.filter(t => {
      if (!t.selected) return false;
      
      // 선택된 칭호도 실시간으로 획득 상태 확인
      const hasRequiredBadges = t.required_badges?.length > 0 && 
        t.required_badges.every(badgeName => {
          const badge = badges.find(b => b.name === badgeName);
          return badge && badge.achieved;
        });
      
      const isAchieved = t.required_badges?.length === 0 || hasRequiredBadges;
      return isAchieved;
    }).length;
    return { total, achieved, selected };
  };

  const getBadgeStats = () => {
    const total = badges.length;
    const achieved = badges.filter(b => b.achieved).length;
    return { total, achieved };
  };

  // 필터 초기화
  const resetFilters = () => {
    setRarityFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '날짜 없음';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '날짜 없음';
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return '날짜 없음';
    }
  };

  // 로딩 중이거나 로그인되지 않은 경우
  if (loading || !user) {
    const loadingEmoji = activeTab === 'titles' ? '👑' : '🎖️';
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
        }}>{loadingEmoji}</div>
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
  const filteredTitles = getFilteredTitles();
  const filteredBadges = getFilteredBadges();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '16px',
      color: '#ffffff',
      minHeight: '100vh'
    }}>
      {/* 스크롤 가능한 메인 콘텐츠 영역 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flex: 1
      }}>
        {/* 탭 선택 */}
        <div style={{
          background: 'rgba(0,255,255,0.05)',
          borderRadius: '8px',
          padding: '8px',
          marginBottom: '8px'
        }}>
          <div style={{
            fontSize: '0.9rem',
            color: '#00ffff',
            marginBottom: '8px',
            textAlign: 'center',
            fontWeight: 600,
            fontFamily: 'Press Start 2P, cursive'
          }}>
            {activeTab === 'titles' ? '칭호' : '뱃지'} ({activeTab === 'titles' ? titleStats.achieved : badgeStats.achieved}/{activeTab === 'titles' ? titleStats.total : badgeStats.total})
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <button
              style={{
                flex: 1,
                padding: '6px',
                background: activeTab === 'titles' ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.1)',
                border: activeTab === 'titles' ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.3)',
                borderRadius: '4px',
                color: '#ffd700',
                fontSize: '0.75rem',
                fontFamily: 'Press Start 2P, cursive',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
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
              칭호 ({titleStats.achieved}/{titleStats.total})
            </button>

            <button
              style={{
                flex: 1,
                padding: '6px',
                background: activeTab === 'badges' ? 'rgba(255,0,102,0.2)' : 'rgba(255,0,102,0.1)',
                border: activeTab === 'badges' ? '2px solid #ff0066' : '1px solid rgba(255,0,102,0.3)',
                borderRadius: '4px',
                color: '#ff0066',
                fontSize: '0.75rem',
                fontFamily: 'Press Start 2P, cursive',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
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
              뱃지 ({badgeStats.achieved}/{badgeStats.total})
            </button>
          </div>

          {/* 검색 및 필터 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '8px'
          }}>
            {/* 검색창 */}
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(0,255,255,0.3)',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontFamily: 'Press Start 2P, cursive'
              }}
            />

            {/* 필터 버튼들 */}
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {/* 희귀도 필터 */}
              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '60px',
                  padding: '6px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(0,255,255,0.3)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontFamily: 'Press Start 2P, cursive'
                }}
              >
                <option value="all">희귀도</option>
                <option value="common">C</option>
                <option value="uncommon">UC</option>
                <option value="rare">R</option>
                <option value="epic">SR</option>
                <option value="legendary">SSR</option>
              </select>

              {/* 상태 필터 */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '60px',
                  padding: '6px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(0,255,255,0.3)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontFamily: 'Press Start 2P, cursive'
                }}
              >
                <option value="all">상태</option>
                <option value="achieved">달성</option>
                <option value="not-achieved">미달성</option>
              </select>

              {/* 필터 초기화 버튼 */}
              <button
                onClick={resetFilters}
                style={{
                  padding: '6px 8px',
                  background: 'rgba(255,0,102,0.2)',
                  border: '1px solid rgba(255,0,102,0.3)',
                  borderRadius: '4px',
                  color: '#ff0066',
                  fontSize: '0.75rem',
                  fontFamily: 'Press Start 2P, cursive',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '60px'
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
                초기화
              </button>
            </div>
          </div>

          {/* 결과 개수 표시 */}
          <div style={{
            fontSize: '0.75rem',
            color: '#666',
            textAlign: 'center',
            fontFamily: 'Orbitron, monospace'
          }}>
            {activeTab === 'titles' 
              ? `칭호 ${filteredTitles.length}/${titles.length}개 표시`
              : `뱃지 ${filteredBadges.length}/${badges.length}개 표시`
            }
          </div>
        </div>

        {/* 칭호 목록 */}
        {activeTab === 'titles' && (
          <div style={{
            background: 'rgba(255,215,0,0.05)',
            borderRadius: '8px',
            padding: '8px'
          }}>
            <div style={{
              fontSize: '0.9rem',
              color: '#ffffff',
              marginBottom: '8px',
              textAlign: 'center',
              fontWeight: 600,
              fontFamily: 'Press Start 2P, cursive'
            }}>
              칭호 목록
            </div>
            {filteredTitles.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#666',
                fontSize: '0.75rem',
                padding: '8px',
                fontFamily: 'Orbitron, monospace'
              }}>
                조건에 맞는 칭호가 없습니다
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: '2px',
                padding: '1px',
                justifyContent: 'center'
              }}>
                {filteredTitles.map(title => {
                  const rarityColor = getRarityColor(title.rarity);
                  
                  // 칭호의 achieved 상태를 실시간으로 계산
                  const hasRequiredBadges = title.required_badges?.length > 0 && 
                    title.required_badges.every(badgeName => {
                      const badge = badges.find(b => b.name === badgeName);
                      return badge && badge.achieved;
                    });
                  const isAchieved = title.required_badges?.length === 0 || hasRequiredBadges;
                  
                  return (
                    <div key={title.id} style={{
                      background: isAchieved ? 'rgba(255,215,0,0.15)' : 'rgba(255,215,0,0.05)',
                      borderRadius: '3px',
                      padding: '4px',
                      border: isAchieved ? '2px solid rgba(255,215,0,0.5)' : '1px solid rgba(255,215,0,0.2)',
                      cursor: isAchieved && !optimisticUpdates.has(title.id) ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      minHeight: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      opacity: isAchieved ? (optimisticUpdates.has(title.id) ? 0.7 : 1) : 0.6
                    }}
                    onClick={() => isAchieved ? selectTitleForDisplay(title.id) : null}
                    onMouseEnter={e => {
                      if (isAchieved) {
                        e.currentTarget.style.background = 'rgba(255,215,0,0.25)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(255,215,0,0.3)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (isAchieved) {
                        e.currentTarget.style.background = 'rgba(255,215,0,0.15)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                    >
                      {/* 선택됨 표시 */}
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
                      {/* 상단: 아이콘과 이름 */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1px',
                        marginBottom: '3px',
                        textAlign: 'center',
                        position: 'relative'
                      }}>
                        <div style={{fontSize: '1.6rem'}}>👑</div>
                        
                        {/* 처리 중인 칭호에 로딩 표시 */}
                        {optimisticUpdates.has(title.id) && (
                          <div style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            border: '2px solid rgba(0,255,255,0.3)',
                            borderTop: '2px solid #00ffff',
                            animation: 'spin 1s linear infinite',
                            zIndex: 1
                          }} />
                        )}
                        <div style={{
                          fontWeight: 700,
                          color: '#ffff00',
                          fontSize: '0.75rem',
                          fontFamily: 'Press Start 2P, cursive',
                          lineHeight: '1.1',
                          wordBreak: 'break-word'
                        }}>
                          {title.name}
                        </div>
                      </div>

                      {/* 중간: 설명 */}
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#999',
                        marginBottom: '3px',
                        fontFamily: 'Orbitron, monospace',
                        lineHeight: '1.2',
                        flex: 1,
                        textAlign: 'center',
                        wordBreak: 'break-word'
                      }}>
                        {title.description}
                      </div>

                      {/* 하단: 등급과 획득여부 (한 줄) */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '2px'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '1px 3px',
                          background: `rgba(${hexToRgb(rarityColor)},0.3)`,
                          color: rarityColor,
                          borderRadius: '2px',
                          fontFamily: 'Press Start 2P, cursive'
                        }}>
                          {getRarityText(title.rarity)}
                        </div>

                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '1px 3px',
                          background: isAchieved ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,102,0.3)',
                          color: isAchieved ? '#00ff00' : '#ff0066',
                          borderRadius: '2px',
                          fontFamily: 'Press Start 2P, cursive'
                        }}>
                          {isAchieved ? '획득' : '미획득'}
                        </div>
                      </div>
                      
                      {/* 활성화된 경우에만 획득 날짜 표시 */}
                      {isAchieved && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#666',
                          fontFamily: 'Orbitron, monospace',
                          textAlign: 'center'
                        }}>
                          {formatDate(title.achieved_date)}
                        </div>
                      )}
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
            padding: '8px'
          }}>
            <div style={{
              fontSize: '0.9rem',
              color: '#ffffff',
              marginBottom: '8px',
              textAlign: 'center',
              fontWeight: 600,
              fontFamily: 'Press Start 2P, cursive'
            }}>
              뱃지 목록
            </div>
            
            {filteredBadges.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#666',
                fontSize: '0.75rem',
                padding: '8px',
                fontFamily: 'Orbitron, monospace'
              }}>
                조건에 맞는 뱃지가 없습니다
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: '2px',
                padding: '1px',
                justifyContent: 'center'
              }}>
                {filteredBadges.map(badge => {
                  const rarityColor = getRarityColor(badge.rarity);
                  return (
                    <div key={badge.id} style={{
                      background: badge.achieved ? 'rgba(255,0,102,0.15)' : 'rgba(255,0,102,0.05)',
                      borderRadius: '3px',
                      padding: '4px',
                      border: badge.achieved ? '2px solid rgba(255,0,102,0.5)' : '1px solid rgba(255,0,102,0.2)',
                      cursor: optimisticUpdates.has(badge.id) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minWidth: '0',
                      minHeight: '100px',
                      opacity: optimisticUpdates.has(badge.id) ? 0.7 : 1,
                      position: 'relative'
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
                      {/* 상단: 아이콘과 이름 */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1px',
                        marginBottom: '3px',
                        textAlign: 'center',
                        position: 'relative'
                      }}>
                        <div style={{fontSize: '1.6rem'}}>{badge.icon}</div>
                        
                        {/* 처리 중인 뱃지에 로딩 표시 */}
                        {optimisticUpdates.has(badge.id) && (
                          <div style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            border: '2px solid rgba(0,255,255,0.3)',
                            borderTop: '2px solid #00ffff',
                            animation: 'spin 1s linear infinite',
                            zIndex: 1
                          }} />
                        )}
                        <div style={{
                          fontWeight: 700,
                          color: '#ff0066',
                          fontSize: '0.75rem',
                          fontFamily: 'Press Start 2P, cursive',
                          lineHeight: '1.1',
                          wordBreak: 'break-word'
                        }}>
                          {badge.name}
                        </div>
                      </div>

                      {/* 중간: 설명 */}
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#999',
                        marginBottom: '3px',
                        fontFamily: 'Orbitron, monospace',
                        lineHeight: '1.2',
                        flex: 1,
                        textAlign: 'center',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word'
                      }}>
                        {badge.description}
                      </div>

                      {/* 하단: 등급과 획득여부 (한 줄) */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '2px'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '1px 3px',
                          background: `rgba(${hexToRgb(rarityColor)},0.3)`,
                          color: rarityColor,
                          borderRadius: '2px',
                          fontFamily: 'Press Start 2P, cursive'
                        }}>
                          {getRarityText(badge.rarity)}
                        </div>

                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '1px 3px',
                          background: badge.achieved ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,102,0.3)',
                          color: badge.achieved ? '#00ff00' : '#ff0066',
                          borderRadius: '2px',
                          fontFamily: 'Press Start 2P, cursive'
                        }}>
                          {badge.achieved ? '획득' : '미획득'}
                        </div>
                      </div>
                      
                      {/* 획득한 경우에만 날짜 표시 */}
                      {badge.achieved && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#666',
                          fontFamily: 'Orbitron, monospace',
                          textAlign: 'center'
                        }}>
                          {formatDate(badge.achieved_date)}
                        </div>
                      )}
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
            padding: '8px',
            marginTop: '8px',
            color: '#ff0066',
            fontSize: '0.75rem',
            fontFamily: 'Press Start 2P, cursive'
          }}>
            {error}
          </div>
        )}

        {/* 로딩 메시지 */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '8px',
            color: '#00ffff',
            fontSize: '0.75rem',
            fontFamily: 'Press Start 2P, cursive'
          }}>
            로딩 중...
          </div>
        )}
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <AuthGuard>
      <>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <Suspense fallback={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
            color: '#00ffff',
            fontSize: '1rem',
            fontFamily: 'Press Start 2P, cursive'
          }}>
            로딩 중...
          </div>
        }>
          <AchievementsPageContent />
        </Suspense>
      </>
    </AuthGuard>
  );
}

// hexToRgb 유틸 함수 추가
function hexToRgb(hex: string) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  const num = parseInt(hex, 16);
  return [num >> 16, (num >> 8) & 255, num & 255].join(',');
} 