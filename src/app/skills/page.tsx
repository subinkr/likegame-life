'use client';
import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSkills } from '@/hooks/useSkills';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';

interface Skill {
  id: string;
  name: string;
  description: string;
  acquiredDate: string;
  expiryDate?: string;
  parentSkillId?: string;
}

function SkillsPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { skills, loading, createSkill, deleteSkill } = useSkills();
  const [newSkill, setNewSkill] = useState<Skill>({
    id: '',
    name: '',
    description: '',
    acquiredDate: '',
    expiryDate: '',
    parentSkillId: ''
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
        parentSkillId: newSkill.parentSkillId || undefined
      });

      setNewSkill({
        id: '',
        name: '',
        description: '',
        acquiredDate: '',
        expiryDate: '',
        parentSkillId: ''
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const getParentSkillOptions = () => {
    return skills.filter(skill => !skill.parentSkillId);
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
    if (!expiryDate) return '무제한';
    if (isExpired(expiryDate)) return '만료';
    if (isExpiringSoon(expiryDate)) return '만료예정';
    return '유효';
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
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        zIndex: 1000
      }}>
        <div style={{ 
          fontSize: '3rem',
          animation: 'pulse 2s ease-in-out infinite',
          filter: 'drop-shadow(0 0 15px rgba(0, 255, 255, 0.8))'
        }}>📚</div>
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
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* 스크롤 가능한 메인 콘텐츠 영역 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* 스킬 통계 */}
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
            스킬 통계
          </div>
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
              flex: 1
            }}>
              <div style={{fontSize: '1.2rem', marginBottom: '2px'}}>📚</div>
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
          <button
            onClick={() => {
              setShowSkillModal(true);
              setModalError("");
            }}
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
              fontFamily: 'Press Start 2P, cursive'
            }}
          >
            📝 새 스킬
          </button>
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
              fontSize: '0.75rem',
              padding: '12px',
              fontFamily: 'Orbitron, monospace'
            }}>LOADING...</div>
          ) : skills.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '0.75rem',
              padding: '12px',
              fontFamily: 'Orbitron, monospace'
            }}>등록된 스킬이 없습니다.</div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '6px',
                    padding: '12px',
                    border: `2px solid ${getStatusColor(skill.expiryDate)}`,
                    position: 'relative'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      fontFamily: 'Press Start 2P, cursive'
                    }}>
                      {skill.name}
                    </div>
                    <div style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: `${getStatusColor(skill.expiryDate)}20`,
                      color: getStatusColor(skill.expiryDate),
                      fontFamily: 'Press Start 2P, cursive',
                      fontWeight: 600
                    }}>
                      {getStatusText(skill.expiryDate)}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#cccccc',
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    {skill.description}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.7rem',
                    color: '#888888',
                    fontFamily: 'Orbitron, monospace'
                  }}>
                    <span>취득: {formatDate(skill.acquiredDate)}</span>
                    {skill.expiryDate && (
                      <span>만료: {formatDate(skill.expiryDate)}</span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => deleteSkillHandler(skill.id)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(255,0,0,0.2)',
                      border: '1px solid rgba(255,0,0,0.3)',
                      borderRadius: '4px',
                      color: '#ff0000',
                      fontSize: '0.6rem',
                      padding: '2px 4px',
                      cursor: 'pointer',
                      fontFamily: 'Press Start 2P, cursive'
                    }}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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
      </div>

      {/* 스킬 추가 모달 */}
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
              새 스킬 추가
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                스킬명 *
              </label>
              <input
                ref={nameRef}
                type="text"
                value={newSkill.name}
                onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
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
                설명 *
              </label>
              <textarea
                value={newSkill.description}
                onChange={(e) => setNewSkill({...newSkill, description: e.target.value})}
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
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                취득일 *
              </label>
              <input
                type="date"
                value={newSkill.acquiredDate}
                onChange={(e) => setNewSkill({...newSkill, acquiredDate: e.target.value})}
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
                만료일 (선택)
              </label>
              <input
                type="date"
                value={newSkill.expiryDate}
                onChange={(e) => setNewSkill({...newSkill, expiryDate: e.target.value})}
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
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                상위 스킬 (선택)
              </label>
              <select
                value={newSkill.parentSkillId}
                onChange={(e) => setNewSkill({...newSkill, parentSkillId: e.target.value})}
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
              >
                <option value="">없음</option>
                {getParentSkillOptions().map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </div>
            
            {modalError && (
              <div style={{
                background: 'rgba(255,0,102,0.1)',
                borderRadius: '6px',
                padding: '8px',
                marginBottom: '15px',
                color: '#ff0066',
                fontSize: '0.75rem',
                fontFamily: 'Press Start 2P, cursive'
              }}>
                {modalError}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={addSkill}
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
                추가
              </button>
              <button
                onClick={() => setShowSkillModal(false)}
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
          </div>
        </div>
      )}
    </div>
  );
}

export default function SkillsPage() {
  return (
    <AuthGuard>
      <SkillsPageContent />
    </AuthGuard>
  );
} 