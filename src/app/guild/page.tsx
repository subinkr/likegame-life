'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Quest {
  id: string;
  title: string;
  description: string;
  location: string;
  reward: number;
  rewardPaid?: boolean;
  paidAt?: string;
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

export default function GuildPage() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [activeTab, setActiveTab] = useState<'quests' | 'parties'>('quests');
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
      <h1 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 700,
        marginBottom: '20px',
        color: '#ffffff',
        textAlign: 'center',
        fontFamily: 'Press Start 2P, cursive',
        padding: '8px 16px',
        background: 'rgba(0,255,255,0.1)',
        borderRadius: '12px',
        border: '2px solid rgba(0,255,255,0.3)',
        display: 'inline-block',
        margin: '0 auto 20px auto',
        width: 'fit-content'
      }}>
        <span style={{fontSize: '1.6rem', marginRight: '8px'}}>⚔️</span>
        길드
      </h1>

      {/* 탭 네비게이션 */}
      <div style={{
        display: 'flex',
        marginBottom: '20px',
        borderBottom: '2px solid rgba(0,255,255,0.3)'
      }}>
        <button
          onClick={() => setActiveTab('quests')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'quests' ? 'rgba(0,255,255,0.1)' : 'transparent',
            border: 'none',
            color: activeTab === 'quests' ? '#00ffff' : '#ffffff',
            fontWeight: activeTab === 'quests' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          퀘스트
        </button>
        <button
          onClick={() => setActiveTab('parties')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'parties' ? 'rgba(0,255,255,0.1)' : 'transparent',
            border: 'none',
            color: activeTab === 'parties' ? '#00ffff' : '#ffffff',
            fontWeight: activeTab === 'parties' ? 'bold' : 'normal',
            cursor: 'pointer'
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
                background: 'rgba(0,255,255,0.2)',
                border: '2px solid rgba(0,255,255,0.5)',
                color: '#00ffff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
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
                    padding: '15px',
                    background: 'rgba(0,255,255,0.05)',
                    border: '2px solid rgba(0,255,255,0.2)',
                    borderRadius: '10px',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h3 style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 'bold', 
                      color: '#00ffff',
                      margin: 0
                    }}>
                      {quest.title}
                    </h3>
                    <span style={{
                      padding: '4px 8px',
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {getQuestStatusText(quest.status)}
                    </span>
                  </div>
                  
                  <p style={{ margin: '8px 0', color: '#cccccc' }}>{quest.description}</p>
                  <p style={{ margin: '8px 0', color: '#888888', fontSize: '0.9rem' }}>
                    📍 {quest.location}
                  </p>
                  <p style={{ margin: '8px 0', color: '#ffd700', fontWeight: 'bold' }}>
                    💰 보상: {quest.reward.toLocaleString()}원
                    {quest.rewardPaid && (
                      <span style={{ marginLeft: '10px', color: '#00ff00' }}>
                        ✓ 지급완료
                      </span>
                    )}
                  </p>
                  {quest.paidAt && (
                    <p style={{ margin: '8px 0', color: '#00ff00', fontSize: '0.8rem' }}>
                      💸 지급일시: {new Date(quest.paidAt).toLocaleString()}
                    </p>
                  )}
                  <p style={{ margin: '8px 0', color: '#888888', fontSize: '0.9rem' }}>
                    👤 생성자: {quest.creator.nickname}
                  </p>
                  
                  {quest.acceptedByUser && (
                    <p style={{ margin: '8px 0', color: '#00ff00', fontSize: '0.9rem' }}>
                      ✅ 수락자: {quest.acceptedByUser.nickname}
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
                background: 'rgba(0,255,255,0.2)',
                border: '2px solid rgba(0,255,255,0.5)',
                color: '#00ffff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              파티 생성
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {parties.map((party) => {
              const isLeader = party.leader.id === user?.id;
              const isMember = party.members.find(m => m.id === user?.id);
              const canJoin = !isMember && party.members.length < party.maxMembers;
              
              return (
                <div
                  key={party.id}
                  style={{
                    padding: '15px',
                    background: 'rgba(0,255,255,0.05)',
                    border: '2px solid rgba(0,255,255,0.2)',
                    borderRadius: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h3 style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 'bold', 
                      color: '#00ffff',
                      margin: 0
                    }}>
                      {party.name}
                    </h3>
                    {isLeader && (
                      <span style={{
                        padding: '2px 6px',
                        background: 'rgba(255,215,0,0.2)',
                        color: '#ffd700',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        파티장
                      </span>
                    )}
                  </div>
                  
                  <p style={{ margin: '8px 0', color: '#cccccc' }}>{party.description}</p>
                  <p style={{ margin: '8px 0', color: '#888888', fontSize: '0.9rem' }}>
                    👑 파티장: {party.leader.nickname || '익명'}
                  </p>
                  <p style={{ margin: '8px 0', color: '#888888', fontSize: '0.9rem' }}>
                    👥 멤버: {party.members.length}/{party.maxMembers}
                  </p>

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
                            fontSize: '0.7rem',
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
                                fontSize: '0.6rem',
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
            padding: '30px',
            borderRadius: '15px',
            border: '2px solid rgba(0,255,255,0.3)',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2 style={{ 
              color: '#00ffff', 
              marginBottom: '20px',
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
            padding: '30px',
            borderRadius: '15px',
            border: '2px solid rgba(0,255,255,0.3)',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2 style={{ 
              color: '#00ffff', 
              marginBottom: '20px',
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
                  최대 인원
                </label>
                <input
                  type="number"
                  value={newParty.maxMembers}
                  onChange={(e) => setNewParty({...newParty, maxMembers: parseInt(e.target.value)})}
                  required
                  min="2"
                  max="10"
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
    </div>
  );
} 