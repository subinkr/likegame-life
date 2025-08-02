'use client';
import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';

interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: string;
  icon: string;
}

interface Title {
  id: string;
  name: string;
  description: string;
  rarity: string;
  requiredBadges: string[];
}

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'badges' | 'titles'>('badges');
  const [badges, setBadges] = useState<Badge[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);

  // 폼 상태
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    description: '',
    rarity: 'common',
    icon: ''
  });

  const [titleForm, setTitleForm] = useState({
    name: '',
    description: '',
    rarity: 'common',
    requiredBadges: [] as string[]
  });

  // 데이터 로드
  const fetchData = async () => {
    try {
      const [badgesRes, titlesRes] = await Promise.all([
        fetch('/api/badges'),
        fetch('/api/titles')
      ]);
      
      if (badgesRes.ok) {
        const badgesData = await badgesRes.json();
        setBadges(badgesData.badges || []);
      }
      
      if (titlesRes.ok) {
        const titlesData = await titlesRes.json();
        setTitles(titlesData.titles || []);
      }
    } catch (error) {
      console.error('데이터 로드 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // 뱃지 제출
  const handleBadgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBadge ? `/api/badges/${editingBadge.id}` : '/api/badges';
      const method = editingBadge ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(badgeForm)
      });

      if (response.ok) {
        setShowBadgeModal(false);
        setEditingBadge(null);
        setBadgeForm({ name: '', description: '', rarity: 'common', icon: '' });
        fetchData();
      }
    } catch (error) {
      console.error('뱃지 저장 에러:', error);
    }
  };

  // 칭호 제출
  const handleTitleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTitle ? `/api/titles/${editingTitle.id}` : '/api/titles';
      const method = editingTitle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(titleForm)
      });

      if (response.ok) {
        setShowTitleModal(false);
        setEditingTitle(null);
        setTitleForm({ name: '', description: '', rarity: 'common', requiredBadges: [] });
        fetchData();
      }
    } catch (error) {
      console.error('칭호 저장 에러:', error);
    }
  };

  // 뱃지 편집
  const handleEditBadge = (badge: Badge) => {
    setEditingBadge(badge);
    setBadgeForm({
      name: badge.name,
      description: badge.description,
      rarity: badge.rarity,
      icon: badge.icon
    });
    setShowBadgeModal(true);
  };

  // 칭호 편집
  const handleEditTitle = (title: Title) => {
    setEditingTitle(title);
    setTitleForm({
      name: title.name,
      description: title.description,
      rarity: title.rarity,
      requiredBadges: title.requiredBadges
    });
    setShowTitleModal(true);
  };

  // 뱃지 삭제
  const handleDeleteBadge = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/badges/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('뱃지 삭제 에러:', error);
    }
  };

  // 칭호 삭제
  const handleDeleteTitle = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/titles/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('칭호 삭제 에러:', error);
    }
  };

  // 희귀도 텍스트 변환
  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '전설';
      case 'epic': return '영웅';
      case 'rare': return '희귀';
      case 'common': return '일반';
      default: return rarity;
    }
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

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '16px',
      color: '#ffffff',
      minHeight: 'calc(100vh - 130px)',
      fontFamily: 'Orbitron, monospace'
    }}>
      {/* 헤더 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: '8px',
          fontFamily: 'Press Start 2P, cursive'
        }}>
          🛠️ 관리자 페이지
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: '#bfc9d9',
          fontFamily: 'Orbitron, monospace'
        }}>
          뱃지와 칭호를 관리하세요
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => setActiveTab('titles')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: activeTab === 'titles' ? 'none' : '1px solid rgba(139,92,246,0.3)',
            background: activeTab === 'titles' ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' : 'rgba(139,92,246,0.1)',
            color: activeTab === 'titles' ? '#ffffff' : '#8b5cf6',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          👑 칭호 관리
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: activeTab === 'badges' ? 'none' : '1px solid rgba(59,130,246,0.3)',
            background: activeTab === 'badges' ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'rgba(59,130,246,0.1)',
            color: activeTab === 'badges' ? '#ffffff' : '#3b82f6',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          🏅 뱃지 관리
        </button>
      </div>

      {/* 뱃지 관리 */}
      {activeTab === 'badges' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{
              fontSize: '0.9rem',
              color: '#3b82f6',
              fontWeight: 600,
              fontFamily: 'Press Start 2P, cursive'
            }}>
              뱃지 목록 ({badges.length}개)
            </div>
            <button
              onClick={() => {
                setEditingBadge(null);
                setBadgeForm({ name: '', description: '', rarity: 'common', icon: '' });
                setShowBadgeModal(true);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              + 새 뱃지
            </button>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {badges.map(badge => (
              <div key={badge.id} style={{
                background: 'rgba(59,130,246,0.05)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(59,130,246,0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <span style={{fontSize: '1.5rem', flexShrink: 0}}>{badge.icon}</span>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{
                      fontWeight: 700,
                      color: '#3b82f6',
                      fontSize: '0.9rem',
                      marginBottom: '4px'
                    }}>
                      {badge.name}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#bfc9d9',
                      marginBottom: '4px'
                    }}>
                      {badge.description}
                    </div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#64748b'
                    }}>
                      희귀도: {getRarityText(badge.rarity)}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => handleEditBadge(badge)}
                    style={{
                      background: 'rgba(59,130,246,0.1)',
                      border: '1px solid rgba(59,130,246,0.3)',
                      color: '#3b82f6',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDeleteBadge(badge.id)}
                    style={{
                      background: 'rgba(248,113,113,0.1)',
                      border: '1px solid rgba(248,113,113,0.3)',
                      color: '#f87171',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 칭호 관리 */}
      {activeTab === 'titles' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{
              fontSize: '0.9rem',
              color: '#8b5cf6',
              fontWeight: 600,
              fontFamily: 'Press Start 2P, cursive'
            }}>
              칭호 목록 ({titles.length}개)
            </div>
            <button
              onClick={() => {
                setEditingTitle(null);
                setTitleForm({ name: '', description: '', rarity: 'common', requiredBadges: [] });
                setShowTitleModal(true);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              + 새 칭호
            </button>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {titles.map(title => (
              <div key={title.id} style={{
                background: 'rgba(139,92,246,0.05)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(139,92,246,0.2)'
              }}>
                <div style={{
                  flex: 1,
                  minWidth: 0
                }}>
                  <div style={{
                    fontWeight: 700,
                    color: '#8b5cf6',
                    fontSize: '0.9rem',
                    marginBottom: '4px'
                  }}>
                    {title.name}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#bfc9d9',
                    marginBottom: '4px'
                  }}>
                    {title.description}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#64748b'
                  }}>
                    희귀도: {getRarityText(title.rarity)}
                  </div>
                  {title.requiredBadges.length > 0 && (
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#64748b',
                      marginTop: '4px'
                    }}>
                      필요 업적: {title.requiredBadges.join(', ')}
                    </div>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'flex-end',
                  marginTop: '8px'
                }}>
                  <button
                    onClick={() => handleEditTitle(title)}
                    style={{
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      color: '#8b5cf6',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDeleteTitle(title.id)}
                    style={{
                      background: 'rgba(248,113,113,0.1)',
                      border: '1px solid rgba(248,113,113,0.3)',
                      color: '#f87171',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 뱃지 모달 */}
      {showBadgeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'rgba(34,40,60,0.98)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid #2e3650',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.1rem',
                color: '#ffffff',
                fontWeight: 600
              }}>
                {editingBadge ? '뱃지 수정' : '새 뱃지 추가'}
              </h3>
              <button
                onClick={() => {
                  setShowBadgeModal(false);
                  setEditingBadge(null);
                  setBadgeForm({ name: '', description: '', rarity: 'common', icon: '' });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#bfc9d9',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBadgeSubmit} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  fontWeight: 600
                }}>📜 이름</label>
                <input
                  type="text"
                  value={badgeForm.name}
                  onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                  style={{
                    height: 40,
                    borderRadius: 8,
                    fontSize: '0.9rem',
                    padding: '0 12px',
                    boxSizing: 'border-box',
                    background: 'rgba(15,23,42,0.8)',
                    border: '1px solid #334155',
                    color: '#ffffff'
                  }}
                  required
                />
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  fontWeight: 600
                }}>📝 설명</label>
                <textarea
                  value={badgeForm.description}
                  onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                  rows={3}
                  style={{
                    borderRadius: 8,
                    fontSize: '0.9rem',
                    padding: '12px',
                    boxSizing: 'border-box',
                    background: 'rgba(15,23,42,0.8)',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div style={{display: 'flex', gap: 8}}>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  <label style={{
                    fontSize: '0.9rem',
                    color: '#ffffff',
                    fontWeight: 600
                  }}>⭐ 희귀도</label>
                  <select
                    value={badgeForm.rarity}
                    onChange={(e) => setBadgeForm({ ...badgeForm, rarity: e.target.value })}
                    style={{
                      height: 40,
                      borderRadius: 8,
                      fontSize: '0.9rem',
                      padding: '0 12px',
                      boxSizing: 'border-box',
                      background: 'rgba(15,23,42,0.8)',
                      border: '1px solid #334155',
                      color: '#ffffff'
                    }}
                    required
                  >
                    <option value="">선택하세요</option>
                    <option value="common">일반</option>
                    <option value="rare">희귀</option>
                    <option value="epic">영웅</option>
                    <option value="legendary">전설</option>
                  </select>
                </div>
              </div>



              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  fontWeight: 600
                }}>🎨 아이콘</label>
                <input
                  type="text"
                  value={badgeForm.icon}
                  onChange={(e) => setBadgeForm({ ...badgeForm, icon: e.target.value })}
                  style={{
                    height: 40,
                    borderRadius: 8,
                    fontSize: '0.9rem',
                    padding: '0 12px',
                    boxSizing: 'border-box',
                    background: 'rgba(15,23,42,0.8)',
                    border: '1px solid #334155',
                    color: '#ffffff'
                  }}
                  required
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowBadgeModal(false);
                    setEditingBadge(null);
                    setBadgeForm({ name: '', description: '', rarity: 'common', icon: '' });
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 8,
                    border: '1px solid #334155',
                    background: 'rgba(15,23,42,0.8)',
                    color: '#bfc9d9',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  {editingBadge ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 칭호 모달 */}
      {showTitleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'rgba(34,40,60,0.98)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid #2e3650',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.1rem',
                color: '#ffffff',
                fontWeight: 600
              }}>
                {editingTitle ? '칭호 수정' : '새 칭호 추가'}
              </h3>
              <button
                onClick={() => {
                  setShowTitleModal(false);
                  setEditingTitle(null);
                  setTitleForm({ name: '', description: '', rarity: 'common', requiredBadges: [] });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#bfc9d9',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTitleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  fontWeight: 600
                }}>👑 이름</label>
                <input
                  type="text"
                  value={titleForm.name}
                  onChange={(e) => setTitleForm({ ...titleForm, name: e.target.value })}
                  style={{
                    height: 40,
                    borderRadius: 8,
                    fontSize: '0.9rem',
                    padding: '0 12px',
                    boxSizing: 'border-box',
                    background: 'rgba(15,23,42,0.8)',
                    border: '1px solid #334155',
                    color: '#ffffff'
                  }}
                  required
                />
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  fontWeight: 600
                }}>📝 설명</label>
                <textarea
                  value={titleForm.description}
                  onChange={(e) => setTitleForm({ ...titleForm, description: e.target.value })}
                  rows={3}
                  style={{
                    borderRadius: 8,
                    fontSize: '0.9rem',
                    padding: '12px',
                    boxSizing: 'border-box',
                    background: 'rgba(15,23,42,0.8)',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  fontWeight: 600
                }}>⭐ 희귀도</label>
                <select
                  value={titleForm.rarity}
                  onChange={(e) => setTitleForm({ ...titleForm, rarity: e.target.value })}
                  style={{
                    height: 40,
                    borderRadius: 8,
                    fontSize: '0.9rem',
                    padding: '0 12px',
                    boxSizing: 'border-box',
                    background: 'rgba(15,23,42,0.8)',
                    border: '1px solid #334155',
                    color: '#ffffff'
                  }}
                  required
                >
                  <option value="">선택하세요</option>
                  <option value="common">일반</option>
                  <option value="rare">희귀</option>
                  <option value="epic">영웅</option>
                  <option value="legendary">전설</option>
                </select>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  fontWeight: 600
                }}>🏅 필요 뱃지 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={titleForm.requiredBadges.join(', ')}
                  onChange={(e) => setTitleForm({ 
                    ...titleForm, 
                    requiredBadges: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  })}
                  style={{
                    height: 40,
                    borderRadius: 8,
                    fontSize: '0.9rem',
                    padding: '0 12px',
                    boxSizing: 'border-box',
                    background: 'rgba(15,23,42,0.8)',
                    border: '1px solid #334155',
                    color: '#ffffff'
                  }}
                  placeholder="예: 운동 마스터, 학습 마스터"
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowTitleModal(false);
                    setEditingTitle(null);
                    setTitleForm({ name: '', description: '', rarity: 'common', requiredBadges: [] });
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 8,
                    border: '1px solid #334155',
                    background: 'rgba(15,23,42,0.8)',
                    color: '#bfc9d9',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  {editingTitle ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}