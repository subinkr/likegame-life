'use client';
import { useState, useEffect } from 'react';

interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reward: number; // 보상 금액
  rewardType: 'money' | 'item' | 'service';
  createdBy: string;
  acceptedBy?: string;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  location?: string;
  deadline?: string;
  createdAt: string;
  interests: string[];
}

interface Party {
  id: string;
  name: string;
  description: string;
  interests: string[];
  leader: string;
  members: string[];
  maxMembers: number;
  questId?: string;
}

interface UserInterest {
  id: string;
  name: string;
  category: 'exercise' | 'study' | 'hobby' | 'social' | 'career' | 'health';
}

export default function GuildPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [activeTab, setActiveTab] = useState<'quests' | 'parties' | 'interests'>('quests');
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    difficulty: 'medium' as const,
    reward: 0,
    rewardType: 'money' as const,
    location: '',
    deadline: ''
  });
  const [newParty, setNewParty] = useState({
    name: '',
    description: '',
    interests: [] as string[],
    maxMembers: 4
  });

  // 초기 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedQuests = localStorage.getItem('likegame-guild-quests');
      const savedParties = localStorage.getItem('likegame-guild-parties');
      const savedInterests = localStorage.getItem('likegame-user-interests');
      
      if (savedQuests) {
        try {
          setQuests(JSON.parse(savedQuests));
        } catch {}
      }
      if (savedParties) {
        try {
          setParties(JSON.parse(savedParties));
        } catch {}
      }
      if (savedInterests) {
        try {
          setUserInterests(JSON.parse(savedInterests));
        } catch {}
      }
    }
  }, []);

  // 데이터 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('likegame-guild-quests', JSON.stringify(quests));
      localStorage.setItem('likegame-guild-parties', JSON.stringify(parties));
      localStorage.setItem('likegame-user-interests', JSON.stringify(userInterests));
    }
  }, [quests, parties, userInterests]);

  // 초기 퀘스트 데이터 생성
  useEffect(() => {
    if (quests.length === 0) {
      const initialQuests: Quest[] = [
        {
          id: '1',
          title: '바퀴벌레 잡아주세요',
          description: '집에 바퀴벌레가 너무 많아요. 전문적으로 잡아주실 분 구합니다.',
          difficulty: 'easy',
          reward: 50000,
          rewardType: 'money',
          createdBy: '김민수',
          status: 'open',
          location: '강남구 역삼동',
          deadline: '2024-02-15',
          createdAt: '2024-02-10',
          interests: ['social']
        },
        {
          id: '2',
          title: '컴퓨터 수리 도와주세요',
          description: '노트북이 느려져서 포맷하고 프로그램 재설치 도와주세요.',
          difficulty: 'medium',
          reward: 100000,
          rewardType: 'money',
          createdBy: '이영희',
          status: 'open',
          location: '서초구 서초동',
          deadline: '2024-02-20',
          createdAt: '2024-02-12',
          interests: ['tech']
        },
        {
          id: '3',
          title: '수학 과외 선생님',
          description: '고등학교 2학년 수학 과외 선생님 구합니다. 주 2회, 2시간씩.',
          difficulty: 'hard',
          reward: 200000,
          rewardType: 'money',
          createdBy: '박철수',
          status: 'in-progress',
          acceptedBy: '김선생',
          location: '마포구 합정동',
          deadline: '2024-03-01',
          createdAt: '2024-02-08',
          interests: ['education']
        }
      ];
      setQuests(initialQuests);
    }
  }, [quests.length]);

  // 초기 관심사 데이터
  const availableInterests: UserInterest[] = [
    { id: '1', name: '운동', category: 'exercise' },
    { id: '2', name: '독서', category: 'study' },
    { id: '3', name: '여행', category: 'hobby' },
    { id: '4', name: '봉사활동', category: 'social' },
    { id: '5', name: '자격증', category: 'career' },
    { id: '6', name: '건강관리', category: 'health' }
  ];

  const createQuest = () => {
    if (newQuest.title && newQuest.description && newQuest.reward > 0) {
      const quest: Quest = {
        id: Date.now().toString(),
        title: newQuest.title,
        description: newQuest.description,
        difficulty: newQuest.difficulty,
        reward: newQuest.reward,
        rewardType: newQuest.rewardType,
        createdBy: '나',
        status: 'open',

        location: newQuest.location,
        deadline: newQuest.deadline,
        createdAt: new Date().toISOString().split('T')[0],
        interests: []
      };
      setQuests(prev => [...prev, quest]);
      setNewQuest({ 
        title: '', 
        description: '', 
        difficulty: 'medium', 
        reward: 0, 
        rewardType: 'money', 
        location: '', 
        deadline: '' 
      });
    }
  };

  const acceptQuest = (questId: string) => {
    setQuests(prev => prev.map(quest => 
      quest.id === questId && quest.status === 'open'
        ? { ...quest, status: 'in-progress', acceptedBy: '나' }
        : quest
    ));
  };

  const completeQuest = (questId: string) => {
    setQuests(prev => prev.map(quest => 
      quest.id === questId && quest.createdBy === '나'
        ? { ...quest, status: 'completed' }
        : quest
    ));
  };

  const cancelQuest = (questId: string) => {
    setQuests(prev => prev.map(quest => 
      quest.id === questId
        ? { ...quest, status: 'cancelled' }
        : quest
    ));
  };

  const createParty = () => {
    if (newParty.name && newParty.description) {
      const party: Party = {
        id: Date.now().toString(),
        name: newParty.name,
        description: newParty.description,
        interests: newParty.interests,
        leader: '나',
        members: ['나'],
        maxMembers: newParty.maxMembers
      };
      setParties(prev => [...prev, party]);
      setNewParty({ name: '', description: '', interests: [], maxMembers: 4 });
    }
  };

  const joinParty = (partyId: string) => {
    setParties(prev => prev.map(party => 
      party.id === partyId && !party.members.includes('나')
        ? { ...party, members: [...party.members, '나'] }
        : party
    ));
  };

  const leaveParty = (partyId: string) => {
    setParties(prev => prev.map(party => 
      party.id === partyId
        ? { ...party, members: party.members.filter(member => member !== '나') }
        : party
    ));
  };

  const abandonQuest = (questId: string) => {
    setQuests(prev => prev.map(quest => 
      quest.id === questId && quest.acceptedBy === '나'
        ? { ...quest, status: 'open', acceptedBy: undefined }
        : quest
    ));
  };

  const toggleInterest = (interestId: string) => {
    setUserInterests(prev => {
      const exists = prev.find(i => i.id === interestId);
      if (exists) {
        return prev.filter(i => i.id !== interestId);
      } else {
        const interest = availableInterests.find(i => i.id === interestId);
        return interest ? [...prev, interest] : prev;
      }
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#34d399';
      case 'medium': return '#fbbf24';
      case 'hard': return '#f87171';
      default: return '#9ca3af';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return '알 수 없음';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#4f8cff';
      case 'in-progress': return '#fbbf24';
      case 'completed': return '#34d399';
      case 'cancelled': return '#f87171';
      default: return '#9ca3af';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return '모집중';
      case 'in-progress': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      default: return '알 수 없음';
    }
  };



  const getInterestColor = (category: string) => {
    switch (category) {
      case 'exercise': return '#34d399';
      case 'study': return '#a78bfa';
      case 'hobby': return '#fbbf24';
      case 'social': return '#4f8cff';
      case 'career': return '#ffd700';
      case 'health': return '#f87171';
      default: return '#9ca3af';
    }
  };

  // 관심사 기반 추천 파티
  const getRecommendedParties = () => {
    const userInterestIds = userInterests.map(i => i.id);
    return parties.filter(party => 
      party.interests.some(interest => userInterestIds.includes(interest))
    );
  };

  // 내가 생성한 퀘스트
  const myCreatedQuests = quests.filter(quest => quest.createdBy === '나');
  
  // 내가 수락한 퀘스트
  const myAcceptedQuests = quests.filter(quest => quest.acceptedBy === '나');

  return (
    <main className="main-grid" style={{minHeight: '100vh', paddingBottom: '80px'}}>
      {/* 헤더 */}
      <section className="section-card" style={{gridColumn: '1/-1', textAlign: 'center'}}>
        <h1 className="title-main">길드</h1>
        <div className="text-sub">서로 도움을 주고받는 공간입니다</div>
      </section>

      {/* 탭 네비게이션 */}
      <section className="section-card" style={{gridColumn: '1/-1', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #4f8cff22, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
        <div style={{display:'flex', gap:8}}>
          <button
            onClick={() => setActiveTab('quests')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'quests' ? 'linear-gradient(135deg,#4f8cff 0%,#a78bfa 100%)' : 'rgba(79,140,255,0.1)',
              color: activeTab === 'quests' ? '#fff' : '#4f8cff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            퀘스트
          </button>
          <button
            onClick={() => setActiveTab('parties')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'parties' ? 'linear-gradient(135deg,#ffd700 0%,#ffed4e 100%)' : 'rgba(255,215,0,0.1)',
              color: activeTab === 'parties' ? '#fff' : '#ffd700',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            파티
          </button>
          <button
            onClick={() => setActiveTab('interests')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'interests' ? 'linear-gradient(135deg,#34d399 0%,#10b981 100%)' : 'rgba(52,211,153,0.1)',
              color: activeTab === 'interests' ? '#fff' : '#34d399',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            관심사
          </button>
        </div>
      </section>

      {/* 퀘스트 탭 */}
      {activeTab === 'quests' && (
        <>
          {/* 새 퀘스트 생성 */}
          <section className="section-card" style={{gridColumn: '1/-1', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #4f8cff22, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
            <div className="title-section" style={{fontSize:'1rem', color:'#4f8cff', marginBottom:16}}>도움 요청하기</div>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <div>
                <div style={{fontSize:'0.8rem', color:'#4f8cff', marginBottom:4, fontWeight:600}}>제목</div>
                <input
                  type="text"
                  placeholder="어떤 도움이 필요하신가요? (예: 바퀴벌레 잡아주세요)"
                  value={newQuest.title}
                  onChange={(e) => setNewQuest(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(79,140,255,0.3)',
                    background: 'rgba(34,40,60,0.8)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    width: '100%'
                  }}
                />
              </div>
              <div>
                <div style={{fontSize:'0.8rem', color:'#4f8cff', marginBottom:4, fontWeight:600}}>내용</div>
                <textarea
                  placeholder="구체적인 내용을 설명해주세요"
                  value={newQuest.description}
                  onChange={(e) => setNewQuest(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(79,140,255,0.3)',
                    background: 'rgba(34,40,60,0.8)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    minHeight: '80px',
                    resize: 'vertical',
                    width: '100%'
                  }}
                />
              </div>
              <div>
                <div style={{fontSize:'0.8rem', color:'#4f8cff', marginBottom:4, fontWeight:600}}>난이도</div>
                <select
                  value={newQuest.difficulty}
                  onChange={(e) => setNewQuest(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(79,140,255,0.3)',
                    background: 'rgba(34,40,60,0.8)',
                    color: '#fff',
                    fontSize: '0.8rem',
                    width: '100%'
                  }}
                >
                  <option value="easy">쉬움</option>
                  <option value="medium">보통</option>
                  <option value="hard">어려움</option>
                </select>
              </div>
              <div style={{display:'flex', gap:12, alignItems:'flex-end'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.8rem', color:'#4f8cff', marginBottom:4, fontWeight:600}}>사례금</div>
                  <input
                    type="number"
                    placeholder="지불할 금액을 입력하세요"
                    value={newQuest.reward}
                    onChange={(e) => setNewQuest(prev => ({ ...prev, reward: parseInt(e.target.value) || 0 }))}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(79,140,255,0.3)',
                      background: 'rgba(34,40,60,0.8)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      width: '100%'
                    }}
                  />
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.8rem', color:'#4f8cff', marginBottom:4, fontWeight:600}}>위치</div>
                  <input
                    type="text"
                    placeholder="위치 (예: 강남구 역삼동)"
                    value={newQuest.location}
                    onChange={(e) => setNewQuest(prev => ({ ...prev, location: e.target.value }))}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(79,140,255,0.3)',
                      background: 'rgba(34,40,60,0.8)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      width: '100%'
                    }}
                  />
                </div>
              </div>
              <button
                onClick={createQuest}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg,#4f8cff 0%,#a78bfa 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                도움 요청하기
              </button>
            </div>
          </section>

          {/* 전체 퀘스트 목록 */}
          <section className="section-card" style={{gridColumn: '1/-1', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #ffd70022, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
            <div className="title-section" style={{fontSize:'1rem', color:'#ffd700', marginBottom:16}}>도움 요청 목록</div>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              {quests.filter(quest => quest.status === 'open').map(quest => (
                <div key={quest.id} style={{
                  padding: '16px',
                  background: 'rgba(255,215,0,0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,215,0,0.2)'
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700, color:'#fff', fontSize:'0.9rem', marginBottom:4}}>{quest.title}</div>
                      <div style={{fontSize:11, color:'#bfc9d9', marginBottom:8, lineHeight:1.4}}>{quest.description}</div>
                      <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: `rgba(${getDifficultyColor(quest.difficulty)},0.2)`,
                          color: getDifficultyColor(quest.difficulty),
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}>
                          {getDifficultyText(quest.difficulty)}
                        </span>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255,215,0,0.2)',
                          color: '#ffd700',
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}>
                          {quest.reward.toLocaleString()}원
                        </span>

                        {quest.location && (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(52,211,153,0.2)',
                            color: '#34d399',
                            fontSize: '0.7rem'
                          }}>
                            📍 {quest.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'0.7rem', color:'#94a3b8', marginBottom:4}}>요청자: {quest.createdBy}</div>
                      <div style={{fontSize:'0.7rem', color:'#94a3b8'}}>등록일: {quest.createdAt}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => acceptQuest(quest.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'rgba(79,140,255,0.2)',
                      color: '#4f8cff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    도움 주기
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 내가 생성한 퀘스트 */}
          {myCreatedQuests.length > 0 && (
            <section className="section-card" style={{gridColumn: '1/-1', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #34d39922, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
              <div className="title-section" style={{fontSize:'1rem', color:'#34d399', marginBottom:16}}>내가 요청한 도움</div>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {myCreatedQuests.map(quest => (
                  <div key={quest.id} style={{
                    padding: '16px',
                    background: 'rgba(52,211,153,0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(52,211,153,0.2)'
                  }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700, color:'#fff', fontSize:'0.9rem', marginBottom:4}}>{quest.title}</div>
                        <div style={{fontSize:11, color:'#bfc9d9', marginBottom:8, lineHeight:1.4}}>{quest.description}</div>
                        <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: `rgba(${getStatusColor(quest.status)},0.2)`,
                            color: getStatusColor(quest.status),
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}>
                            {getStatusText(quest.status)}
                          </span>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255,215,0,0.2)',
                            color: '#ffd700',
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}>
                            {quest.reward.toLocaleString()}원
                          </span>
                          {quest.acceptedBy && (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: 'rgba(167,139,250,0.2)',
                              color: '#a78bfa',
                              fontSize: '0.7rem'
                            }}>
                              도움주는 사람: {quest.acceptedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {quest.status === 'open' && (
                      <button
                        onClick={() => cancelQuest(quest.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'rgba(255,107,107,0.2)',
                          color: '#f87171',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        요청 취소
                      </button>
                    )}
                    {quest.status === 'in-progress' && (
                      <button
                        onClick={() => completeQuest(quest.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'rgba(52,211,153,0.2)',
                          color: '#34d399',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        완료하기
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 내가 수락한 퀘스트 */}
          {myAcceptedQuests.length > 0 && (
            <section className="section-card" style={{gridColumn: '1/-1', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #a78bfa22, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
              <div className="title-section" style={{fontSize:'1rem', color:'#a78bfa', marginBottom:16}}>내가 도움주는 일</div>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {myAcceptedQuests.map(quest => (
                  <div key={quest.id} style={{
                    padding: '16px',
                    background: 'rgba(167,139,250,0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(167,139,250,0.2)'
                  }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700, color:'#fff', fontSize:'0.9rem', marginBottom:4}}>{quest.title}</div>
                        <div style={{fontSize:11, color:'#bfc9d9', marginBottom:8, lineHeight:1.4}}>{quest.description}</div>
                        <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: `rgba(${getStatusColor(quest.status)},0.2)`,
                            color: getStatusColor(quest.status),
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}>
                            {getStatusText(quest.status)}
                          </span>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255,215,0,0.2)',
                            color: '#ffd700',
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}>
                            {quest.reward.toLocaleString()}원
                          </span>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(79,140,255,0.2)',
                            color: '#4f8cff',
                            fontSize: '0.7rem'
                          }}>
                            요청자: {quest.createdBy}
                          </span>
                        </div>
                      </div>
                    </div>
                    {quest.status === 'in-progress' && (
                      <button
                        onClick={() => abandonQuest(quest.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'rgba(255,107,107,0.2)',
                          color: '#f87171',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        포기하기
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* 파티 탭 */}
      {activeTab === 'parties' && (
        <>
          {/* 새 파티 생성 */}
          <section className="section-card" style={{gridColumn: '1/-1', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #ffd70022, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
            <div className="title-section" style={{fontSize:'1rem', color:'#ffd700', marginBottom:16}}>새 파티 생성</div>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <input
                type="text"
                placeholder="파티 이름"
                value={newParty.name}
                onChange={(e) => setNewParty(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,215,0,0.3)',
                  background: 'rgba(34,40,60,0.8)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
              <textarea
                placeholder="파티 설명"
                value={newParty.description}
                onChange={(e) => setNewParty(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,215,0,0.3)',
                  background: 'rgba(34,40,60,0.8)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <select
                  value={newParty.maxMembers}
                  onChange={(e) => setNewParty(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,215,0,0.3)',
                    background: 'rgba(34,40,60,0.8)',
                    color: '#fff',
                    fontSize: '0.8rem'
                  }}
                >
                  <option value={2}>2명</option>
                  <option value={3}>3명</option>
                  <option value={4}>4명</option>
                  <option value={5}>5명</option>
                </select>
                <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>최대 인원</div>
              </div>
              <button
                onClick={createParty}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg,#ffd700 0%,#ffed4e 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                파티 생성
              </button>
            </div>
          </section>

          {/* 추천 파티 */}
          <section className="section-card" style={{gridColumn: '1/-1', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #34d39922, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
            <div className="title-section" style={{fontSize:'1rem', color:'#34d399', marginBottom:16}}>관심사 기반 추천 파티</div>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              {getRecommendedParties().map(party => (
                <div key={party.id} style={{
                  padding: '16px',
                  background: 'rgba(52,211,153,0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(52,211,153,0.2)'
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700, color:'#fff', fontSize:'0.9rem', marginBottom:4}}>{party.name}</div>
                      <div style={{fontSize:11, color:'#bfc9d9', marginBottom:8, lineHeight:1.4}}>{party.description}</div>
                      <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                        {party.interests.map(interestId => {
                          const interest = availableInterests.find(i => i.id === interestId);
                          return interest ? (
                            <span key={interestId} style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: `rgba(${getInterestColor(interest.category)},0.2)`,
                              color: getInterestColor(interest.category),
                              fontSize: '0.6rem'
                            }}>
                              {interest.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'0.7rem', color:'#94a3b8', marginBottom:4}}>파티장: {party.leader}</div>
                      <div style={{fontSize:'0.7rem', color:'#94a3b8'}}>{party.members.length}/{party.maxMembers}명</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (party.members.includes('나')) {
                        leaveParty(party.id);
                      } else {
                        joinParty(party.id);
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: party.members.includes('나') ? 'rgba(255,107,107,0.2)' : 'rgba(52,211,153,0.2)',
                      color: party.members.includes('나') ? '#f87171' : '#34d399',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    {party.members.includes('나') ? '나가기' : '참가하기'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 전체 파티 목록 */}
          <section className="section-card" style={{gridColumn: '1/-1', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #a78bfa22, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
            <div className="title-section" style={{fontSize:'1rem', color:'#a78bfa', marginBottom:16}}>전체 파티 목록</div>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              {parties.map(party => (
                <div key={party.id} style={{
                  padding: '16px',
                  background: 'rgba(167,139,250,0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(167,139,250,0.2)'
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700, color:'#fff', fontSize:'0.9rem', marginBottom:4}}>{party.name}</div>
                      <div style={{fontSize:11, color:'#bfc9d9', marginBottom:8, lineHeight:1.4}}>{party.description}</div>
                      <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                        {party.interests.map(interestId => {
                          const interest = availableInterests.find(i => i.id === interestId);
                          return interest ? (
                            <span key={interestId} style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: `rgba(${getInterestColor(interest.category)},0.2)`,
                              color: getInterestColor(interest.category),
                              fontSize: '0.6rem'
                            }}>
                              {interest.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'0.7rem', color:'#94a3b8', marginBottom:4}}>파티장: {party.leader}</div>
                      <div style={{fontSize:'0.7rem', color:'#94a3b8'}}>{party.members.length}/{party.maxMembers}명</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (party.members.includes('나')) {
                        leaveParty(party.id);
                      } else {
                        joinParty(party.id);
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: party.members.includes('나') ? 'rgba(255,107,107,0.2)' : 'rgba(167,139,250,0.2)',
                      color: party.members.includes('나') ? '#f87171' : '#a78bfa',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    {party.members.includes('나') ? '나가기' : '참가하기'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* 관심사 탭 */}
      {activeTab === 'interests' && (
        <section className="section-card" style={{gridColumn: '1/-1', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #34d39922, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
          <div className="title-section" style={{fontSize:'1rem', color:'#34d399', marginBottom:16}}>관심사 설정</div>
          <div style={{fontSize:'0.8rem', color:'#94a3b8', marginBottom:16}}>관심사를 설정하면 비슷한 관심사를 가진 사람들과 파티를 만들 수 있습니다.</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:12}}>
            {availableInterests.map(interest => {
              const isSelected = userInterests.some(i => i.id === interest.id);
              return (
                <div
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  style={{
                    padding: '16px',
                    background: isSelected ? `rgba(${getInterestColor(interest.category)},0.2)` : 'rgba(52,211,153,0.05)',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? getInterestColor(interest.category) : 'rgba(52,211,153,0.2)'}`,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{fontSize:'2rem', marginBottom:8}}>
                    {interest.category === 'exercise' && '💪'}
                    {interest.category === 'study' && '📚'}
                    {interest.category === 'hobby' && '🎨'}
                    {interest.category === 'social' && '🤝'}
                    {interest.category === 'career' && '💼'}
                    {interest.category === 'health' && '🏥'}
                  </div>
                  <div style={{
                    fontWeight: 600,
                    color: isSelected ? getInterestColor(interest.category) : '#fff',
                    fontSize: '0.8rem'
                  }}>
                    {interest.name}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
} 