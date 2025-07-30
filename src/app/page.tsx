'use client';
import Link from "next/link";
import { useState, useEffect } from "react";

interface Stats {
  strength: number;
  agility: number;
  wisdom: number;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  acquiredDate: string;
  expiryDate?: string;
  parentSkill?: string;
}

interface Title {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  requirement: string;
  achieved: boolean;
  selected?: boolean;
  requiredBadges?: string[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  requirement: string;
  achieved: boolean;
  icon: string;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ strength: 0, agility: 0, wisdom: 0 });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  
  // 스탯 입력 상태
  const [strengthInputs, setStrengthInputs] = useState({ bench: 0, squat: 0, deadlift: 0 });
  const [agilityInput, setAgilityInput] = useState('');
  const [wisdomInputs, setWisdomInputs] = useState({ title: '', quote: '', impression: '' });
  const [wisdomBooks, setWisdomBooks] = useState<Array<{title: string, quote: string, impression: string, date: string}>>([]);
  
  // 모달 상태
  const [showWisdomModal, setShowWisdomModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  // 월별 초기화 시스템
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getLastMonth = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  };

  const getCurrentMonthStats = () => {
    const currentMonth = getCurrentMonth();
    if (typeof window !== 'undefined') {
      const monthlyStats = localStorage.getItem(`likegame-stats-${currentMonth}`);
      return monthlyStats ? JSON.parse(monthlyStats) : { strength: 0, agility: 0, wisdom: 0 };
    }
    return { strength: 0, agility: 0, wisdom: 0 };
  };

  const getLastMonthStats = () => {
    const lastMonth = getLastMonth();
    if (typeof window !== 'undefined') {
      const monthlyStats = localStorage.getItem(`likegame-stats-${lastMonth}`);
      return monthlyStats ? JSON.parse(monthlyStats) : { strength: 0, agility: 0, wisdom: 0 };
    }
    return { strength: 0, agility: 0, wisdom: 0 };
  };

  const saveCurrentMonthStats = (newStats: Stats) => {
    const currentMonth = getCurrentMonth();
    if (typeof window !== 'undefined') {
      localStorage.setItem(`likegame-stats-${currentMonth}`, JSON.stringify(newStats));
    }
  };

  // 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSkills = localStorage.getItem('likegame-skills');
      const savedTitles = localStorage.getItem('likegame-titles');
      const savedBadges = localStorage.getItem('likegame-badges');
      const savedWisdomBooks = localStorage.getItem('likegame-wisdom-books');

      // 현재 월 스탯 로드
      const currentStats = getCurrentMonthStats();
      setStats(currentStats);

      if (savedSkills) {
        try {
          setSkills(JSON.parse(savedSkills));
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
      if (savedWisdomBooks) {
        try {
          setWisdomBooks(JSON.parse(savedWisdomBooks));
        } catch {}
      }
    }
  }, []);

  // 힘 스탯 저장
  const saveStrength = () => {
    const totalStrength = strengthInputs.bench + strengthInputs.squat + strengthInputs.deadlift;
    const currentStats = getCurrentMonthStats();
    const newStats = { ...currentStats, strength: totalStrength };
    setStats(newStats);
    saveCurrentMonthStats(newStats);
    setStrengthInputs({ bench: 0, squat: 0, deadlift: 0 });
  };

  // 민첩 스탯 추가
  const addAgility = () => {
    const distance = parseInt(agilityInput) || 0;
    if (distance > 0) {
      const currentStats = getCurrentMonthStats();
      const newStats = { ...currentStats, agility: currentStats.agility + distance };
      setStats(newStats);
      saveCurrentMonthStats(newStats);
      setAgilityInput('');
    }
  };

  // 지혜 스탯 추가
  const addWisdom = () => {
    if (wisdomInputs.title.trim() && wisdomInputs.quote.trim() && wisdomInputs.impression.trim()) {
      const newBook = {
        ...wisdomInputs,
        date: new Date().toISOString().split('T')[0]
      };
      const newBooks = [...wisdomBooks, newBook];
      setWisdomBooks(newBooks);
      const currentStats = getCurrentMonthStats();
      const newStats = { ...currentStats, wisdom: newBooks.length };
      setStats(newStats);
      if (typeof window !== 'undefined') {
        localStorage.setItem('likegame-wisdom-books', JSON.stringify(newBooks));
        saveCurrentMonthStats(newStats);
      }
      setWisdomInputs({ title: '', quote: '', impression: '' });
    }
  };

  // 스탯 등급 계산 (전월 기준)
  const getStatGrade = (value: number, type: 'strength' | 'agility' | 'wisdom') => {
    const lastMonthStats = getLastMonthStats();
    const lastMonthValue = lastMonthStats[type];
    
    const thresholds = {
      strength: { F: 0, E: 100, D: 200, C: 300, B: 400, A: 500, S: 600 },
      agility: { F: 0, E: 100, D: 200, C: 300, B: 400, A: 500, S: 600 },
      wisdom: { F: 0, E: 30, D: 60, C: 90, B: 120, A: 150, S: 180 }
    };

    const typeThresholds = thresholds[type];
    if (lastMonthValue >= typeThresholds.S) return 'S';
    if (lastMonthValue >= typeThresholds.A) return 'A';
    if (lastMonthValue >= typeThresholds.B) return 'B';
    if (lastMonthValue >= typeThresholds.C) return 'C';
    if (lastMonthValue >= typeThresholds.D) return 'D';
    if (lastMonthValue >= typeThresholds.E) return 'E';
    return 'F';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return '#ffd700';
      case 'A': return '#ff6b6b';
      case 'B': return '#4ecdc4';
      case 'C': return '#45b7d1';
      case 'D': return '#96ceb4';
      case 'E': return '#feca57';
      case 'F': return '#ff9ff3';
      default: return '#9ca3af';
    }
  };

  // 다음달 예정 등급 계산
  const getNextMonthGrade = (value: number, type: 'strength' | 'agility' | 'wisdom') => {
    const thresholds = {
      strength: { F: 0, E: 100, D: 200, C: 300, B: 400, A: 500, S: 600 },
      agility: { F: 0, E: 100, D: 200, C: 300, B: 400, A: 500, S: 600 },
      wisdom: { F: 0, E: 30, D: 60, C: 90, B: 120, A: 150, S: 180 }
    };
    
    const threshold = thresholds[type];
    
    if (value >= threshold.S) return { grade: 'S', progress: 100 };
    if (value >= threshold.A) return { grade: 'A', progress: Math.min(100, ((value - threshold.A) / (threshold.S - threshold.A)) * 100) };
    if (value >= threshold.B) return { grade: 'B', progress: Math.min(100, ((value - threshold.B) / (threshold.A - threshold.B)) * 100) };
    if (value >= threshold.C) return { grade: 'C', progress: Math.min(100, ((value - threshold.C) / (threshold.B - threshold.C)) * 100) };
    if (value >= threshold.D) return { grade: 'D', progress: Math.min(100, ((value - threshold.D) / (threshold.C - threshold.D)) * 100) };
    if (value >= threshold.E) return { grade: 'E', progress: Math.min(100, ((value - threshold.E) / (threshold.D - threshold.E)) * 100) };
    return { grade: 'F', progress: Math.min(100, (value / threshold.E) * 100) };
  };

  // 통계 계산
  const achievedTitles = titles.filter(t => {
    if (!t.achieved) return false;
    // 뱃지 조건을 다시 확인
    const hasRequiredBadges = t.requiredBadges?.every((badgeId: string) => {
      const badge = badges.find(b => b.id === badgeId);
      return badge && badge.achieved;
    });
    return hasRequiredBadges;
  }).length;
  const totalTitles = titles.length;
  const achievedBadges = badges.filter(b => b.achieved).length;
  const totalBadges = badges.length;
  const totalSkills = skills.length;
  const selectedTitle = titles.find(t => {
    if (!t.selected) return false;
    // 선택된 칭호의 뱃지 조건을 확인
    const hasRequiredBadges = t.requiredBadges?.every((badgeId: string) => {
      const badge = badges.find(b => b.id === badgeId);
      return badge && badge.achieved;
    });
    return hasRequiredBadges;
  });

  // 진행률 계산
  const titleProgress = totalTitles > 0 ? (achievedTitles / totalTitles) * 100 : 0;
  const badgeProgress = totalBadges > 0 ? (achievedBadges / totalBadges) * 100 : 0;

  return (
    <main className="main-grid" style={{minHeight: '100vh', paddingBottom: '80px'}}>
      {/* 헤더 섹션 */}
      <section className="section-card" style={{gridColumn: '1/-1', textAlign: 'center', padding: '20px 16px'}}>
        <h1 className="title-main">likegame.life</h1>
        <div className="text-sub" style={{marginBottom: 16}}>
          인생을 게임처럼 플레이하는<br/>나만의 성장 대시보드
        </div>
        {selectedTitle && (
          <div style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: 'rgba(255,215,0,0.1)',
            borderRadius: '20px',
            border: '1px solid rgba(255,215,0,0.3)',
            color: '#ffd700',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: 16
          }}>
            👑 {selectedTitle.name}
          </div>
        )}
      </section>

      {/* 현재 스탯 */}
      <section className="section-card" style={{gridColumn: '1/-1', padding:'20px', borderRadius:12, boxShadow:'0 4px 16px #4f8cff22, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
        <div className="title-section" style={{fontSize:'1.2rem', color:'#4f8cff', marginBottom:20, textAlign: 'center', fontWeight: 700}}>현재 스탯</div>
        <div style={{textAlign: 'center', marginBottom: 16}}>
          <div style={{fontSize:'0.9rem', color:'#94a3b8', marginBottom: 8}}>현재 월: {getCurrentMonth()}</div>
          <div style={{fontSize:'0.8rem', color:'#64748b'}}>랭크는 전월({getLastMonth()}) 기준으로 결정됩니다</div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16}}>
          {/* 힘 스탯 */}
          <div style={{textAlign:'center', padding:'20px', background:'rgba(79,140,255,0.1)', borderRadius:12, border: '1px solid rgba(79,140,255,0.2)'}}>
            <div style={{fontSize:'3rem', marginBottom:12}}>💪</div>
            <div style={{fontWeight:700, color:'#fff', fontSize:'1.1rem', marginBottom:8}}>힘</div>
            <div style={{fontSize:'2rem', fontWeight:800, color:getGradeColor(getStatGrade(stats.strength, 'strength')), marginBottom:8}}>
              {getStatGrade(stats.strength, 'strength')}
            </div>
            <div style={{fontSize:'1.1rem', color:'#bfc9d9', marginBottom:12}}>{stats.strength}kg</div>
            <div style={{marginTop: 12}}>
              <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>다음달 예정: {getNextMonthGrade(stats.strength, 'strength').grade}</div>
            </div>
          </div>

          {/* 민첩 스탯 */}
          <div style={{textAlign:'center', padding:'20px', background:'rgba(52,211,153,0.1)', borderRadius:12, border: '1px solid rgba(52,211,153,0.2)'}}>
            <div style={{fontSize:'3rem', marginBottom:12}}>🏃</div>
            <div style={{fontWeight:700, color:'#fff', fontSize:'1.1rem', marginBottom:8}}>민첩</div>
            <div style={{fontSize:'2rem', fontWeight:800, color:getGradeColor(getStatGrade(stats.agility, 'agility')), marginBottom:8}}>
              {getStatGrade(stats.agility, 'agility')}
            </div>
            <div style={{fontSize:'1.1rem', color:'#bfc9d9', marginBottom:12}}>{stats.agility}km</div>
            <div style={{marginTop: 12}}>
              <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>다음달 예정: {getNextMonthGrade(stats.agility, 'agility').grade}</div>
            </div>
          </div>

          {/* 지혜 스탯 */}
          <div style={{textAlign:'center', padding:'20px', background:'rgba(167,139,250,0.1)', borderRadius:12, border: '1px solid rgba(167,139,250,0.2)'}}>
            <div style={{fontSize:'3rem', marginBottom:12}}>🧠</div>
            <div style={{fontWeight:700, color:'#fff', fontSize:'1.1rem', marginBottom:8}}>지혜</div>
            <div style={{fontSize:'2rem', fontWeight:800, color:getGradeColor(getStatGrade(stats.wisdom, 'wisdom')), marginBottom:8}}>
              {getStatGrade(stats.wisdom, 'wisdom')}
            </div>
            <div style={{fontSize:'1.1rem', color:'#bfc9d9', marginBottom:12}}>{stats.wisdom}개</div>
            <div style={{marginTop: 12}}>
              <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>다음달 예정: {getNextMonthGrade(stats.wisdom, 'wisdom').grade}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 스탯 입력 섹션들 */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(350px, 1fr))', gap:20, gridColumn:'1/-1'}}>
        {/* 힘 스탯 입력 */}
        <section className="section-card" style={{padding:'20px', borderRadius:12, boxShadow:'0 4px 16px #4f8cff22, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
          <div className="title-section" style={{fontSize:'1.2rem', color:'#4f8cff', marginBottom:20, textAlign: 'center', fontWeight: 700}}>💪 힘 스탯 입력</div>
          <div style={{fontSize:'0.9rem', color:'#94a3b8', marginBottom:16, textAlign: 'center'}}>3대 운동 최고 무게 합계</div>
          
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:16, marginBottom:16}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'0.8rem', color:'#94a3b8', marginBottom:8}}>벤치프레스</div>
              <input
                type="number"
                placeholder="0"
                value={strengthInputs.bench || ''}
                onChange={(e) => setStrengthInputs(prev => ({ ...prev, bench: parseInt(e.target.value) || 0 }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(79,140,255,0.3)',
                  background: 'rgba(34,40,60,0.8)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}
              />
              <div style={{fontSize:'0.7rem', color:'#94a3b8', marginTop:4}}>kg</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'0.8rem', color:'#94a3b8', marginBottom:8}}>스쿼트</div>
              <input
                type="number"
                placeholder="0"
                value={strengthInputs.squat || ''}
                onChange={(e) => setStrengthInputs(prev => ({ ...prev, squat: parseInt(e.target.value) || 0 }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(79,140,255,0.3)',
                  background: 'rgba(34,40,60,0.8)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}
              />
              <div style={{fontSize:'0.7rem', color:'#94a3b8', marginTop:4}}>kg</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'0.8rem', color:'#94a3b8', marginBottom:8}}>데드리프트</div>
              <input
                type="number"
                placeholder="0"
                value={strengthInputs.deadlift || ''}
                onChange={(e) => setStrengthInputs(prev => ({ ...prev, deadlift: parseInt(e.target.value) || 0 }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(79,140,255,0.3)',
                  background: 'rgba(34,40,60,0.8)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}
              />
              <div style={{fontSize:'0.7rem', color:'#94a3b8', marginTop:4}}>kg</div>
            </div>
          </div>
          <div style={{textAlign: 'center'}}>
            <button
              onClick={saveStrength}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg,#4f8cff 0%,#a78bfa 100%)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              힘 스탯 저장 (합계: {strengthInputs.bench + strengthInputs.squat + strengthInputs.deadlift}kg)
            </button>
          </div>
        </section>

        {/* 민첩 스탯 입력 */}
        <section className="section-card" style={{padding:'20px', borderRadius:12, boxShadow:'0 4px 16px #34d39922, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
          <div className="title-section" style={{fontSize:'1.2rem', color:'#34d399', marginBottom:20, textAlign: 'center', fontWeight: 700}}>🏃 민첩 스탯 입력</div>
          <div style={{fontSize:'0.9rem', color:'#94a3b8', marginBottom:16, textAlign: 'center'}}>도보 이동거리 추가</div>
          
          <div style={{display:'flex', gap:12, alignItems:'center', justifyContent:'center', flexWrap:'wrap', marginBottom:16}}>
            <input
              type="number"
              placeholder="이동한 거리"
              value={agilityInput}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || !isNaN(parseInt(value))) {
                  setAgilityInput(value);
                }
              }}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(52,211,153,0.3)',
                background: 'rgba(34,40,60,0.8)',
                color: '#fff',
                fontSize: '1rem',
                minWidth: '200px'
              }}
            />
            <button
              onClick={addAgility}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg,#34d399 0%,#10b981 100%)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              거리 추가
            </button>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>현재 총 거리: {stats.agility}km</div>
          </div>
        </section>

        {/* 지혜 스탯 입력 */}
        <section className="section-card" style={{padding:'20px', borderRadius:12, boxShadow:'0 4px 16px #a78bfa22, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
          <div className="title-section" style={{fontSize:'1.2rem', color:'#a78bfa', marginBottom:20, textAlign: 'center', fontWeight: 700}}>🧠 지혜 스탯 입력</div>
          <div style={{fontSize:'0.9rem', color:'#94a3b8', marginBottom:16, textAlign: 'center'}}>초서(抄書) 추가</div>
          
          <div style={{display:'flex', flexDirection:'column', gap:12, marginBottom:16}}>
            <input
              type="text"
              placeholder="책 제목"
              value={wisdomInputs.title}
              onChange={(e) => setWisdomInputs(prev => ({ ...prev, title: e.target.value }))}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(167,139,250,0.3)',
                background: 'rgba(34,40,60,0.8)',
                color: '#fff',
                fontSize: '1rem'
              }}
            />
            <textarea
              placeholder="인용문"
              value={wisdomInputs.quote}
              onChange={(e) => setWisdomInputs(prev => ({ ...prev, quote: e.target.value }))}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(167,139,250,0.3)',
                background: 'rgba(34,40,60,0.8)',
                color: '#fff',
                fontSize: '1rem',
                minHeight: '60px',
                resize: 'vertical'
              }}
            />
            <textarea
              placeholder="감상"
              value={wisdomInputs.impression}
              onChange={(e) => setWisdomInputs(prev => ({ ...prev, impression: e.target.value }))}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(167,139,250,0.3)',
                background: 'rgba(34,40,60,0.8)',
                color: '#fff',
                fontSize: '1rem',
                minHeight: '60px',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{display:'flex', gap:12, justifyContent:'center', alignItems:'center', flexWrap:'wrap', marginBottom:16}}>
            <button
              onClick={addWisdom}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg,#a78bfa 0%,#c084fc 100%)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              초서 추가
            </button>
            {wisdomBooks.length > 0 && (
              <button
                onClick={() => setShowWisdomModal(true)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(167,139,250,0.2)',
                  color: '#a78bfa',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                📚 기록 노트
              </button>
            )}
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>총 초서 수: {stats.wisdom}개</div>
          </div>
        </section>
      </div>

      {/* 지혜 기록 모달 */}
      {showWisdomModal && (
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
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(34,40,60,0.98)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(167,139,250,0.3)'
          }}>
            {/* 모달 헤더 */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
              <div style={{fontSize:'1.2rem', fontWeight:700, color:'#a78bfa'}}>📚 초서 기록 노트</div>
              <button
                onClick={() => {
                  setShowWisdomModal(false);
                  setSelectedBook(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* 책 목록 또는 상세 내용 */}
            {selectedBook ? (
              // 선택된 책의 상세 내용
              <div style={{flex:1, overflow:'auto'}}>
                <button
                  onClick={() => setSelectedBook(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#a78bfa',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  ← 목록으로 돌아가기
                </button>
                {wisdomBooks
                  .filter(book => book.title === selectedBook)
                  .map((book, index) => (
                    <div key={index} style={{
                      padding: '20px',
                      background: 'rgba(167,139,250,0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(167,139,250,0.2)',
                      marginBottom: 12
                    }}>
                      <div style={{fontSize:'1.1rem', fontWeight:700, color:'#fff', marginBottom:12}}>📖 {book.title}</div>
                      {book.quote && (
                        <div style={{marginBottom:12}}>
                          <div style={{fontSize:'0.9rem', color:'#a78bfa', marginBottom:4, fontWeight:600}}>💬 인용문</div>
                          <div style={{fontSize:'0.9rem', color:'#bfc9d9', fontStyle:'italic', padding:'12px', background:'rgba(167,139,250,0.05)', borderRadius:'6px'}}>"{book.quote}"</div>
                        </div>
                      )}
                      {book.impression && (
                        <div style={{marginBottom:12}}>
                          <div style={{fontSize:'0.9rem', color:'#a78bfa', marginBottom:4, fontWeight:600}}>💭 감상</div>
                          <div style={{fontSize:'0.9rem', color:'#94a3b8', padding:'12px', background:'rgba(167,139,250,0.05)', borderRadius:'6px', lineHeight:1.5}}>{book.impression}</div>
                        </div>
                      )}
                      <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>📅 {book.date}</div>
                    </div>
                  ))}
              </div>
            ) : (
              // 책 제목 목록 (중복 제거)
              <div style={{flex:1, overflow:'auto'}}>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:'0.9rem', color:'#94a3b8', marginBottom:8}}>총 {Array.from(new Set(wisdomBooks.map(book => book.title))).length}권의 책을 읽었습니다</div>
                  <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>책 제목을 클릭하면 상세 내용을 볼 수 있습니다</div>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:8}}>
                  {Array.from(new Set(wisdomBooks.map(book => book.title))).map((bookTitle, index) => {
                    const bookEntries = wisdomBooks.filter(book => book.title === bookTitle);
                    const totalEntries = bookEntries.length;
                    const latestDate = bookEntries.reduce((latest, book) => 
                      book.date > latest ? book.date : latest, bookEntries[0].date
                    );
                    
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedBook(bookTitle)}
                        style={{
                          padding: '16px',
                          background: 'rgba(167,139,250,0.1)',
                          borderRadius: '8px',
                          border: '1px solid rgba(167,139,250,0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(167,139,250,0.15)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(167,139,250,0.1)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{fontWeight:700, color:'#fff', fontSize:'1rem', marginBottom:4}}>📖 {bookTitle}</div>
                        <div style={{fontSize:'0.8rem', color:'#94a3b8', marginBottom:4}}>📅 {latestDate}</div>
                        <div style={{fontSize:'0.7rem', color:'#a78bfa'}}>
                          {totalEntries > 1 ? `${totalEntries}개의 초서 기록` : '1개의 초서 기록'} • 클릭하여 상세 보기
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 진행도 요약 */}
      <section className="section-card" style={{gridColumn: '1/-1', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #ffd70022, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
        <div className="title-section" style={{fontSize:'1rem', color:'#ffd700', marginBottom:16}}>진행도 요약</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:16}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'1.5rem', fontWeight:800, color:'#4f8cff', marginBottom:4}}>{totalSkills}</div>
            <div style={{fontSize:'0.8rem', color:'#bfc9d9', marginBottom:8}}>보유 스킬</div>
            <div style={{width:'100%', height:6, background:'rgba(79,140,255,0.2)', borderRadius:3, overflow:'hidden'}}>
              <div style={{width:'100%', height:'100%', background:'linear-gradient(90deg, #4f8cff 0%, #a78bfa 100%)', borderRadius:3}}></div>
            </div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'1.5rem', fontWeight:800, color:'#ffd700', marginBottom:4}}>{achievedTitles}</div>
            <div style={{fontSize:'0.8rem', color:'#bfc9d9', marginBottom:8}}>달성 칭호</div>
            <div style={{width:'100%', height:6, background:'rgba(255,215,0,0.2)', borderRadius:3, overflow:'hidden'}}>
              <div style={{width:`${titleProgress}%`, height:'100%', background:'linear-gradient(90deg, #ffd700 0%, #ffed4e 100%)', borderRadius:3}}></div>
            </div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'1.5rem', fontWeight:800, color:'#a78bfa', marginBottom:4}}>{achievedBadges}</div>
            <div style={{fontSize:'0.8rem', color:'#bfc9d9', marginBottom:8}}>달성 뱃지</div>
            <div style={{width:'100%', height:6, background:'rgba(167,139,250,0.2)', borderRadius:3, overflow:'hidden'}}>
              <div style={{width:`${badgeProgress}%`, height:'100%', background:'linear-gradient(90deg, #a78bfa 0%, #c084fc 100%)', borderRadius:3}}></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

