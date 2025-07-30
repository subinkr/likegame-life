'use client';
import { useState, useEffect, useRef } from "react";

interface Skill {
  id: string;
  name: string;
  description: string;
  acquiredDate: string;
  expiryDate?: string;
  parentSkill?: string;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState<Skill>({
    id: '',
    name: '',
    description: '',
    acquiredDate: '',
    expiryDate: '',
    parentSkill: ''
  });
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  // 저장/불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('likegame-skills');
      if (saved) {
        try {
          setSkills(JSON.parse(saved));
        } catch {}
      }
    }
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('likegame-skills', JSON.stringify(skills));
    }
  }, [skills]);

  const addSkill = () => {
    if (!newSkill.name.trim()) {
      setError("자격증 명칭을 입력하세요.");
      nameRef.current?.focus();
      return;
    }
    if (!newSkill.description.trim()) {
      setError("자격증 설명을 입력하세요.");
      return;
    }
    if (!newSkill.acquiredDate) {
      setError("취득일을 입력하세요.");
      return;
    }

    const skill: Skill = {
      ...newSkill,
      id: Date.now().toString()
    };

    setSkills(prev => [skill, ...prev]);
    setNewSkill({
      id: '',
      name: '',
      description: '',
      acquiredDate: '',
      expiryDate: '',
      parentSkill: ''
    });
    setError("");
    nameRef.current?.focus();
  };

  const deleteSkill = (id: string) => {
    setSkills(prev => prev.filter(skill => skill.id !== id));
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
    if (!expiryDate) return '#34d399';
    if (isExpired(expiryDate)) return '#f87171';
    if (isExpiringSoon(expiryDate)) return '#fbbf24';
    return '#34d399';
  };

  const getStatusText = (expiryDate?: string) => {
    if (!expiryDate) return '무기한';
    if (isExpired(expiryDate)) return '만료됨';
    if (isExpiringSoon(expiryDate)) return '만료임박';
    return '유효';
  };

  return (
    <main style={{maxWidth: '100%', margin: '0 auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: 16}}>
      {/* 스킬 대시보드 */}
      <section className="section-card" style={{textAlign: 'center', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #4f8cff22, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)', width: '100%'}}>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:12}}>
          <div style={{width:60, height:60, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8cff 0%,#ffd700 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 2px #23294644'}}>
            <div style={{fontSize: '2rem'}}>📜</div>
          </div>
          <div style={{fontWeight:800, fontSize:'1rem', color:'#fff', marginTop:2}}>스킬 관리</div>
          <div style={{fontSize:'0.8rem', color:'#bfc9d9', marginTop:4}}>보유한 자격증과 기술을 체계적으로 관리하세요</div>
          <div style={{display:'flex', gap:16, marginTop:16, justifyContent:'center'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'1.2rem', fontWeight:700, color:'#ffd700'}}>{skills.length}</div>
              <div style={{fontSize:'0.7rem', color:'#bfc9d9'}}>보유 자격증</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'1.2rem', fontWeight:700, color:'#34d399'}}>{skills.filter(s => !s.expiryDate || !isExpired(s.expiryDate)).length}</div>
              <div style={{fontSize:'0.7rem', color:'#bfc9d9'}}>유효 자격증</div>
            </div>
          </div>
        </div>
      </section>

      {/* 자격증 등록 */}
      <section className="section-card" style={{padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #ffd70022, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)', width: '100%'}}>
        <div className="title-section" style={{fontSize:'1rem', color:'#ffd700', marginBottom:16}}>새 자격증 등록</div>
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <div style={{display:'flex', flexDirection:'column', gap:6}}>
            <label style={{fontWeight:600, color:'#bfc9d9', fontSize:'0.8rem'}}>자격증 명칭 *</label>
            <input 
              ref={nameRef}
              type="text" 
              value={newSkill.name} 
              onChange={e => setNewSkill(prev => ({...prev, name: e.target.value}))}
              placeholder="예: 정보처리기사"
              style={{width:'100%', height:36, borderRadius:8, fontSize:'0.8rem', padding:'0 10px', boxSizing:'border-box', background:'rgba(15,23,42,0.6)', border:'1px solid rgba(255,215,0,0.3)', color:'#bfc9d9'}}
            />
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:6}}>
            <label style={{fontWeight:600, color:'#bfc9d9', fontSize:'0.8rem'}}>취득일 *</label>
            <input 
              type="date" 
              value={newSkill.acquiredDate} 
              onChange={e => setNewSkill(prev => ({...prev, acquiredDate: e.target.value}))}
              style={{width:'100%', height:36, borderRadius:8, fontSize:'0.8rem', padding:'0 10px', boxSizing:'border-box', background:'rgba(15,23,42,0.6)', border:'1px solid rgba(255,215,0,0.3)', color:'#bfc9d9'}}
            />
          </div>
          
          <div style={{display:'flex', flexDirection:'column', gap:6}}>
            <label style={{fontWeight:600, color:'#bfc9d9', fontSize:'0.8rem'}}>자격증 설명</label>
            <textarea 
              value={newSkill.description} 
              onChange={e => setNewSkill(prev => ({...prev, description: e.target.value}))}
              placeholder="자격증에 대한 설명을 입력하세요"
              style={{width:'100%', minHeight:60, borderRadius:8, fontSize:'0.8rem', padding:'8px 10px', resize:'vertical', boxSizing:'border-box', background:'rgba(15,23,42,0.6)', border:'1px solid rgba(255,215,0,0.3)', color:'#bfc9d9'}}
            />
          </div>
          
          <div style={{display:'flex', flexDirection:'column', gap:12}}>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              <label style={{fontWeight:600, color:'#bfc9d9', fontSize:'0.8rem'}}>만료일 (선택)</label>
              <input 
                type="date" 
                value={newSkill.expiryDate || ''} 
                onChange={e => setNewSkill(prev => ({...prev, expiryDate: e.target.value}))}
                style={{width:'100%', height:36, borderRadius:8, fontSize:'0.8rem', padding:'0 10px', boxSizing:'border-box', background:'rgba(15,23,42,0.6)', border:'1px solid rgba(255,215,0,0.3)', color:'#bfc9d9'}}
              />
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              <label style={{fontWeight:600, color:'#bfc9d9', fontSize:'0.8rem'}}>하위 자격증 (선택)</label>
              <select 
                value={newSkill.parentSkill || ''} 
                onChange={e => setNewSkill(prev => ({...prev, parentSkill: e.target.value}))}
                style={{width:'100%', height:36, borderRadius:8, fontSize:'0.8rem', padding:'0 10px', boxSizing:'border-box', background:'rgba(15,23,42,0.6)', border:'1px solid rgba(255,215,0,0.3)', color:'#bfc9d9'}}
              >
                <option value="">하위 자격증 없음</option>
                {getParentSkillOptions().map(skill => (
                  <option key={skill.id} value={skill.id}>{skill.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button onClick={addSkill} className="btn-primary" style={{alignSelf:'flex-end', marginTop:4, height:36, borderRadius:8, fontWeight:700, fontSize:'0.8rem'}}>자격증 등록</button>
        </div>
        {error && <div style={{color:'#f87171', fontWeight:700, marginTop:8, fontSize:'0.8rem', textAlign:'center'}}>{error}</div>}
      </section>

      {/* 자격증 목록 */}
      <section className="section-card" style={{padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #ffd70022, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)', width: '100%'}}>
        <div className="title-section" style={{fontSize:'1rem', color:'#ffd700', marginBottom:16}}>보유 자격증 ({skills.length}개)</div>
        
        {skills.length === 0 ? (
          <div style={{textAlign:'center', color:'#bfc9d9', fontSize:'0.8rem', padding:'20px'}}>등록된 자격증이 없습니다.</div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:12}}>
            {skills.map(skill => (
              <div key={skill.id} className="section-card" style={{background:'rgba(255,215,0,0.05)', boxShadow:'0 2px 8px #ffd70022', padding:'12px', marginBottom:0, borderRadius:8, position:'relative'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                  <div style={{flex:1, display:'flex', alignItems:'flex-start', gap:8}}>
                    <div style={{width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#ffd700 0%,#ffed4e 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem'}}>
                      📜
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700, color:'#ffd700', fontSize:'0.9rem', marginBottom:4}}>{skill.name}</div>
                      {skill.description && (
                        <div style={{fontSize:11, color:'#bfc9d9', marginBottom:4, lineHeight:1.3}}>{skill.description}</div>
                      )}
                      <div style={{display:'flex', gap:8, fontSize:10, color:'#94a3b8'}}>
                        <span>취득일: {skill.acquiredDate}</span>
                        {skill.expiryDate && <span>| 만료일: {skill.expiryDate}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:8}}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#fff',
                      background: getStatusColor(skill.expiryDate),
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {getStatusText(skill.expiryDate)}
                    </span>
                    <button 
                      onClick={() => deleteSkill(skill.id)}
                      style={{
                        position:'absolute',
                        top:8,
                        right:8,
                        background:'rgba(248,113,113,0.1)',
                        border:'none',
                        color:'#f87171',
                        fontWeight:800,
                        fontSize:12,
                        cursor:'pointer',
                        padding:'2px 4px',
                        borderRadius:'50%',
                        width:20,
                        height:20,
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center'
                      }}
                      title="삭제"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                {skill.parentSkill && (
                  <div style={{marginTop:8, paddingTop:8, borderTop: '1px solid rgba(255,215,0,0.2)'}}>
                    <div style={{fontSize:11, color:'#a78bfa', display:'flex', alignItems:'center', gap:4}}>
                      <span>🔗</span>
                      하위 자격증: {skills.find(s => s.id === skill.parentSkill)?.name}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
} 