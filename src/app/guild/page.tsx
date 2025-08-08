'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';
import QuestCard from '@/components/QuestCard';
import PartyCard from '@/components/PartyCard';

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
  
  // URL 파라미터에서 탭 상태 읽기
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'quests' | 'parties'>(
    tabParam === 'parties' ? 'parties' : 'quests'
  );
  
  const [quests, setQuests] = useState<Quest[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddQuestForm, setShowAddQuestForm] = useState(false);
  const [showAddPartyForm, setShowAddPartyForm] = useState(false);
  
  // 무한스크롤 상태
  const [questPage, setQuestPage] = useState(1);
  const [partyPage, setPartyPage] = useState(1);
  const [hasMoreQuests, setHasMoreQuests] = useState(true);
  const [hasMoreParties, setHasMoreParties] = useState(true);
  const [loadingMoreQuests, setLoadingMoreQuests] = useState(false);
  const [loadingMoreParties, setLoadingMoreParties] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchQuests();
      fetchParties();
    }
  }, [user]);

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

  const fetchQuests = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMoreQuests(true);
      }

      const response = await apiRequest(`/quests?page=${page}&limit=10`);
      
      if (append) {
        setQuests(prev => [...prev, ...(response.quests || [])]);
      } else {
        // CANCELLED 퀘스트는 제외
        const filteredQuests = (response.quests || []).filter((quest: Quest) => quest.status !== 'CANCELLED');
        setQuests(filteredQuests);
      }
      
      setHasMoreQuests(response.pagination?.hasNextPage || false);
      setQuestPage(page);
    } catch (error) {
      if (!append) {
        setQuests([]);
      }
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

      const response = await apiRequest(`/parties?page=${page}&limit=10`);
      
      if (append) {
        setParties(prev => [...prev, ...(response.parties || [])]);
      } else {
        setParties(response.parties || []);
      }
      
      setHasMoreParties(response.pagination?.hasNextPage || false);
      setPartyPage(page);
    } catch (error) {
      if (!append) {
        setParties([]);
      }
    } finally {
      setLoading(false);
      setLoadingMoreParties(false);
    }
  };

  const loadMoreQuests = () => {
    if (hasMoreQuests && !loadingMoreQuests) {
      fetchQuests(questPage + 1, true);
    }
  };

  const loadMoreParties = () => {
    if (hasMoreParties && !loadingMoreParties) {
      fetchParties(partyPage + 1, true);
    }
  };

    const createQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const reward = parseInt(formData.get('reward') as string);

    try {
      await apiRequest('/quests', {
        method: 'POST',
        body: JSON.stringify({ title, description, location, reward })
      });
      setShowAddQuestForm(false);
      fetchQuests();
    } catch (error) {
      console.error('퀘스트 생성 실패:', error);
    }
  };

    const createParty = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const maxMembers = parseInt(formData.get('maxMembers') as string);

    try {
      await apiRequest('/parties', {
        method: 'POST',
        body: JSON.stringify({ name, description, maxMembers })
      });
      setShowAddPartyForm(false);
      fetchParties();
    } catch (error) {
      console.error('파티 생성 실패:', error);
    }
  };

    const acceptQuest = async (questId: string) => {
    try {
      // 즉시 UI 업데이트
      setQuests(prev => prev.map(q => 
        q.id === questId 
          ? { ...q, status: 'IN_PROGRESS', accepted_by_user_id: user?.id }
          : q
      ));
      
      await apiRequest(`/quests/${questId}/accept`, { method: 'POST' });
    } catch (error) {
      console.error('퀘스트 수락 실패:', error);
      fetchQuests(); // 실패시 다시 불러오기
    }
  };

  const completeQuest = async (questId: string) => {
    try {
      // 즉시 UI 업데이트
      setQuests(prev => prev.map(q => 
        q.id === questId ? { ...q, status: 'COMPLETED' } : q
      ));
      
      await apiRequest(`/quests/${questId}/complete`, { method: 'POST' });
    } catch (error) {
      console.error('퀘스트 완료 실패:', error);
      fetchQuests(); // 실패시 다시 불러오기
    }
  };

  const rejectQuest = async (questId: string) => {
    try {
      // 즉시 UI 업데이트
      setQuests(prev => prev.map(q => 
        q.id === questId 
          ? { ...q, status: 'OPEN', accepted_by_user_id: undefined }
          : q
      ));
      
      await apiRequest(`/quests/${questId}/reject`, { method: 'POST' });
    } catch (error) {
      console.error('퀘스트 포기 실패:', error);
      fetchQuests(); // 실패시 다시 불러오기
    }
  };

  const cancelQuest = async (questId: string) => {
    try {
      // 즉시 UI 업데이트 - 퀘스트 제거
      setQuests(prev => prev.filter(q => q.id !== questId));
      
      await apiRequest(`/quests/${questId}/cancel`, { method: 'POST' });
    } catch (error) {
      console.error('퀘스트 취소 실패:', error);
      fetchQuests(); // 실패시 다시 불러오기
    }
  };

  const joinParty = async (partyId: string) => {
    try {
      await apiRequest(`/parties/${partyId}/join`, { method: 'POST' });
      fetchParties();
    } catch (error) {
      console.error('파티 참가 실패:', error);
    }
  };

  const leaveParty = async (partyId: string) => {
    try {
      await apiRequest(`/parties/${partyId}/leave`, { method: 'POST' });
      fetchParties();
    } catch (error) {
      console.error('파티 떠나기 실패:', error);
    }
  };

  const kickMember = async (partyId: string, memberId: string) => {
    if (!confirm('정말로 이 멤버를 추방하시겠습니까?')) {
      return;
    }
    
    try {
      await apiRequest(`/parties/${partyId}/kick`, {
        method: 'POST',
        body: JSON.stringify({ memberId, confirmed: true })
      });
      fetchParties();
    } catch (error) {
      console.error('멤버 추방 실패:', error);
    }
  };

  const disbandParty = async (partyId: string) => {
    if (!confirm('정말로 이 파티를 해체하시겠습니까?')) {
      return;
    }
    
    try {
      await apiRequest(`/parties/${partyId}/disband`, { 
        method: 'POST',
        body: JSON.stringify({ confirmed: true })
      });
      fetchParties();
    } catch (error) {
      console.error('파티 해체 실패:', error);
    }
  };

  const startChatRoom = async (partyId: string) => {
    try {
      const response = await apiRequest(`/chat/rooms/by-party/${partyId}`);
      if (response.roomId) {
        router.push(`/chat/${response.roomId}`);
      } else {
        // 채팅방이 없으면 채팅 페이지로 이동하여 생성
        router.push(`/chat?party=${partyId}`);
      }
    } catch (error) {
      console.error('파티 채팅방 생성 실패:', error);
      // 에러가 발생해도 채팅 페이지로 이동
      router.push(`/chat?party=${partyId}`);
    }
  };

  const startQuestChatRoom = async (questId: string) => {
    try {
      const response = await apiRequest(`/chat/rooms/by-quest/${questId}`);
      if (response.roomId) {
        router.push(`/chat/${response.roomId}`);
      } else {
        // 채팅방이 없으면 채팅 페이지로 이동하여 생성
        router.push(`/chat?quest=${questId}`);
      }
    } catch (error) {
      console.error('퀘스트 채팅방 생성 실패:', error);
      // 에러가 발생해도 채팅 페이지로 이동
      router.push(`/chat?quest=${questId}`);
    }
  };

  const isUserInParty = (party: Party) => {
    return party.members.some(member => member.id === user?.id);
  };

  const isPartyLeader = (party: Party) => {
    return party.leader.id === user?.id;
  };

  const canJoinParty = (party: Party) => {
    return !isUserInParty(party) && party.members.length < party.maxMembers;
  };

  const getQuestSections = () => {
    const created = quests.filter(q => q.creator_id === user?.id && q.status !== 'COMPLETED');
    const accepted = quests.filter(q => q.accepted_by_user_id === user?.id && q.status !== 'COMPLETED');
    const available = quests.filter(q => q.status === 'OPEN' && q.creator_id !== user?.id && q.accepted_by_user_id !== user?.id);
    const completed = quests.filter(q => q.status === 'COMPLETED' && (q.creator_id === user?.id || q.accepted_by_user_id === user?.id));

    return { created, accepted, available, completed };
  };

  const getPartySections = () => {
    const joined = parties.filter(p => isUserInParty(p));
    const available = parties.filter(p => !isUserInParty(p) && p.members.length < p.maxMembers);

    return { joined, available };
  };

  if (loading) {
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
                filter: 'drop-shadow(0 0 15px rgba(0, 255, 255, 0.8))'
        }}>{activeTab === 'quests' ? '📜' : '👥'}</div>
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

  const questSections = getQuestSections();
  const partySections = getPartySections();
  const hasAnyQuests = questSections.created.length > 0 || questSections.accepted.length > 0 || questSections.available.length > 0 || questSections.completed.length > 0;
  const hasAnyParties = partySections.joined.length > 0 || partySections.available.length > 0;

  return (
    <div style={{
      padding: '16px 8px',
      fontFamily: 'Orbitron, monospace'
    }}>
      {/* 탭 버튼 */}
          <div style={{
            display: 'flex',
            gap: '8px',
        marginBottom: '16px',
        padding: '0 8px'
          }}>
            <button
              onClick={() => handleTabChange('quests')}
              style={{
                flex: 1,
            padding: '12px',
            background: activeTab === 'quests' ? 'rgba(255,215,0,0.3)' : 'rgba(255,215,0,0.1)',
            border: `2px solid ${activeTab === 'quests' ? 'rgba(255,215,0,0.6)' : 'rgba(255,215,0,0.3)'}`,
                color: '#ffd700',
            borderRadius: '8px',
                cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.8rem',
            fontFamily: 'Press Start 2P, cursive',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === 'quests' ? '0 0 15px rgba(255,215,0,0.5)' : '0 0 6px rgba(255,215,0,0.3)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'quests') {
                  e.currentTarget.style.background = 'rgba(255,215,0,0.2)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(255,215,0,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'quests') {
                  e.currentTarget.style.background = 'rgba(255,215,0,0.1)';
              e.currentTarget.style.boxShadow = '0 0 6px rgba(255,215,0,0.3)';
                }
              }}
            >
          📜 퀘스트
            </button>
            <button
              onClick={() => handleTabChange('parties')}
              style={{
                flex: 1,
            padding: '12px',
            background: activeTab === 'parties' ? 'rgba(0,255,255,0.3)' : 'rgba(0,255,255,0.1)',
            border: `2px solid ${activeTab === 'parties' ? 'rgba(0,255,255,0.6)' : 'rgba(0,255,255,0.3)'}`,
            color: '#00ffff',
            borderRadius: '8px',
                cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.8rem',
            fontFamily: 'Press Start 2P, cursive',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === 'parties' ? '0 0 15px rgba(0,255,255,0.5)' : '0 0 6px rgba(0,255,255,0.3)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'parties') {
              e.currentTarget.style.background = 'rgba(0,255,255,0.2)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,255,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'parties') {
              e.currentTarget.style.background = 'rgba(0,255,255,0.1)';
              e.currentTarget.style.boxShadow = '0 0 6px rgba(0,255,255,0.3)';
                }
              }}
            >
          👥 파티
            </button>
          </div>

      {/* 퀘스트 탭 */}
          {activeTab === 'quests' && (
            <div>
          {/* 퀘스트 생성 버튼 */}
              <div style={{ 
            padding: '0 8px',
            marginBottom: '16px'
              }}>
                <button
              onClick={() => setShowAddQuestForm(true)}
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
                          fontFamily: 'Press Start 2P, cursive',
                        transition: 'all 0.3s ease',
                boxShadow: '0 0 10px rgba(255,215,0,0.3)'
              }}
                      onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,215,0,0.3)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(255,215,0,0.5)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,215,0,0.2)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(255,215,0,0.3)';
                        e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              📜 새 퀘스트 생성
                                </button>
                      </div>

          {/* 퀘스트 생성 모달 */}
          {showAddQuestForm && (
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
                border: '2px solid rgba(255,215,0,0.3)',
                width: '90%',
                maxWidth: '400px'
              }}>
                <h3 style={{
                  color: '#ffd700',
                  marginTop: 0,
                  marginBottom: '20px',
                  textAlign: 'center',
                  fontFamily: 'Press Start 2P, cursive'
                }}>
                  새 퀘스트 생성
                </h3>
                
                <form onSubmit={createQuest}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                      제목
                    </label>
                    <input
                      name="title"
                      required
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,215,0,0.3)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontFamily: 'Press Start 2P, cursive'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                      설명
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,215,0,0.3)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontFamily: 'Press Start 2P, cursive',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                      위치
                    </label>
                    <input
                      name="location"
                      required
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,215,0,0.3)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontFamily: 'Press Start 2P, cursive'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                      보상 (원)
                    </label>
                    <input
                      name="reward"
                      type="number"
                      required
                      min="1000"
                      placeholder="1000원 이상 입력해주세요"
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,215,0,0.3)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontFamily: 'Press Start 2P, cursive'
                      }}
                    />
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#ffd700',
                      marginTop: '4px',
                      fontFamily: 'Orbitron, monospace'
                    }}>
                      💰 최소 1000원 이상 입력해주세요
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'rgba(255,215,0,0.2)',
                        border: '2px solid rgba(255,215,0,0.5)',
                        color: '#ffd700',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        fontFamily: 'Press Start 2P, cursive'
                      }}
                    >
                      생성
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddQuestForm(false)}
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

          {/* 퀘스트 목록 */}
          {hasAnyQuests ? (
            <div style={{
                    display: 'flex',
              flexDirection: 'column',
              gap: '20px'
                  }}>
              {/* 내가 생성한 퀘스트 */}
              {questSections.created.length > 0 && (
                <div>
                      <div style={{
                        fontSize: '0.8rem',
                    color: '#ffd700',
                    marginBottom: '8px',
                    fontWeight: 600,
                    fontFamily: 'Press Start 2P, cursive',
                    textShadow: '0 0 8px rgba(255,215,0,0.6)'
                  }}>
                    👑 내가 생성한 퀘스트
                      </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    padding: '4px'
                  }}>
                    {questSections.created.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        user={user}
                        onAccept={acceptQuest}
                        onComplete={completeQuest}
                        onReject={rejectQuest}
                        onCancel={cancelQuest}
                        onChat={startQuestChatRoom}
                      />
                    ))}
              </div>
            </div>
          )}

              {/* 내가 수락한 퀘스트 */}
              {questSections.accepted.length > 0 && (
            <div>
              <div style={{ 
                    fontSize: '0.8rem',
                    color: '#00ffff',
                    marginBottom: '8px',
                    fontWeight: 600,
                    fontFamily: 'Press Start 2P, cursive',
                    textShadow: '0 0 8px rgba(0,255,255,0.6)'
                  }}>
                    ⚔️ 내가 수락한 퀘스트
              </div>
              <div style={{ 
                display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                padding: '4px'
              }}>
                    {questSections.accepted.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        user={user}
                        onAccept={acceptQuest}
                        onComplete={completeQuest}
                        onReject={rejectQuest}
                        onCancel={cancelQuest}
                        onChat={startQuestChatRoom}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 수락 가능한 퀘스트 */}
              {questSections.available.length > 0 && (
                <div>
                  <div style={{
                    fontSize: '0.8rem',
                          color: '#00ff00',
                    marginBottom: '8px',
                    fontWeight: 600,
                          fontFamily: 'Press Start 2P, cursive',
                    textShadow: '0 0 8px rgba(0,255,0,0.6)'
                  }}>
                    📋 수락 가능 퀘스트
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    padding: '4px'
                  }}>
                    {questSections.available.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        user={user}
                        onAccept={acceptQuest}
                        onComplete={completeQuest}
                        onReject={rejectQuest}
                        onCancel={cancelQuest}
                        onChat={startQuestChatRoom}
                      />
                    ))}
                      </div>
                </div>
              )}
                      
              {/* 완료된 퀘스트 */}
              {questSections.completed.length > 0 && (
                <div>
                      <div style={{
                    fontSize: '0.8rem',
                    color: '#00ff00',
                    marginBottom: '8px',
                    fontWeight: 600,
                    fontFamily: 'Press Start 2P, cursive',
                    textShadow: '0 0 8px rgba(0,255,0,0.6)'
                  }}>
                    ✅ 완료 퀘스트
                  </div>
                        <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    padding: '4px'
                  }}>
                    {questSections.completed.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        user={user}
                        onAccept={acceptQuest}
                        onComplete={completeQuest}
                        onReject={rejectQuest}
                        onCancel={cancelQuest}
                        onChat={startQuestChatRoom}
                      />
                    ))}
                        </div>
                      </div>
              )}
            </div>
          ) : (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'calc(100vh - 200px)',
              flexDirection: 'column',
              gap: '24px'
            }}>
              <div style={{ 
                fontSize: '3rem',
                animation: 'pulse 2s ease-in-out infinite',
                filter: 'drop-shadow(0 0 15px rgba(255,215,0,0.8))'
              }}>📜</div>
              <div style={{ 
                color: '#ffd700', 
                fontSize: '1rem',
                fontFamily: 'Press Start 2P, cursive',
                textShadow: '0 0 10px rgba(255,215,0,0.8)',
                textAlign: 'center'
              }}>
                아직 퀘스트가 없습니다
                        </div>
              <div style={{
                color: '#888888',
                fontSize: '0.8rem',
                textAlign: 'center',
                lineHeight: '1.5',
                fontFamily: 'Orbitron, monospace'
              }}>
                새로운 퀘스트를 생성하거나<br />
                다른 사용자의 퀘스트를 수락해보세요
                        </div>
                      </div>
          )}
                          </div>
                        )}

      {/* 파티 탭 */}
      {activeTab === 'parties' && (
        <div>
          {/* 파티 생성 버튼 */}
          <div style={{
            padding: '0 8px',
            marginBottom: '16px'
          }}>
                          <button
              onClick={() => setShowAddPartyForm(true)}
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
                fontFamily: 'Press Start 2P, cursive',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 10px rgba(0,255,255,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,255,255,0.3)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,255,0.5)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,255,255,0.2)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,255,0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              👥 새 파티 생성
                          </button>
                      </div>

          {/* 파티 생성 모달 */}
          {showAddPartyForm && (
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
                  새 파티 생성
                </h3>
                
                <form onSubmit={createParty}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                      파티명
                    </label>
                    <input
                      name="name"
                      required
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
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                      설명
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(0,255,255,0.3)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontFamily: 'Press Start 2P, cursive',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                      최대 인원
                    </label>
                    <input
                      name="maxMembers"
                      type="number"
                      required
                      min="2"
                      max="10"
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
                      생성
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddPartyForm(false)}
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

          {/* 파티 목록 */}
          {hasAnyParties ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* 내가 참가한 파티 */}
              {partySections.joined.length > 0 && (
                <div>
              <div style={{
                    fontSize: '0.8rem',
                  color: '#00ffff', 
                    marginBottom: '8px',
                    fontWeight: 600,
                    fontFamily: 'Press Start 2P, cursive',
                    textShadow: '0 0 8px rgba(0,255,255,0.6)'
                  }}>
                    👥 내가 참가한 파티
      </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    padding: '4px'
                  }}>
                    {partySections.joined.map((party) => (
                      <PartyCard
                        key={party.id}
                        party={party}
                        user={user}
                        onJoin={joinParty}
                        onLeave={leaveParty}
                        onKick={kickMember}
                        onDisband={disbandParty}
                        onChat={startChatRoom}
                        isUserInParty={isUserInParty}
                        isPartyLeader={isPartyLeader}
                        canJoinParty={canJoinParty}
                      />
                    ))}
    </div>
                </div>
              )}

              {/* 참가 가능한 파티 */}
              {partySections.available.length > 0 && (
                <div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#00ff00',
                    marginBottom: '8px',
                    fontWeight: 600,
                    fontFamily: 'Press Start 2P, cursive',
                    textShadow: '0 0 8px rgba(0,255,0,0.6)'
                  }}>
                    📋 참가 가능한 파티
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    padding: '4px'
                  }}>
                    {partySections.available.map((party) => (
                      <PartyCard
                        key={party.id}
                        party={party}
                        user={user}
                        onJoin={joinParty}
                        onLeave={leaveParty}
                        onKick={kickMember}
                        onDisband={disbandParty}
                        onChat={startChatRoom}
                        isUserInParty={isUserInParty}
                        isPartyLeader={isPartyLeader}
                        canJoinParty={canJoinParty}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
              minHeight: 'calc(100vh - 200px)',
              flexDirection: 'column',
              gap: '24px'
            }}>
              <div style={{ 
                fontSize: '3rem',
                animation: 'pulse 2s ease-in-out infinite',
                filter: 'drop-shadow(0 0 15px rgba(0,255,255,0.8))'
              }}>👥</div>
              <div style={{ 
          color: '#00ffff',
          fontSize: '1rem',
                fontFamily: 'Press Start 2P, cursive',
                textShadow: '0 0 10px rgba(0,255,255,0.8)',
                textAlign: 'center'
        }}>
                아직 파티가 없습니다
        </div>
              <div style={{
                color: '#888888',
                fontSize: '0.8rem',
                textAlign: 'center',
                lineHeight: '1.5',
                fontFamily: 'Orbitron, monospace'
              }}>
                새로운 파티를 생성하거나<br />
                다른 사용자의 파티에 참가해보세요
              </div>
            </div>
          )}
        </div>
      )}

      {/* 무한스크롤 센티널 */}
      <div id="scroll-sentinel" style={{ height: '20px' }} />
    </div>
  );
}

export default function GuildPage() {
  return (
    <AuthGuard>
        <GuildPageContent />
    </AuthGuard>
  );
} 