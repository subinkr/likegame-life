'use client';
import { useState, useEffect } from 'react';

interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'cosmetic' | 'functional' | 'collectible';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  owned: boolean;
}

export default function ShopPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [coins, setCoins] = useState(1000);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cosmetic' | 'functional' | 'collectible'>('all');

  // 초기 아이템 데이터 생성
  useEffect(() => {
    if (items.length === 0) {
      const initialItems: Item[] = [
        {
          id: '1',
          name: '골든 테마',
          description: '황금색 테마로 UI를 꾸며보세요',
          price: 500,
          category: 'cosmetic',
          rarity: 'rare',
          icon: '🎨',
          owned: false
        },
        {
          id: '2',
          name: '경험치 부스터',
          description: '스탯 성장 속도를 2배로 증가시킵니다',
          price: 300,
          category: 'functional',
          rarity: 'epic',
          icon: '⚡',
          owned: false
        },
        {
          id: '3',
          name: '특별 뱃지',
          description: '상점에서만 구매할 수 있는 특별한 뱃지',
          price: 800,
          category: 'collectible',
          rarity: 'legendary',
          icon: '🏆',
          owned: false
        },
        {
          id: '4',
          name: '레인보우 테마',
          description: '무지개색 테마로 화려하게 꾸며보세요',
          price: 1000,
          category: 'cosmetic',
          rarity: 'legendary',
          icon: '🌈',
          owned: false
        },
        {
          id: '5',
          name: '자동 저장',
          description: '데이터를 자동으로 백업합니다',
          price: 200,
          category: 'functional',
          rarity: 'common',
          icon: '💾',
          owned: false
        },
        {
          id: '6',
          name: '미니 아이콘',
          description: '귀여운 미니 아이콘 세트',
          price: 150,
          category: 'cosmetic',
          rarity: 'common',
          icon: '🎀',
          owned: false
        }
      ];
      setItems(initialItems);
    }
  }, [items.length]);

  const buyItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item && !item.owned && coins >= item.price) {
      setCoins(prev => prev - item.price);
      setItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, owned: true } : i
      ));
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9ca3af';
      case 'rare': return '#4f8cff';
      case 'epic': return '#a78bfa';
      case 'legendary': return '#ffd700';
      default: return '#9ca3af';
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common': return '일반';
      case 'rare': return '희귀';
      case 'epic': return '영웅';
      case 'legendary': return '전설';
      default: return '일반';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'cosmetic': return '장식';
      case 'functional': return '기능';
      case 'collectible': return '수집';
      default: return '기타';
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  return (
    <main className="main-grid" style={{minHeight: '100vh', paddingBottom: '80px'}}>
      {/* 헤더 */}
      <section className="section-card" style={{gridColumn: '1/-1', textAlign: 'center'}}>
        <h1 className="title-main">상점</h1>
        <div className="text-sub">특별한 아이템들을 구매해보세요</div>
      </section>

      {/* 코인 잔액 */}
      <section className="section-card" style={{gridColumn: '1/-1', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #ffd70022, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
          <div style={{fontSize:'1.5rem'}}>🪙</div>
          <div style={{fontSize:'1.2rem', fontWeight:700, color:'#ffd700'}}>{coins.toLocaleString()}</div>
          <div style={{fontSize:'0.9rem', color:'#bfc9d9'}}>코인</div>
        </div>
      </section>

      {/* 카테고리 필터 */}
      <section className="section-card" style={{gridColumn: '1/-1', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #4f8cff22, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
        <div className="title-section" style={{fontSize:'1rem', color:'#4f8cff', marginBottom:16}}>카테고리</div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          {[
            { key: 'all', text: '전체', color: '#9ca3af' },
            { key: 'cosmetic', text: '장식', color: '#a78bfa' },
            { key: 'functional', text: '기능', color: '#4f8cff' },
            { key: 'collectible', text: '수집', color: '#ffd700' }
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: selectedCategory === cat.key ? cat.color : 'rgba(255,255,255,0.1)',
                color: selectedCategory === cat.key ? '#000' : '#fff',
                fontWeight: selectedCategory === cat.key ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.8rem',
                transition: 'all 0.2s ease'
              }}
            >
              {cat.text}
            </button>
          ))}
        </div>
      </section>

      {/* 아이템 목록 */}
      <section className="section-card" style={{gridColumn: '1/-1', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #34d39922, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)'}}>
        <div className="title-section" style={{fontSize:'1rem', color:'#34d399', marginBottom:16}}>아이템 목록</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16}}>
          {filteredItems.map(item => (
            <div key={item.id} style={{
              padding: '16px',
              background: item.owned ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              border: `1px solid ${item.owned ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)'}`,
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{fontSize:'2.5rem', marginBottom:12}}>{item.icon}</div>
              <div style={{fontWeight:700, color:'#fff', fontSize:'0.9rem', marginBottom:4}}>{item.name}</div>
              <div style={{fontSize:11, color:'#bfc9d9', marginBottom:8, lineHeight:1.4}}>{item.description}</div>
              
              <div style={{display:'flex', justifyContent:'center', gap:8, marginBottom:12}}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: `rgba(${getRarityColor(item.rarity)},0.2)`,
                  color: getRarityColor(item.rarity),
                  fontSize: '0.7rem',
                  fontWeight: 600
                }}>
                  {getRarityText(item.rarity)}
                </span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#bfc9d9',
                  fontSize: '0.7rem'
                }}>
                  {getCategoryText(item.category)}
                </span>
              </div>

              <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginBottom:12}}>
                <span style={{fontSize:'0.8rem'}}>🪙</span>
                <span style={{fontSize:'0.9rem', fontWeight:700, color:'#ffd700'}}>{item.price.toLocaleString()}</span>
              </div>

              {item.owned ? (
                <div style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: 'rgba(52,211,153,0.2)',
                  color: '#34d399',
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}>
                  보유 중
                </div>
              ) : (
                <button
                  onClick={() => buyItem(item.id)}
                  disabled={coins < item.price}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: coins >= item.price ? 'linear-gradient(135deg,#4f8cff 0%,#a78bfa 100%)' : 'rgba(255,255,255,0.1)',
                    color: coins >= item.price ? '#fff' : '#9ca3af',
                    fontWeight: 600,
                    cursor: coins >= item.price ? 'pointer' : 'not-allowed',
                    fontSize: '0.8rem',
                    width: '100%'
                  }}
                >
                  {coins >= item.price ? '구매하기' : '코인 부족'}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
} 