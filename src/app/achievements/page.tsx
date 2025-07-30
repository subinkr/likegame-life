'use client';
import { useState, useEffect } from "react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
}

interface Title {
  id: string;
  name: string;
  description: string;
  category: 'personal' | 'career' | 'education' | 'hobby' | 'social' | 'challenge' | 'milestone' | 'creative';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: string;
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
  requirement: string;
  achieved: boolean;
  achievedDate?: string;
  icon: string;
}

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState<'titles' | 'badges'>('titles');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [newAchievement, setNewAchievement] = useState<Achievement>({
    id: '',
    title: '',
    description: '',
    date: '',
    category: 'personal'
  });
  const [error, setError] = useState("");

  // 저장/불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAchievements = localStorage.getItem('likegame-achievements');
      const savedTitles = localStorage.getItem('likegame-titles');
      const savedBadges = localStorage.getItem('likegame-badges');
      if (savedAchievements) {
        try {
          setAchievements(JSON.parse(savedAchievements));
        } catch {}
      }
      if (savedTitles) {
        try {
          setTitles(JSON.parse(savedTitles));
        } catch {}
      }
      if (savedBadges) {
        try {
          setBadges(JSON.parse(savedBadges));
        } catch {}
      }
    }
  }, []);

  // 초기 뱃지 데이터 생성 (localStorage에 데이터가 없을 때만)
  useEffect(() => {
    if (typeof window !== 'undefined' && badges.length === 0) {
      const savedBadges = localStorage.getItem('likegame-badges');
      if (!savedBadges) {
        const initialBadges: Badge[] = [
          // 통일감 있는 "첫 ~" 패턴의 뱃지들
          { id: '1', name: '첫 기부', description: '첫 기부를 완료했습니다', category: 'donation', rarity: 'common', requirement: '기부 1만원', achieved: false, icon: '💝' },
          { id: '2', name: '첫 봉사', description: '첫 봉사를 했습니다', category: 'donation', rarity: 'common', requirement: '자원봉사 1시간', achieved: false, icon: '🤝' },
          { id: '3', name: '첫 여행', description: '첫 여행을 떠났습니다', category: 'visit', rarity: 'common', requirement: '여행 1회', achieved: false, icon: '✈️' },
          { id: '4', name: '첫 산책', description: '첫 산책을 했습니다', category: 'visit', rarity: 'common', requirement: '산책 1회', achieved: false, icon: '🚶' },
          { id: '5', name: '첫 운동', description: '첫 운동을 시작했습니다', category: 'exercise', rarity: 'common', requirement: '운동 30분', achieved: false, icon: '💪' },
          { id: '6', name: '첫 작품', description: '첫 창작물을 만들었습니다', category: 'creative', rarity: 'common', requirement: '창작물 1개', achieved: false, icon: '🎨' },
          { id: '7', name: '첫 독서', description: '첫 책을 읽었습니다', category: 'study', rarity: 'common', requirement: '독서 1권', achieved: false, icon: '📚' },
          { id: '8', name: '첫 생일', description: 'LikeGame에서 첫 생일을 맞았습니다', category: 'special', rarity: 'common', requirement: '첫 생일', achieved: false, icon: '🎂' },
        ];
        setBadges(initialBadges);
      }
    }
  }, [badges.length]);

  // 초기 칭호 데이터 생성 (localStorage에 데이터가 없을 때만)
  useEffect(() => {
    if (typeof window !== 'undefined' && titles.length === 0) {
      const savedTitles = localStorage.getItem('likegame-titles');
      if (!savedTitles) {
        const initialTitles: Title[] = [
          // 뱃지 조합으로만 획득하는 칭호들 (2개 이상 조합)
          { id: '1', name: '마음의 기부자', description: '기부와 봉사를 모두 완료했습니다', category: 'social', rarity: 'rare', requirement: '첫 기부 + 첫 봉사 뱃지 획득', achieved: false, requiredBadges: ['1', '2'] },
          { id: '2', name: '여행의 시작', description: '여행과 산책을 모두 완료했습니다', category: 'hobby', rarity: 'rare', requirement: '첫 여행 + 첫 산책 뱃지 획득', achieved: false, requiredBadges: ['3', '4'] },
          { id: '3', name: '지식의 탐험가', description: '독서와 창작을 모두 완료했습니다', category: 'education', rarity: 'rare', requirement: '첫 독서 + 첫 작품 뱃지 획득', achieved: false, requiredBadges: ['7', '6'] },
          { id: '4', name: '건강한 생활가', description: '운동과 산책을 모두 완료했습니다', category: 'personal', rarity: 'rare', requirement: '첫 운동 + 첫 산책 뱃지 획득', achieved: false, requiredBadges: ['5', '4'] },
          { id: '5', name: '인생의 첫걸음', description: '모든 기본 활동을 완료했습니다', category: 'milestone', rarity: 'legendary', requirement: '모든 첫 뱃지 획득', achieved: false, requiredBadges: ['1', '2', '3', '4', '5', '6', '7', '8'] }
        ];
        setTitles(initialTitles);
      }
    }
  }, [titles.length]);

  // 뱃지 수집에 따른 칭호 자동 획득/비활성화 체크
  useEffect(() => {
    if (titles.length > 0 && badges.length > 0) {
      setTitles(prev => prev.map(title => {
        const hasRequiredBadges = title.requiredBadges.every(badgeId => {
          const badge = badges.find(b => b.id === badgeId);
          return badge && badge.achieved;
        });

        // 필요한 뱃지를 모두 가지고 있으면 획득, 아니면 비활성화
        if (hasRequiredBadges && !title.achieved) {
          return {
            ...title,
            achieved: true,
            achievedDate: new Date().toISOString().split('T')[0]
          };
        } else if (!hasRequiredBadges && title.achieved) {
          return {
            ...title,
            achieved: false,
            achievedDate: undefined,
            selected: false // 비활성화되면 선택도 해제
          };
        } else if (!hasRequiredBadges && title.selected) {
          // 뱃지가 없는데 선택된 상태라면 선택 해제
          return {
            ...title,
            selected: false
          };
        }
        return title;
      }));
    }
  }, [badges, titles.length]);

  const toggleBadgeAchievement = (id: string) => {
    const updatedBadges = badges.map(badge => 
      badge.id === id 
        ? { 
            ...badge, 
            achieved: !badge.achieved,
            achievedDate: !badge.achieved ? new Date().toISOString().split('T')[0] : undefined
          }
        : badge
    );
    setBadges(updatedBadges);
    if (typeof window !== 'undefined') {
      localStorage.setItem('likegame-badges', JSON.stringify(updatedBadges));
    }
  };

  const selectTitle = (id: string) => {
    const updatedTitles = titles.map(title => ({
      ...title,
      selected: title.id === id
    }));
    setTitles(updatedTitles);
    if (typeof window !== 'undefined') {
      localStorage.setItem('likegame-titles', JSON.stringify(updatedTitles));
    }
  };

  const addAchievement = () => {
    if (!newAchievement.title.trim()) {
      setError("업적 제목을 입력하세요.");
      return;
    }
    if (!newAchievement.date) {
      setError("달성일을 입력하세요.");
      return;
    }

    const achievement: Achievement = {
      ...newAchievement,
      id: Date.now().toString()
    };

    setAchievements(prev => [achievement, ...prev]);
    setNewAchievement({
      id: '',
      title: '',
      description: '',
      date: '',
      category: 'personal'
    });
    setError("");
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'personal': return '개인';
      case 'career': return '직업';
      case 'education': return '교육';
      case 'hobby': return '취미';
      case 'social': return '사회';
      case 'challenge': return '도전';
      case 'milestone': return '여정';
      case 'donation': return '기부';
      case 'visit': return '방문';
      case 'exercise': return '운동';
      case 'study': return '학습';
      case 'creative': return '창작';
      case 'special': return '특별';
      default: return '기타';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'personal': return '#ffd700';
      case 'career': return '#4f8cff';
      case 'education': return '#a78bfa';
      case 'hobby': return '#34d399';
      case 'social': return '#fbbf24';
      case 'challenge': return '#f87171';
      case 'milestone': return '#9ca3af';
      case 'donation': return '#f87171';
      case 'visit': return '#4f8cff';
      case 'exercise': return '#34d399';
      case 'study': return '#a78bfa';
      case 'creative': return '#ffd700';
      case 'special': return '#9ca3af';
      default: return '#9ca3af';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9ca3af';
      case 'rare': return '#4f8cff';
      case 'epic': return '#a78bfa';
      case 'legendary': return '#ffd700';
      default: return '#9ca3af';
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common': return '일반';
      case 'rare': return '희귀';
      case 'epic': return '영웅';
      case 'legendary': return '전설';
      default: return '일반';
    }
  };

  const getTitleStats = () => {
    return {
      total: titles.length,
      achieved: titles.filter(t => t.achieved).length,
      selected: titles.filter(t => t.selected).length,
      common: titles.filter(t => t.rarity === 'common').length,
      rare: titles.filter(t => t.rarity === 'rare').length,
      epic: titles.filter(t => t.rarity === 'epic').length,
      legendary: titles.filter(t => t.rarity === 'legendary').length
    };
  };

  const getBadgeStats = () => {
    return {
      total: badges.length,
      achieved: badges.filter(b => b.achieved).length,
      common: badges.filter(b => b.rarity === 'common').length,
      rare: badges.filter(b => b.rarity === 'rare').length,
      epic: badges.filter(b => b.rarity === 'epic').length,
      legendary: badges.filter(b => b.rarity === 'legendary').length
    };
  };

  const titleStats = getTitleStats();
  const badgeStats = getBadgeStats();
  const selectedTitle = titles.find(t => t.selected);

  return (
    <main style={{maxWidth: '100%', margin: '0 auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: 16}}>
      {/* 업적 대시보드 */}
      <section className="section-card" style={{textAlign: 'center', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #4f8cff22, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)', width: '100%'}}>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:12}}>
          <div style={{width:60, height:60, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8cff 0%,#ffd700 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 2px #23294644'}}>
            <div style={{fontSize: '2rem'}}>🏆</div>
          </div>
          <div style={{fontWeight:800, fontSize:'1rem', color:'#fff', marginTop:2}}>업적 관리</div>
          <div style={{fontSize:'0.8rem', color:'#bfc9d9', marginTop:4}}>뱃지를 수집하고 칭호를 획득하세요</div>
          
          {/* 선택된 칭호 표시 */}
          {selectedTitle && (
            <div style={{marginTop: 16, padding: '12px', background: 'rgba(255,215,0,0.1)', borderRadius: 8, border: '2px solid #ffd700'}}>
              <div style={{fontSize: '0.8rem', color: '#ffd700', marginBottom: 4}}>현재 칭호</div>
              <div style={{fontWeight: 700, color: '#fff', fontSize: '1rem'}}>{selectedTitle.name}</div>
            </div>
          )}
          
          <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8, marginTop:16, width:'100%'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'1.2rem', fontWeight:700, color:'#ffd700'}}>{titleStats.achieved}</div>
              <div style={{fontSize:'0.7rem', color:'#bfc9d9'}}>획득한 칭호</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'1.2rem', fontWeight:700, color:'#34d399'}}>{badgeStats.achieved}</div>
              <div style={{fontSize:'0.7rem', color:'#bfc9d9'}}>수집한 뱃지</div>
            </div>
          </div>
        </div>
      </section>

      {/* 탭 네비게이션 */}
      <section className="section-card" style={{padding:'12px', borderRadius:12, boxShadow:'0 4px 16px #4f8cff22, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)', width: '100%'}}>
        <div style={{display:'flex', gap:8, justifyContent:'center'}}>
          <button
            onClick={() => setActiveTab('titles')}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'titles' ? '#4f8cff' : 'rgba(79,140,255,0.1)',
              color: activeTab === 'titles' ? '#fff' : '#bfc9d9',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            칭호 ({titleStats.achieved}/{titleStats.total})
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'badges' ? '#4f8cff' : 'rgba(79,140,255,0.1)',
              color: activeTab === 'badges' ? '#fff' : '#bfc9d9',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            뱃지 ({badgeStats.achieved}/{badgeStats.total})
          </button>
        </div>
      </section>

      {activeTab === 'titles' ? (
        <>
          {/* 칭호 목록 */}
          <section className="section-card" style={{padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #ffd70022, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)', width: '100%'}}>
            <div className="title-section" style={{fontSize:'1rem', color:'#ffd700', marginBottom:16}}>획득한 칭호 ({titleStats.achieved}/{titleStats.total})</div>
            
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              {titles.map(title => {
                const isSelected = title.selected;
                
                return (
                  <div 
                    key={title.id} 
                    className="section-card" 
                    onClick={() => title.achieved && selectTitle(title.id)}
                    style={{
                      background: title.achieved ? 'rgba(255,215,0,0.1)' : 'rgba(255,215,0,0.05)', 
                      boxShadow: isSelected ? '0 2px 8px #ffd70044' : '0 2px 8px #ffd70022', 
                      padding:'12px', 
                      marginBottom:0, 
                      borderRadius:8, 
                      position:'relative', 
                      opacity: title.achieved ? 1 : 0.6,
                      border: isSelected ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.3)',
                      cursor: title.achieved ? 'pointer' : 'default',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (title.achieved) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px #ffd70044';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (title.achieved) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = isSelected ? '0 2px 8px #ffd70044' : '0 2px 8px #ffd70022';
                      }
                    }}
                  >
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                      <div style={{flex:1, display:'flex', alignItems:'flex-start', gap:8}}>
                        <div style={{width:32, height:32, borderRadius:'50%', background: title.achieved ? 'linear-gradient(135deg,#ffd700 0%,#ffed4e 100%)' : 'rgba(255,215,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem'}}>
                          👑
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700, color: title.achieved ? '#ffd700' : '#9ca3af', fontSize:'0.9rem', marginBottom:4}}>{title.name}</div>
                          <div style={{fontSize:11, color:'#bfc9d9', marginBottom:4, lineHeight:1.3}}>{title.description}</div>
                          <div style={{fontSize:10, color:'#94a3b8'}}>요구사항: {title.requirement}</div>
                          {title.achieved && title.achievedDate && (
                            <div style={{fontSize:10, color:'#34d399'}}>획득일: {title.achievedDate}</div>
                          )}
                          {!title.achieved && (
                            <div style={{fontSize:10, color:'#f87171'}}>필요한 뱃지를 수집하세요</div>
                          )}
                          {title.achieved && isSelected && (
                            <div style={{fontSize:10, color:'#ffd700', fontWeight: 700}}>✓ 현재 선택됨</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* 뱃지 목록 */}
          <section className="section-card" style={{padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #a78bfa22, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)', width: '100%'}}>
            <div className="title-section" style={{fontSize:'1rem', color:'#a78bfa', marginBottom:16}}>수집한 뱃지 ({badgeStats.achieved}/{badgeStats.total})</div>
            
            <div style={{
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
              gap: 12
            }}>
              {badges.map(badge => (
                <div 
                  key={badge.id} 
                  className="section-card" 
                  onClick={() => toggleBadgeAchievement(badge.id)}
                  style={{
                    background: badge.achieved ? 'rgba(167,139,250,0.1)' : 'rgba(167,139,250,0.05)', 
                    boxShadow:'0 2px 8px #a78bfa22', 
                    padding:'12px', 
                    marginBottom:0, 
                    borderRadius:8, 
                    position:'relative', 
                    opacity: badge.achieved ? 1 : 0.6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: badge.achieved ? '2px solid #a78bfa' : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px #a78bfa44';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px #a78bfa22';
                  }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: badge.achieved ? 'linear-gradient(135deg,#a78bfa 0%,#ffd700 100%)' : 'rgba(167,139,250,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    marginBottom: 8
                  }}>
                    {badge.icon}
                  </div>
                  
                  <div style={{fontWeight: 700, color: badge.achieved ? '#a78bfa' : '#9ca3af', fontSize: '0.8rem', marginBottom: 4}}>
                    {badge.name}
                  </div>
                  
                  <div style={{fontSize: 10, color: '#bfc9d9', marginBottom: 8, lineHeight: 1.3}}>
                    {badge.description}
                  </div>
                  
                  <div style={{fontSize: 9, color: '#94a3b8', marginBottom: 8}}>
                    {badge.requirement}
                  </div>
                  
                  {badge.achieved && badge.achievedDate && (
                    <div style={{fontSize: 9, color: '#34d399', marginBottom: 8}}>
                      {badge.achievedDate}
                    </div>
                  )}
                  
                                     <div style={{display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center'}}>
                     <span style={{
                       padding: '2px 6px',
                       borderRadius: '8px',
                       fontSize: '0.6rem',
                       fontWeight: 700,
                       color: '#fff',
                       background: getRarityColor(badge.rarity),
                       boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                     }}>
                       {getRarityText(badge.rarity)}
                     </span>
                   </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
} 