'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Book {
  id: string;
  title: string;
  author: string;
}

export default function NewWisdomPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    bookId: '',
    quote: '',
    impression: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchBooks();
  }, [user, router]);

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/wisdom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          bookId: '',
          quote: '',
          impression: '',
        });
        router.push('/wisdom');
      }
    } catch (error) {
      console.error('Error creating wisdom note:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 116px)',
        color: '#bfc9d9',
        fontSize: '0.9rem'
      }}>
        로딩 중...
      </div>
    );
  }

  // 로딩 중이거나 로그인되지 않은 경우
  if (isLoading || !user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 116px)',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '2rem' }}>⏳</div>
        <div style={{ color: '#bfc9d9', fontSize: '1rem' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <main style={{maxWidth: '100%', margin: '0 auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: 16}}>
      {/* 초서 작성 대시보드 */}
      <section className="section-card" style={{textAlign: 'center', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #a78bfa22, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)', width: '100%'}}>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:12}}>
          <div style={{width:60, height:60, borderRadius: '50%', background: 'linear-gradient(135deg,#a78bfa 0%,#8b5cf6 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 2px #23294644'}}>
            <div style={{fontSize: '2rem'}}>📝</div>
          </div>
          <div style={{fontWeight:800, fontSize:'1rem', color:'#fff', marginTop:2}}>새 초서 작성</div>
          <div style={{fontSize:'0.8rem', color:'#bfc9d9', marginTop:4}}>책에서 얻은 지혜와 인사이트를 기록하세요</div>
        </div>
      </section>

      {/* 초서 작성 폼 */}
      <section className="section-card" style={{padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #a78bfa22, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)', width: '100%'}}>
        {books.length === 0 ? (
          <div style={{textAlign:'center', color:'#bfc9d9', fontSize:'0.8rem', padding:'20px'}}>
            등록된 책이 없습니다.
            <br />
            <span style={{color: '#a78bfa', fontSize: '0.7rem'}}>먼저 책을 등록해주세요!</span>
            <br />
            <button
              onClick={() => router.push('/books')}
              style={{
                marginTop: 12,
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(135deg,#34d399 0%,#10b981 100%)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              책 등록하기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 16}}>
            <div>
              <label style={{display: 'block', fontSize: '0.8rem', color: '#ffffff', marginBottom: 4, fontWeight: 600}}>
                책 선택 *
              </label>
              <select
                value={formData.bookId}
                onChange={(e) => setFormData({ ...formData, bookId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(167,139,250,0.3)',
                  background: 'rgba(15,23,42,0.6)',
                  color: '#bfc9d9',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
                required
              >
                <option value="">책을 선택하세요</option>
                {books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} - {book.author}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{display: 'block', fontSize: '0.8rem', color: '#ffffff', marginBottom: 4, fontWeight: 600}}>
                인용문 *
              </label>
              <textarea
                value={formData.quote}
                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                rows={4}
                placeholder="인상 깊었던 문장을 입력하세요"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(167,139,250,0.3)',
                  background: 'rgba(15,23,42,0.6)',
                  color: '#bfc9d9',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
                required
              />
            </div>

            <div>
              <label style={{display: 'block', fontSize: '0.8rem', color: '#ffffff', marginBottom: 4, fontWeight: 600}}>
                감상 *
              </label>
              <textarea
                value={formData.impression}
                onChange={(e) => setFormData({ ...formData, impression: e.target.value })}
                rows={6}
                placeholder="그 문장에 대한 생각과 감상을 자유롭게 적어보세요"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(167,139,250,0.3)',
                  background: 'rgba(15,23,42,0.6)',
                  color: '#bfc9d9',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
                required
              />
            </div>

            <div style={{display: 'flex', gap: 8, marginTop: 8}}>
              <button
                type="button"
                onClick={() => router.push('/wisdom')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(167,139,250,0.3)',
                  background: 'transparent',
                  color: '#a78bfa',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                취소
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg,#a78bfa 0%,#8b5cf6 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                초서 작성
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
} 