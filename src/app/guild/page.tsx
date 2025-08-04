'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Quest {
  id: string;
  title: string;
  description: string;
  location: string;
  reward: number;
  rewardPaid?: boolean;
  status: string;
  creator: {
    id: string;
    nickname: string;
  };
  acceptedBy?: string;
  acceptedByUser?: {
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

  const fetchQuests = async () => {
    try {
      const response = await fetch('/api/quests');
      if (response.ok) {
        const data = await response.json();
        setQuests(data);
      }
    } catch (error) {
      // 퀘스트 로드 실패
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const response = await fetch('/api/parties');
      if (response.ok) {
        const data = await response.json();
        setParties(data);
      }
    } catch (error) {
      // 파티 로드 실패
    } finally {
      setLoading(false);
    }
  };

  const createQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newQuest),
      });
      
      if (response.ok) {
        setNewQuest({ title: '', description: '', location: '', reward: 0 });
        setShowCreateQuest(false);
        fetchQuests();
      }
    } catch (error) {
      // 퀘스트 생성 실패
    }
  };

  const createParty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/parties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newParty),
      });
      
      if (response.ok) {
        setNewParty({ name: '', description: '', maxMembers: 4 });
        setShowCreateParty(false);
        fetchParties();
      }
    } catch (error) {
      // 파티 생성 실패
    }
  };

  const acceptQuest = async (questId: string) => {
    try {
      const response = await fetch(`/api/quests/${questId}/accept`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchQuests();
      }
    } catch (error) {
      // 퀘스트 수락 실패
    }
  };

  const cancelQuest = async (questId: string) => {
    try {
      const response = await fetch(`/api/quests/${questId}/cancel`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchQuests();
      }
    } catch (error) {
      // 퀘스트 취소 실패
    }
  };

  const completeQuest = async (questId: string) => {
    try {
      const response = await fetch(`/api/quests/${questId}/complete`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(result.message); // 보상 지급 메시지 표시
        fetchQuests();
      } else {
        const error = await response.json();
        alert(error.error || '퀘스트 완료에 실패했습니다.');
      }
    } catch (error) {
      alert('퀘스트 완료에 실패했습니다.');
    }
  };

  const rejectQuest = async (questId: string) => {
    try {
      const response = await fetch(`/api/quests/${questId}/reject`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchQuests();
      }
    } catch (error) {
      // 퀘스트 거절 실패
    }
  };

  const joinParty = async (partyId: string) => {
    try {
      const response = await fetch(`/api/parties/${partyId}/join`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchParties();
      }
    } catch (error) {
      // 파티 참가 실패
    }
  };

  const leaveParty = async (partyId: string) => {
    try {
      const response = await fetch(`/api/parties/${partyId}/leave`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchParties();
        // 채팅방 목록도 새로고침 (채팅방에서도 나가게 되므로)
        // 채팅방 목록을 새로고침하는 함수가 있다면 호출
        // 예: fetchChatRooms();
      } else {
        const error = await response.json();
        alert(error.error || '파티 나가기에 실패했습니다.');
      }
    } catch (error) {
      alert('파티 나가기에 실패했습니다.');
    }
  };

  const kickMember = async (partyId: string, memberId: string) => {
    // 확인 절차
    if (!confirm('정말로 이 멤버를 추방하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/parties/${partyId}/kick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId, confirmed: true }),
      });
      
      if (response.ok) {
        fetchParties();
      } else {
        const error = await response.json();
        alert(error.error || '멤버 추방에 실패했습니다.');
      }
    } catch (error) {
      alert('멤버 추방에 실패했습니다.');
    }
  };

  const disbandParty = async (partyId: string) => {
    // 확인 절차
    if (!confirm('정말로 파티를 해산하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const response = await fetch(`/api/parties/${partyId}/disband`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmed: true }),
      });
      
      if (response.ok) {
        fetchParties();
      } else {
        const error = await response.json();
        alert(error.error || '파티 해산에 실패했습니다.');
      }
    } catch (error) {
      alert('파티 해산에 실패했습니다.');
    }
  };

  // 채팅방으로 이동하는 함수
  const goToChatRoom = async (type: 'quest' | 'party', id: string) => {
    try {
      // 먼저 해당 퀘스트/파티의 채팅방 ID를 찾기
      const endpoint = type === 'quest' 
        ? `/api/chat/rooms/by-quest/${id}`
        : `/api/chat/rooms/by-party/${id}`;
      
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const chatRoom = await response.json();
        router.push(`/chat/${chatRoom.id}`);
      } else {
        console.error('채팅방을 찾을 수 없습니다:', response.status);
        alert('채팅방을 찾을 수 없습니다. 퀘스트를 수락하거나 파티에 참가한 후 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('채팅방 이동 실패:', error);
      alert('채팅방으로 이동하는데 실패했습니다.');
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
    <div style={{ padding: '8px', textAlign: 'center' }}>
      {loading ? (
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
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <button
                  onClick={() => setShowCreateQuest(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(255,215,0,0.1)',
                    border: '2px solid rgba(255,215,0,0.3)',
                    color: '#ffffff',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    fontFamily: 'Press Start 2P, cursive'
                  }}
                >
                  퀘스트 생성
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {quests
                  .filter(quest => quest.status !== 'CANCELLED' && quest.status !== 'COMPLETED') // 취소된 퀘스트와 완료된 퀘스트 제외
                  .filter(quest => {
                    // 내가 받은 의뢰 (내가 수락한 퀘스트)
                    const isAccepted = quest.acceptedBy === user?.id;
                    // 내가 생성한 퀘스트 (모든 상태)
                    const isMyQuest = quest.creator.id === user?.id;
                    // 모집 중인 의뢰 (아직 수락되지 않은 퀘스트)
                    const isOpenQuest = quest.status === 'OPEN';
                    

                    
                    return isAccepted || isMyQuest || isOpenQuest;
                  })
                  .map((quest) => {
                    const statusStyle = getQuestStatusColor(quest.status);
                    const isCreator = quest.creator.id === user?.id;
                    const isAccepted = quest.acceptedBy === user?.id;
                  
                  return (
                    <div
                      key={quest.id}
                      style={{
                        padding: '20px',
                        background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,215,0,0.03) 100%)',
                        border: '2px solid rgba(255,215,0,0.3)',
                        borderRadius: '15px',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(255,215,0,0.1)',
                        backdropFilter: 'blur(10px)',
                        cursor: 'pointer'
                      }}
                      onClick={() => goToChatRoom('quest', quest.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,215,0,0.2)';
                        e.currentTarget.style.borderColor = 'rgba(255,215,0,0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,215,0,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,215,0,0.3)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <h3 style={{ 
                          fontSize: '1.2rem', 
                          fontWeight: 'bold', 
                          color: '#ffd700',
                          margin: 0,
                          textShadow: '0 0 10px rgba(255,215,0,0.5)',
                          fontFamily: 'Press Start 2P, cursive'
                        }}>
                          {quest.title}
                        </h3>
                        <span style={{
                          padding: '6px 12px',
                          background: `linear-gradient(135deg, ${statusStyle.bg} 0%, ${statusStyle.bg.replace('0.2', '0.3')} 100%)`,
                          color: statusStyle.color,
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          boxShadow: `0 2px 8px ${statusStyle.bg}`,
                          fontFamily: 'Press Start 2P, cursive'
                        }}>
                          {getQuestStatusText(quest.status)}
                        </span>
                      </div>
                      
                      <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '12px'
                      }}>
                        <p style={{ 
                          margin: '0 0 8px 0', 
                          color: '#cccccc',
                          lineHeight: '1.4',
                          fontSize: '0.9rem'
                        }}>{quest.description}</p>
                        <p style={{ 
                          margin: '8px 0 0 0', 
                          color: '#888888', 
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          {quest.location}
                        </p>
                      </div>
                      
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '12px',
                        border: '1px solid rgba(255,215,0,0.2)'
                      }}>
                        <p style={{ 
                          margin: '0', 
                          color: '#ffd700', 
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {quest.reward.toLocaleString()}원
                          {quest.rewardPaid && (
                            <span style={{ 
                              marginLeft: '10px', 
                              color: '#00ff00',
                              fontSize: '0.8rem',
                              background: 'rgba(0,255,0,0.2)',
                              padding: '2px 6px',
                              borderRadius: '10px'
                            }}>
                              ✓ 지급완료
                            </span>
                          )}
                        </p>
                      </div>

                      <p style={{ margin: '8px 0', color: '#888888', fontSize: '0.9rem' }}>
                        생성자: {quest.creator.nickname}
                      </p>
                      
                      {quest.acceptedByUser && (
                        <p style={{ margin: '8px 0', color: '#00ff00', fontSize: '0.9rem' }}>
                          수락자: {quest.acceptedByUser.nickname}
                        </p>
                      )}

                      {/* 액션 버튼들 */}
                      <div style={{ marginTop: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {quest.status === 'OPEN' && quest.creator.id !== user?.id && (
                          <button
                            onClick={() => acceptQuest(quest.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(0,255,0,0.2)',
                              border: '1px solid rgba(0,255,0,0.5)',
                              color: '#00ff00',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.8rem'
                            }}
                          >
                            수락
                          </button>
                        )}

                        {isCreator && (quest.status === 'OPEN' || quest.status === 'IN_PROGRESS') && (
                          <button
                            onClick={() => cancelQuest(quest.id)}
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
                            취소
                          </button>
                        )}

                        {isCreator && quest.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => completeQuest(quest.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(0,255,255,0.2)',
                              border: '1px solid rgba(0,255,255,0.5)',
                              color: '#00ffff',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.8rem'
                            }}
                          >
                            완료
                          </button>
                        )}

                        {quest.acceptedBy === user?.id && quest.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => rejectQuest(quest.id)}
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
                            취소
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'parties' && (
            <div>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <button
                  onClick={() => setShowCreateParty(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(0,255,0,0.1)',
                    border: '2px solid rgba(0,255,0,0.3)',
                    color: '#ffffff',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    fontFamily: 'Press Start 2P, cursive'
                  }}
                >
                  파티 생성
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                        padding: '20px',
                        background: 'linear-gradient(135deg, rgba(0,255,0,0.08) 0%, rgba(0,255,0,0.03) 100%)',
                        border: '2px solid rgba(0,255,0,0.3)',
                        borderRadius: '15px',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(0,255,0,0.1)',
                        backdropFilter: 'blur(10px)',
                        cursor: 'pointer'
                      }}
                      onClick={() => goToChatRoom('party', party.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,255,0,0.2)';
                        e.currentTarget.style.borderColor = 'rgba(0,255,0,0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,255,0,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(0,255,0,0.3)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <h3 style={{ 
                          fontSize: '1.2rem', 
                          fontWeight: 'bold', 
                          color: '#00ff00',
                          margin: 0,
                          textShadow: '0 0 10px rgba(0,255,0,0.5)',
                          fontFamily: 'Press Start 2P, cursive'
                        }}>
                          {party.name}
                        </h3>
                        {isLeader && (
                          <span style={{
                            padding: '6px 12px',
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0.2) 100%)',
                            color: '#ffd700',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 8px rgba(255,215,0,0.3)',
                            fontFamily: 'Press Start 2P, cursive'
                          }}>
                            파티장
                          </span>
                        )}
                      </div>
                      
                      <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '12px'
                      }}>
                        <p style={{ 
                          margin: '0 0 8px 0', 
                          color: '#cccccc',
                          lineHeight: '1.4',
                          fontSize: '0.9rem'
                        }}>{party.description}</p>
                      </div>
                      
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(0,255,0,0.1) 0%, rgba(0,255,0,0.05) 100%)',
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '12px',
                        border: '1px solid rgba(0,255,0,0.2)'
                      }}>
                        <p style={{ 
                          margin: '0 0 8px 0', 
                          color: '#888888', 
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          파티장: {party.leader.nickname || '익명'}
                        </p>
                        <p style={{ 
                          margin: '0', 
                          color: party.members.length >= party.maxMembers ? '#ff0000' : '#888888', 
                          fontSize: '0.9rem',
                          fontWeight: party.members.length >= party.maxMembers ? 'bold' : 'normal',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          {party.members.length}/{party.maxMembers}명
                          {party.members.length >= party.maxMembers && (
                            <span style={{
                              marginLeft: '5px',
                              background: 'rgba(255,0,0,0.2)',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '0.75rem'
                            }}>
                              가득참
                            </span>
                          )}
                        </p>
                      </div>

                      {/* 멤버 목록 */}
                      <div style={{ margin: '8px 0' }}>
                        <p style={{ margin: '4px 0', color: '#888888', fontSize: '0.8rem' }}>
                          멤버 목록:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {party.members.map((member) => (
                            <span
                              key={member.id}
                              style={{
                                padding: '2px 6px',
                                background: member.id === party.leader.id ? 'rgba(255,215,0,0.2)' : 'rgba(0,255,255,0.1)',
                                color: member.id === party.leader.id ? '#ffd700' : '#00ffff',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {member.nickname || '익명'}
                              {member.id === party.leader.id && '👑'}
                              {isLeader && member.id !== user?.id && (
                                <button
                                  onClick={() => kickMember(party.id, member.id)}
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
                      <div style={{ marginTop: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {canJoin && (
                          <button
                            onClick={() => joinParty(party.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(0,255,255,0.2)',
                              border: '1px solid rgba(0,255,255,0.5)',
                              color: '#00ffff',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.8rem'
                            }}
                          >
                            참가
                          </button>
                        )}

                        {!canJoin && !isMember && (
                          <div style={{
                            padding: '6px 12px',
                            background: 'rgba(255,0,0,0.1)',
                            border: '1px solid rgba(255,0,0,0.3)',
                            color: '#ff0000',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            ❌ 파티가 가득 찼습니다
                          </div>
                        )}

                        {isMember && !isLeader && (
                          <button
                            onClick={() => leaveParty(party.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(255,165,0,0.2)',
                              border: '1px solid rgba(255,165,0,0.5)',
                              color: '#ffa500',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.8rem'
                            }}
                          >
                            나가기
                          </button>
                        )}

                        {isLeader && (
                          <button
                            onClick={() => disbandParty(party.id)}
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
  );
}

export default function GuildPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 130px)',
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
  );
} 