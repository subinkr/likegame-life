'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { questsAPI, partiesAPI, chatAPI, apiRequest } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';

interface Quest {
  id: string;
  title: string;
  description: string;
  location: string;
  reward: number;
  rewardPaid?: boolean;
  status: string;
  creator_id: string;
  creator: {
    id: string;
    nickname: string;
  };
  accepted_by_user_id?: string;
  accepted_by_user?: {
    id: string;
    nickname: string;
  };
}

interface Party {
  id: string;
  name: string;
  description: string;
  maxMembers: number;
  leader: {
    id: string;
    nickname: string;
  };
  members: Array<{
    id: string;
    nickname: string;
  }>;
}

function GuildPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 무한스크롤 상태
  const [questsPage, setQuestsPage] = useState(1);
  const [partiesPage, setPartiesPage] = useState(1);
  const [hasMoreQuests, setHasMoreQuests] = useState(true);
  const [hasMoreParties, setHasMoreParties] = useState(true);
  const [loadingMoreQuests, setLoadingMoreQuests] = useState(false);
  const [loadingMoreParties, setLoadingMoreParties] = useState(false);
  
  // URL 파라미터에서 탭 상태 읽기
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'quests' | 'parties'>(
    tabParam === 'parties' ? 'parties' : 'quests'
  );
  
  const [showCreateQuest, setShowCreateQuest] = useState(false);
  const [showCreateParty, setShowCreateParty] = useState(false);
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    location: '',
    reward: 0
  });
  const [newParty, setNewParty] = useState({
    name: '',
    description: '',
    maxMembers: 4
  });

  // URL 파라미터가 변경될 때 탭 상태 업데이트
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'parties') {
      setActiveTab('parties');
    } else {
      setActiveTab('quests');
    }
  }, [searchParams]);

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (tab: 'quests' | 'parties') => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    if (tab === 'parties') {
      params.set('tab', 'parties');
    } else {
      params.set('tab', 'quests');
    }
    router.push(`/guild?${params.toString()}`);
  };

  useEffect(() => {
    fetchQuests();
    fetchParties();
  }, []);

  const fetchQuests = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMoreQuests(true);
      }

      const data = await questsAPI.get(page, 10);
      
      if (append) {
        setQuests(prev => [...prev, ...(data.quests || [])]);
      } else {
        setQuests(data.quests || []);
      }
      
      setHasMoreQuests(data.pagination?.hasNextPage || false);
      setQuestsPage(page);
    } finally {
      setLoading(false);
      setLoadingMoreQuests(false);
    }
  };

  const fetchParties = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMoreParties(true);
      }

      const data = await partiesAPI.get(page, 10);
      
      if (append) {
        setParties(prev => [...prev, ...(data.parties || [])]);
      } else {
        setParties(data.parties || []);
      }
      
      setHasMoreParties(data.pagination?.hasNextPage || false);
      setPartiesPage(page);
    } finally {
      setLoading(false);
      setLoadingMoreParties(false);
    }
  };

  // 무한스크롤을 위한 Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === 'quests' && hasMoreQuests && !loadingMoreQuests) {
            loadMoreQuests();
          } else if (activeTab === 'parties' && hasMoreParties && !loadingMoreParties) {
            loadMoreParties();
          }
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [activeTab, hasMoreQuests, hasMoreParties, loadingMoreQuests, loadingMoreParties]);

  const loadMoreQuests = () => {
    if (hasMoreQuests && !loadingMoreQuests) {
      fetchQuests(questsPage + 1, true);
    }
  };

  const loadMoreParties = () => {
    if (hasMoreParties && !loadingMoreParties) {
      fetchParties(partiesPage + 1, true);
    }
  };

    const createQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await questsAPI.create(newQuest);
      setNewQuest({ title: '', description: '', location: '', reward: 0 });
      setShowCreateQuest(false);
      fetchQuests();
    } catch (error) {
      alert('퀘스트 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

    const createParty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await partiesAPI.create(newParty);
      setNewParty({ name: '', description: '', maxMembers: 4 });
      setShowCreateParty(false);
      fetchParties();
    } catch (error) {
      alert('파티 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

    const acceptQuest = async (questId: string) => {
    try {
      await questsAPI.accept(questId);
      fetchQuests();
    } catch (error) {
      alert('퀘스트 수락에 실패했습니다. 다시 시도해주세요.');
    }
  };

    const cancelQuest = async (questId: string) => {
    // 확인 절차
    if (!confirm('정말로 이 퀘스트를 취소하시겠습니까?')) {
      return;
    }

    try {
      await questsAPI.cancel(questId);
      fetchQuests();
    } catch (error) {
      alert('퀘스트 취소에 실패했습니다. 다시 시도해주세요.');
    }
  };

    const completeQuest = async (questId: string) => {
    try {
      await questsAPI.complete(questId);
      fetchQuests();
    } catch (error) {
      alert('퀘스트 완료 처리에 실패했습니다. 다시 시도해주세요.');
    }
  };



  const abandonQuest = async (questId: string) => {
    // 확인 절차
    if (!confirm('정말로 이 퀘스트를 포기하시겠습니까?')) {
      return;
    }

    try {
      // 퀘스트 포기
      await questsAPI.abandon(questId);
      fetchQuests();
    } catch (error) {
      alert('퀘스트 포기에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const joinParty = async (partyId: string) => {
    try {
      await partiesAPI.join(partyId);
      fetchParties();
    } catch (error) {
      alert('파티 참가에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const leaveParty = async (partyId: string) => {
    try {
      await partiesAPI.leave(partyId);
      fetchParties();
    } catch (error) {
      alert('파티 탈퇴에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const kickMember = async (partyId: string, memberId: string) => {
    // 확인 절차
    if (!confirm('정말로 이 멤버를 추방하시겠습니까?')) {
      return;
    }

    try {
      await partiesAPI.kick(partyId, memberId);
      fetchParties();
    } catch (error) {
      alert('멤버 추방에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const disbandParty = async (partyId: string) => {
    // 확인 절차
    if (!confirm('정말로 파티를 해산하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      await partiesAPI.disband(partyId);
      fetchParties();
    } catch (error) {
      alert('파티 해산에 실패했습니다.');
    }
  };

  // 채팅방으로 이동하는 함수
  const goToChatRoom = async (type: 'quest' | 'party', id: string) => {
    try {
      // 퀘스트인 경우: 생성자이거나 수락한 퀘스트인지 확인
      if (type === 'quest') {
        const quest = quests.find(q => q.id === id);
        if (!quest) {
          alert('퀘스트를 찾을 수 없습니다.');
          return;
        }
        
        const isCreator = quest.creator.id === user?.id;
                            const isAcceptor = quest.accepted_by_user_id === user?.id;
        
        if (!isCreator && !isAcceptor) {
          alert('퀘스트 채팅방에 접근할 수 없습니다.\n\n퀘스트 생성자이거나 수락한 후 채팅방에 입장할 수 있습니다.');
          return;
        }
      }
      
      // 파티인 경우: 파티 멤버인지 확인
      if (type === 'party') {
        const party = parties.find(p => p.id === id);
        if (!party) {
          alert('파티를 찾을 수 없습니다.');
          return;
        }
        
        const isMember = party.members.some(member => member.id === user?.id) || party.leader.id === user?.id;
        if (!isMember) {
          alert('파티 채팅방에 접근할 수 없습니다.\n\n파티에 참가한 후 채팅방에 입장할 수 있습니다.');
          return;
        }
      }
      
      // 권한 확인 후 채팅방으로 이동
      const chatRoom = type === 'quest' 
        ? await chatAPI.getRoomByQuest(id)
        : await chatAPI.getRoomByParty(id);
      
      if (chatRoom) {
        router.push(`/chat/${chatRoom.id}`);
      } else {
        if (type === 'quest') {
          alert('퀘스트 채팅방을 찾을 수 없습니다.\n\n퀘스트를 수락한 후 다시 시도해주세요.');
        } else {
          alert('파티 채팅방을 찾을 수 없습니다.\n\n파티에 참가한 후 다시 시도해주세요.');
        }
      }
    } catch (error) {
      if (type === 'quest') {
        alert('퀘스트 채팅방으로 이동하는데 실패했습니다.\n\n퀘스트를 수락한 후 다시 시도해주세요.');
      } else {
        alert('파티 채팅방으로 이동하는데 실패했습니다.\n\n파티에 참가한 후 다시 시도해주세요.');
      }
    }
  };

  const getQuestStatusText = (status: string) => {
    switch (status) {
      case 'OPEN': return '모집중';
      case 'IN_PROGRESS': return '진행중';
      case 'COMPLETED': return '완료';
      case 'CANCELLED': return '취소됨';
      default: return status;
    }
  };

  const getQuestStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return { bg: 'rgba(0,255,0,0.2)', color: '#00ff00' };
      case 'IN_PROGRESS': return { bg: 'rgba(255,165,0,0.2)', color: '#ffa500' };
      case 'COMPLETED': return { bg: 'rgba(0,255,255,0.2)', color: '#00ffff' };
      case 'CANCELLED': return { bg: 'rgba(255,0,0,0.2)', color: '#ff0000' };
      default: return { bg: 'rgba(128,128,128,0.2)', color: '#808080' };
    }
  };

  return (
    <div style={{ 
      padding: '16px', 
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100dvh - 120px)'
    }}>
      {/* 스크롤 가능한 메인 콘텐츠 영역 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flex: 1
      }}>
          {loading ? (
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
              background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
              zIndex: 1000
            }}>
              <div style={{ 
                fontSize: '3rem',
                animation: 'pulse 2s ease-in-out infinite',
                filter: 'drop-shadow(0 0 15px rgba(0, 255, 255, 0.8))'
              }}>⚔️</div>
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
          ) : (
        <>
          {/* 탭 네비게이션 */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => handleTabChange('quests')}
              style={{
                flex: 1,
                padding: '6px',
                background: activeTab === 'quests' ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.1)',
                border: activeTab === 'quests' ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.3)',
                borderRadius: '4px',
                color: '#ffd700',
                fontSize: '0.75rem',
                fontFamily: 'Press Start 2P, cursive',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'quests') {
                  e.currentTarget.style.background = 'rgba(255,215,0,0.2)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(255,215,0,0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'quests') {
                  e.currentTarget.style.background = 'rgba(255,215,0,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
                              퀘스트
            </button>
            <button
              onClick={() => handleTabChange('parties')}
              style={{
                flex: 1,
                padding: '6px',
                background: activeTab === 'parties' ? 'rgba(0,255,0,0.2)' : 'rgba(0,255,0,0.1)',
                border: activeTab === 'parties' ? '2px solid #00ff00' : '1px solid rgba(0,255,0,0.3)',
                borderRadius: '4px',
                color: '#00ff00',
                fontSize: '0.75rem',
                fontFamily: 'Press Start 2P, cursive',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'parties') {
                  e.currentTarget.style.background = 'rgba(0,255,0,0.2)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,0,0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'parties') {
                  e.currentTarget.style.background = 'rgba(0,255,0,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
                              파티
            </button>
          </div>

          {activeTab === 'quests' && (
            <div>
              <div style={{ 
                background: 'rgba(255,215,0,0.05)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => setShowCreateQuest(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,215,0,0.2)',
                    border: '2px solid rgba(255,215,0,0.5)',
                    color: '#ffd700',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    fontFamily: 'Press Start 2P, cursive'
                  }}
                >
                  ⚔️ 퀘스트 생성
                </button>
              </div>

              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '8px',
                padding: '4px'
              }}>
                {quests
                  .filter(quest => quest.status !== 'CANCELLED' && quest.status !== 'COMPLETED') // 취소된 퀘스트와 완료된 퀘스트 제외
                  .filter(quest => {
                    // 내가 받은 의뢰 (내가 수락한 퀘스트)
                    const isAccepted = quest.accepted_by_user_id === user?.id;
                    // 내가 생성한 퀘스트 (모든 상태)
                    const isMyQuest = quest.creator.id === user?.id;
                    // 모집 중인 의뢰 (아직 수락되지 않은 퀘스트)
                    const isOpenQuest = quest.status === 'OPEN';
                    

                    
                    return isAccepted || isMyQuest || isOpenQuest;
                  })
                  .map((quest) => {
                    const statusStyle = getQuestStatusColor(quest.status);
                    const isCreator = quest.creator.id === user?.id;
                    const isAccepted = quest.accepted_by_user_id === user?.id;
                  
                  return (
                    <div
                      key={quest.id}
                      style={{
                        padding: '8px',
                        background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,215,0,0.03) 100%)',
                        border: '1px solid rgba(255,215,0,0.3)',
                        borderRadius: '8px',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(255,215,0,0.1)',
                        backdropFilter: 'blur(10px)',
                        cursor: 'pointer',
                        minHeight: '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                      onClick={() => goToChatRoom('quest', quest.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,215,0,0.2)';
                        e.currentTarget.style.borderColor = 'rgba(255,215,0,0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,215,0,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,215,0,0.3)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <h3 style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 'bold', 
                          color: '#ffd700',
                          margin: 0,
                          textShadow: '0 0 10px rgba(255,215,0,0.5)',
                          fontFamily: 'Press Start 2P, cursive',
                          lineHeight: '1.2'
                        }}>
                          {quest.title}
                        </h3>
                        <span style={{
                          padding: '3px 8px',
                          background: `linear-gradient(135deg, ${statusStyle.bg} 0%, ${statusStyle.bg.replace('0.2', '0.3')} 100%)`,
                          color: statusStyle.color,
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          boxShadow: `0 1px 3px ${statusStyle.bg}`,
                          fontFamily: 'Press Start 2P, cursive'
                        }}>
                          {getQuestStatusText(quest.status)}
                        </span>
                      </div>
                      
                      <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '4px',
                        padding: '6px',
                        marginBottom: '6px',
                        flex: 1
                      }}>
                        <p style={{ 
                          margin: '0 0 4px 0', 
                          color: '#cccccc',
                          lineHeight: '1.2',
                          fontSize: '0.75rem'
                        }}>{quest.description}</p>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.7rem',
                          color: '#888888'
                        }}>
                          <span>📍 {quest.location}</span>
                          <span style={{ color: '#ffd700', fontWeight: 'bold' }}>
                            {quest.reward.toLocaleString()}원
                            {quest.rewardPaid && (
                              <span style={{ 
                                marginLeft: '2px', 
                                color: '#00ff00',
                                fontSize: '0.65rem',
                                background: 'rgba(0,255,0,0.2)',
                                padding: '1px 3px',
                                borderRadius: '4px'
                              }}>
                                ✓
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.7rem',
                        marginBottom: '4px'
                      }}>
                        <span style={{ color: '#888888' }}>
                          👤 {quest.creator.nickname}
                        </span>
                        {quest.accepted_by_user && (
                          <span style={{ color: '#00ff00' }}>
                            ✅ {quest.accepted_by_user.nickname}
                          </span>
                        )}
                      </div>

                      {/* 액션 버튼들 */}
                      <div style={{ marginTop: '4px', display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                        {quest.status === 'OPEN' && quest.creator.id !== user?.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              acceptQuest(quest.id);
                            }}
                            style={{
                              padding: '3px 8px',
                              background: 'rgba(0,255,0,0.2)',
                              border: '1px solid rgba(0,255,0,0.5)',
                              color: '#00ff00',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.75rem'
                            }}
                          >
                            수락
                          </button>
                        )}

                        {isCreator && (quest.status === 'OPEN' || quest.status === 'IN_PROGRESS') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelQuest(quest.id);
                            }}
                            style={{
                              padding: '3px 8px',
                              background: 'rgba(255,0,0,0.2)',
                              border: '1px solid rgba(255,0,0,0.5)',
                              color: '#ff0000',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.75rem'
                            }}
                          >
                            취소
                          </button>
                        )}

                        {isCreator && quest.status === 'IN_PROGRESS' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              completeQuest(quest.id);
                            }}
                            style={{
                              padding: '2px 6px',
                              background: 'rgba(0,255,255,0.2)',
                              border: '1px solid rgba(0,255,255,0.5)',
                              color: '#00ffff',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.6rem'
                            }}
                          >
                            완료
                          </button>
                        )}

                        {quest.accepted_by_user?.id === user?.id && quest.status === 'IN_PROGRESS' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abandonQuest(quest.id);
                            }}
                            style={{
                              padding: '2px 6px',
                              background: 'rgba(255,165,0,0.2)',
                              border: '1px solid rgba(255,165,0,0.5)',
                              color: '#ffa500',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.6rem'
                            }}
                          >
                            포기
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* 무한스크롤 센티널 */}
                {(hasMoreQuests || loadingMoreQuests) && (
                  <div id="scroll-sentinel" style={{
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '10px'
                  }}>
                    {loadingMoreQuests && (
                      <div style={{
                        color: '#ffd700',
                        fontSize: '0.8rem',
                        fontFamily: 'Press Start 2P, cursive'
                      }}>
                        로딩 중...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'parties' && (
            <div>
              <div style={{ 
                background: 'rgba(0,255,0,0.05)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => setShowCreateParty(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0,255,0,0.2)',
                    border: '2px solid rgba(0,255,0,0.5)',
                    color: '#00ff00',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    fontFamily: 'Press Start 2P, cursive'
                  }}
                >
                  👥 파티 생성
                </button>
              </div>

              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '8px',
                padding: '4px'
              }}>
                {parties
                  .filter(party => {
                    // 내가 리더인 파티 (모든 상태)
                    const isLeader = party.leader.id === user?.id;
                    // 내가 멤버인 파티 (모든 상태)
                    const isMember = party.members.find(m => m.id === user?.id);
                    // 가득 찬 파티는 제 3자에게는 안보임
                    const isFull = party.members.length >= party.maxMembers;
                    
                    return isLeader || isMember || !isFull;
                  })
                  .map((party) => {
                    const isLeader = party.leader.id === user?.id;
                    const isMember = party.members.find(m => m.id === user?.id);
                    const canJoin = !isMember && party.members.length < party.maxMembers;
                    
                    return (
                    <div
                      key={party.id}
                      style={{
                        padding: '8px',
                        background: 'linear-gradient(135deg, rgba(0,255,0,0.08) 0%, rgba(0,255,0,0.03) 100%)',
                        border: '1px solid rgba(0,255,0,0.3)',
                        borderRadius: '8px',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(0,255,0,0.1)',
                        backdropFilter: 'blur(10px)',
                        cursor: 'pointer',
                        minHeight: '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                      onClick={() => goToChatRoom('party', party.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,255,0,0.2)';
                        e.currentTarget.style.borderColor = 'rgba(0,255,0,0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,255,0,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(0,255,0,0.3)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <h3 style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 'bold', 
                          color: '#00ff00',
                          margin: 0,
                          textShadow: '0 0 10px rgba(0,255,0,0.5)',
                          fontFamily: 'Press Start 2P, cursive',
                          lineHeight: '1.2'
                        }}>
                          {party.name}
                        </h3>
                        {isLeader && (
                          <span style={{
                            padding: '3px 8px',
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0.2) 100%)',
                            color: '#ffd700',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            boxShadow: '0 1px 3px rgba(255,215,0,0.3)',
                            fontFamily: 'Press Start 2P, cursive'
                          }}>
                            파티장
                          </span>
                        )}
                      </div>
                      
                      <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '4px',
                        padding: '6px',
                        marginBottom: '6px',
                        flex: 1
                      }}>
                        <p style={{ 
                          margin: '0 0 4px 0', 
                          color: '#cccccc',
                          lineHeight: '1.2',
                          fontSize: '0.75rem'
                        }}>{party.description}</p>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.7rem'
                        }}>
                          <span style={{ color: '#888888' }}>
                            👑 {party.leader.nickname || '익명'}
                          </span>
                          <span style={{ 
                            color: party.members.length >= party.maxMembers ? '#ff0000' : '#888888',
                            fontWeight: party.members.length >= party.maxMembers ? 'bold' : 'normal'
                          }}>
                            {party.members.length}/{party.maxMembers}명
                            {party.members.length >= party.maxMembers && (
                              <span style={{
                                marginLeft: '2px',
                                background: 'rgba(255,0,0,0.2)',
                                padding: '1px 3px',
                                borderRadius: '4px',
                                fontSize: '0.65rem'
                              }}>
                                가득참
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* 멤버 목록 */}
                      <div style={{ margin: '4px 0' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '3px'
                        }}>
                          <span style={{ color: '#888888', fontSize: '0.7rem' }}>
                            멤버:
                          </span>
                          <span style={{ color: '#888888', fontSize: '0.7rem' }}>
                            {party.members.length}명
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                          {party.members.map((member) => (
                            <span
                              key={member.id}
                              style={{
                                padding: '2px 6px',
                                background: member.id === party.leader.id ? 'rgba(255,215,0,0.2)' : 'rgba(0,255,255,0.1)',
                                color: member.id === party.leader.id ? '#ffd700' : '#00ffff',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              {member.nickname || '익명'}
                              {member.id === party.leader.id && '👑'}
                              {isLeader && member.id !== user?.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    kickMember(party.id, member.id);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ff0000',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    padding: '0',
                                    marginLeft: '4px'
                                  }}
                                >
                                  ✕
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* 액션 버튼들 */}
                      <div style={{ marginTop: '4px', display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                        {canJoin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              joinParty(party.id);
                            }}
                            style={{
                              padding: '2px 6px',
                              background: 'rgba(0,255,255,0.2)',
                              border: '1px solid rgba(0,255,255,0.5)',
                              color: '#00ffff',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.6rem'
                            }}
                          >
                            참가
                          </button>
                        )}

                        {!canJoin && !isMember && (
                          <div style={{
                            padding: '3px 8px',
                            background: 'rgba(255,0,0,0.1)',
                            border: '1px solid rgba(255,0,0,0.3)',
                            color: '#ff0000',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            ❌ 파티가 가득 찼습니다
                          </div>
                        )}

                        {isMember && !isLeader && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              leaveParty(party.id);
                            }}
                            style={{
                              padding: '2px 6px',
                              background: 'rgba(255,165,0,0.2)',
                              border: '1px solid rgba(255,165,0,0.5)',
                              color: '#ffa500',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.6rem'
                            }}
                          >
                            나가기
                          </button>
                        )}

                        {isLeader && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              disbandParty(party.id);
                            }}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(255,0,0,0.2)',
                              border: '1px solid rgba(255,0,0,0.5)',
                              color: '#ff0000',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.8rem'
                            }}
                          >
                            해산
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* 무한스크롤 센티널 */}
                {(hasMoreParties || loadingMoreParties) && (
                  <div id="scroll-sentinel" style={{
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '10px'
                  }}>
                    {loadingMoreParties && (
                      <div style={{
                        color: '#00ff00',
                        fontSize: '0.8rem',
                        fontFamily: 'Press Start 2P, cursive'
                      }}>
                        로딩 중...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 퀘스트 생성 모달 */}
          {showCreateQuest && (
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
                  퀘스트 생성
                </h2>
                
                <form onSubmit={createQuest}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                      제목
                    </label>
                    <input
                      type="text"
                      value={newQuest.title}
                      onChange={(e) => setNewQuest({...newQuest, title: e.target.value})}
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
                      설명
                    </label>
                    <textarea
                      value={newQuest.description}
                      onChange={(e) => setNewQuest({...newQuest, description: e.target.value})}
                      required
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(0,255,255,0.3)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                      위치
                    </label>
                    <input
                      type="text"
                      value={newQuest.location}
                      onChange={(e) => setNewQuest({...newQuest, location: e.target.value})}
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
                      원화 보상 (원) <span style={{ color: '#888888', fontSize: '0.8rem' }}>1,000원 이상</span>
                    </label>
                    <input
                      type="number"
                      value={newQuest.reward}
                      onChange={(e) => setNewQuest({...newQuest, reward: parseInt(e.target.value)})}
                      required
                      min="1000"
                      placeholder="예: 50000"
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
                      생성
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateQuest(false)}
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

          {/* 파티 생성 모달 */}
          {showCreateParty && (
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
                  파티 생성
                </h2>
                
                <form onSubmit={createParty}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                      파티명
                    </label>
                    <input
                      type="text"
                      value={newParty.name}
                      onChange={(e) => setNewParty({...newParty, name: e.target.value})}
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
                      설명
                    </label>
                    <textarea
                      value={newParty.description}
                      onChange={(e) => setNewParty({...newParty, description: e.target.value})}
                      required
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(0,255,255,0.3)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                      최대 인원 <span style={{ color: '#888888', fontSize: '0.8rem' }}>(2-6명)</span>
                    </label>
                    <input
                      type="number"
                      value={newParty.maxMembers}
                      onChange={(e) => setNewParty({...newParty, maxMembers: parseInt(e.target.value)})}
                      required
                      min="2"
                      max="6"
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(0,255,255,0.3)',
                        borderRadius: '6px',
                        color: '#ffffff'
                      }}
                    />
                    <p style={{ marginTop: '5px', color: '#888888', fontSize: '0.8rem' }}>
                      💡 파티장 포함 {newParty.maxMembers}명까지 참가 가능합니다
                    </p>
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
                      생성
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateParty(false)}
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
        </>
      )}
      </div>
    </div>
  );
}

export default function GuildPage() {
  return (
    <AuthGuard>
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
        <GuildPageContent />
      </Suspense>
    </AuthGuard>
  );
} 