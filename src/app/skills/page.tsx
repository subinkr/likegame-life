'use client';
import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSkills } from '@/hooks/useSkills';
import Link from 'next/link';

interface Skill {
  id: string;
  name: string;
  description: string;
  acquiredDate: string;
  expiryDate?: string;
  parentSkill?: string;
}

export default function SkillsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { skills, loading, error: skillsError, createSkill, deleteSkill } = useSkills();
  const [newSkill, setNewSkill] = useState<Skill>({
    id: '',
    name: '',
    description: '',
    acquiredDate: '',
    expiryDate: '',
    parentSkill: ''
  });
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const [showSkillModal, setShowSkillModal] = useState(false);

  const addSkill = async () => {
    if (!newSkill.name.trim()) {
      setModalError("자격증 명칭을 입력하세요.");
      nameRef.current?.focus();
      return;
    }
    if (!newSkill.description.trim()) {
      setModalError("자격증 설명을 입력하세요.");
      return;
    }
    if (!newSkill.acquiredDate) {
      setModalError("취득일을 입력하세요.");
      return;
    }

    try {
      await createSkill({
        name: newSkill.name,
        description: newSkill.description,
        acquiredDate: newSkill.acquiredDate,
        expiryDate: newSkill.expiryDate || undefined,
        parentSkillId: newSkill.parentSkill || undefined
      });

      setNewSkill({
        id: '',
        name: '',
        description: '',
        acquiredDate: '',
        expiryDate: '',
        parentSkill: ''
      });
      setModalError("");
      setShowSkillModal(false);
      nameRef.current?.focus();
    } catch (err: any) {
      setError(err.message || '스킬 추가에 실패했습니다.');
    }
  };

  const deleteSkillHandler = async (id: string) => {
    if (!confirm('정말로 이 자격증을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteSkill(id);
      setError(""); // 성공 시 에러 메시지 초기화
    } catch (err: any) {
      setError(err.message || '스킬 삭제에 실패했습니다.');
    }
  };

  const getParentSkillOptions = () => {
    return skills.filter(skill => !skill.parentSkill);
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const getStatusColor = (expiryDate?: string) => {
    if (!expiryDate) return '#00ff00';
    if (isExpired(expiryDate)) return '#ff0066';
    if (isExpiringSoon(expiryDate)) return '#ffff00';
    return '#00ff00';
  };

  const getStatusText = (expiryDate?: string) => {
    if (!expiryDate) return '무기한';
    if (isExpired(expiryDate)) return '만료됨';
    if (isExpiringSoon(expiryDate)) return '만료임박';
    return '유효';
  };

  // 로딩 중이거나 로그인되지 않은 경우
  if (loading || !user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 120px)',
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

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minHeight: 'calc(100vh - 130px)'
    }}>
      {/* 에러 메시지 */}
      {error && (
        <div style={{
          background: 'rgba(0,255,255,0.1)',
          borderRadius: '8px',
          padding: '12px',
          color: '#00ffff',
          fontSize: '0.8rem',
          textAlign: 'center',
          fontFamily: 'Press Start 2P, cursive'
        }}>
          {error}
        </div>
      )}
      
      {/* 스킬 요약 */}
      <div style={{
        background: 'rgba(0,255,255,0.05)',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#00ffff',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive'
        }}>
                             스킬
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
            flex: 1
          }}>
            <div style={{fontSize: '1.2rem', marginBottom: '2px'}}>📜</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive'
            }}>전체</div>
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
            background: 'rgba(0,255,0,0.1)',
            borderRadius: '4px',
            flex: 1
          }}>
            <div style={{fontSize: '1.2rem', marginBottom: '2px'}}>✅</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive'
            }}>유효</div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#00ff00',
              fontFamily: 'Press Start 2P, cursive'
            }}>{skills.filter(s => !s.expiryDate || !isExpired(s.expiryDate)).length}</div>
          </div>
        </div>
      </div>

      {/* 자격증 등록 */}
      <div style={{
        background: 'rgba(0,255,255,0.05)',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#00ffff',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive'
        }}>
                             스킬 추가
        </div>
        <div 
          style={{
            padding: '8px',
            background: 'rgba(0,255,255,0.1)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            color: '#00ffff',
            fontWeight: 600,
            fontFamily: 'Press Start 2P, cursive',
            textAlign: 'center'
          }}
          onClick={() => {
            setShowSkillModal(true);
            setModalError("");
          }}
        >
                                 📝 새 스킬
        </div>
      </div>

      {/* 자격증 목록 */}
      <div style={{
        background: 'rgba(255,255,0,0.05)',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#ffff00',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive'
        }}>
                             스킬 목록
        </div>
        
        {loading ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '0.7rem',
            padding: '12px',
            fontFamily: 'Orbitron, monospace'
          }}>LOADING...</div>
        ) : skillsError ? (
          <div style={{
            textAlign: 'center',
            color: '#00ffff',
            fontSize: '0.75rem',
            padding: '12px',
            fontFamily: 'Orbitron, monospace'
          }}>{skillsError}</div>
        ) : skills.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '0.75rem',
            padding: '12px',
            fontFamily: 'Orbitron, monospace'
                             }}>스킬이 없습니다</div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
            {skills.map(skill => (
              <div key={skill.id} style={{
                background: 'rgba(0,255,255,0.1)',
                borderRadius: '6px',
                padding: '8px',
                position: 'relative'
              }}>
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div style={{flex: 1, display: 'flex', alignItems: 'flex-start', gap: '6px'}}>
                      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'}}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(0,255,255,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem'
                        }}>
                          📜
                        </div>
                        <span style={{
                          padding: '1px 4px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#fff',
                          background: getStatusColor(skill.expiryDate),
                          whiteSpace: 'nowrap'
                        }}>
                          {getStatusText(skill.expiryDate)}
                        </span>
                      </div>
                      <div style={{flex: 1}}>
                        <div style={{
                          fontWeight: 700,
                          color: '#00ffff',
                          fontSize: '0.75rem',
                          marginBottom: '2px',
                          fontFamily: 'Press Start 2P, cursive'
                        }}>{skill.name}</div>
                        {skill.description && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#666',
                            marginBottom: '2px',
                            lineHeight: 1.2,
                            fontFamily: 'Orbitron, monospace'
                          }}>{skill.description}</div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteSkillHandler(skill.id)}
                      style={{
                        background: 'rgba(0,255,255,0.2)',
                        border: '1px solid rgba(0,255,255,0.3)',
                        color: '#00ffff',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '32px',
                        alignSelf: 'flex-start',
                        fontFamily: 'Press Start 2P, cursive'
                      }}
                      title="삭제"
                    >
                                                     삭제
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px',
                    fontSize: '0.75rem',
                    color: '#666',
                    marginLeft: '30px',
                    fontFamily: 'Orbitron, monospace'
                  }}>
                    <span>ACQ: {new Date(skill.acquiredDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                    {skill.expiryDate && <span>EXP: {new Date(skill.expiryDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>}
                  </div>
                </div>
                
                {skill.parentSkill && (
                  <div style={{
                    marginTop: '4px',
                    paddingTop: '4px',
                    borderTop: '1px solid rgba(255,215,0,0.2)'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#9900ff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      fontFamily: 'Orbitron, monospace'
                    }}>
                      <span>🔗</span>
                               상위: {(() => {
                        const parentSkill = skill.parentSkillId ? skills.find(s => s.id === skill.parentSkillId) : null;
                                                 return parentSkill ? parentSkill.name : '알 수 없음';
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 자격증 등록 모달 */}
      {showSkillModal && (
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
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid #2e3650',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}>
            {/* 모달 헤더 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#ffffff'
              }}>📜 새 스킬</div>
              <button
                onClick={() => setShowSkillModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#bfc9d9',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* 자격증 입력 폼 */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  fontWeight: 600
                }}>📜 이름</label>
                <input 
                  ref={nameRef}
                  type="text" 
                  value={newSkill.name} 
                  onChange={e => setNewSkill(prev => ({...prev, name: e.target.value}))}
                  placeholder="스킬 이름"
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
                />
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  fontWeight: 600
                }}>📝 설명</label>
                <input 
                  type="text" 
                  value={newSkill.description} 
                  onChange={e => setNewSkill(prev => ({...prev, description: e.target.value}))}
                  placeholder="스킬 설명"
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
                />
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  fontWeight: 600
                }}>📅 취득일</label>
                <input 
                  type="date" 
                  value={newSkill.acquiredDate} 
                  onChange={e => setNewSkill(prev => ({...prev, acquiredDate: e.target.value}))}
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
                />
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  fontWeight: 600
                }}>⏰ 만료일 (선택)</label>
                <input 
                  type="date" 
                  value={newSkill.expiryDate || ''} 
                  onChange={e => setNewSkill(prev => ({...prev, expiryDate: e.target.value}))}
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
                />
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  fontWeight: 600
                }}>🔗 선행 스킬 (선택)</label>
                <select 
                  value={newSkill.parentSkill || ''} 
                  onChange={e => setNewSkill(prev => ({...prev, parentSkill: e.target.value}))}
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
                >
                  <option value="">선행 스킬 없음</option>
                  {getParentSkillOptions().map(skill => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </div>
              
              {/* 에러 메시지 */}
              {modalError && (
                <div style={{
                  color: '#f87171', 
                  fontSize: '0.8rem', 
                  textAlign: 'center', 
                  padding: '12px', 
                  background: 'rgba(248,113,113,0.1)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(248,113,113,0.3)'
                }}>
                  {modalError}
                </div>
              )}
              
              {/* 버튼들 */}
              <div style={{display: 'flex', gap: '12px', marginTop: '8px'}}>
                <button
                  onClick={() => setShowSkillModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: 'transparent',
                    color: '#bfc9d9',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={addSkill}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 