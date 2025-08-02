'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  coverImage?: string;
  createdAt: string;
}

export default function BooksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchBooks();
    }
  }, [user, loading, router]);

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



  const handleDelete = async (bookId: string) => {
    if (!confirm('정말로 이 책을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBooks();
      }
    } catch (error) {
      console.error('Error deleting book:', error);
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
  if (loading || !user) {
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
      {/* 책장 대시보드 */}
      <section className="section-card" style={{textAlign: 'center', padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #f9731622, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)', width: '100%'}}>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:12}}>
          <div style={{width:60, height:60, borderRadius: '50%', background: 'linear-gradient(135deg,#f97316 0%,#ea580c 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 2px #23294644'}}>
            <div style={{fontSize: '2rem'}}>📚</div>
          </div>
          <div style={{fontWeight:800, fontSize:'1rem', color:'#fff', marginTop:2}}>책장</div>
          <div style={{fontSize:'0.8rem', color:'#bfc9d9', marginTop:4}}>읽은 책들을 체계적으로 관리하고 초서를 확인하세요</div>
          <div style={{display:'flex', gap:16, marginTop:16, justifyContent:'center'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'1.2rem', fontWeight:700, color:'#f97316'}}>{books.length}</div>
              <div style={{fontSize:'0.7rem', color:'#bfc9d9'}}>등록된 책</div>
            </div>
          </div>
        </div>
      </section>



      {/* 책 목록 */}
      <section className="section-card" style={{padding:'16px 12px', borderRadius:12, boxShadow:'0 4px 16px #f9731622, 0 0 0 1px #2e3650 inset', background:'rgba(34,40,60,0.96)', width: '100%'}}>
        <div className="title-section" style={{fontSize:'1rem', color:'#ffffff', marginBottom:16}}>등록된 책 ({books.length}개)</div>
        
        {books.length === 0 ? (
          <div style={{textAlign:'center', color:'#bfc9d9', fontSize:'0.8rem', padding:'20px'}}>
            등록된 책이 없습니다.
            <br />
            <span style={{color: '#f97316', fontSize: '0.7rem'}}>책을 등록하고 초서를 확인해보세요!</span>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection: 'column', gap:12}}>
            {books.map(book => (
              <div key={book.id} className="section-card" style={{background:'rgba(249,115,22,0.05)', boxShadow:'0 2px 8px #f9731622', padding:'12px', marginBottom:0, borderRadius:8, position:'relative'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                  <div style={{flex: 1}}>
                    <div style={{fontWeight:700, color:'#f97316', fontSize:'0.9rem', marginBottom:4}}>{book.title}</div>
                    <div style={{fontSize:'0.8rem', color:'#bfc9d9', marginBottom:4}}>저자: {book.author}</div>
                    {book.isbn && (
                      <div style={{fontSize:'0.7rem', color:'#94a3b8', marginBottom:4}}>ISBN: {book.isbn}</div>
                    )}
                    {book.description && (
                      <div style={{fontSize:'0.8rem', color:'#bfc9d9', lineHeight:1.4, marginBottom:8}}>{book.description}</div>
                    )}
                  </div>
                </div>
                    
                <div style={{display:'flex', gap:8, marginTop:8}}>
                  <button
                    onClick={() => router.push(`/wisdom?bookId=${book.id}`)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'linear-gradient(135deg,#f97316 0%,#ea580c 100%)',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    초서 보기
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'transparent',
                      color: '#ef4444',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
} 