'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { wisdomAPI, booksAPI } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';

interface WisdomNote {
  id: string;
  quote: string;
  impression: string;
  date: string;
  book: {
    id: string;
    title: string;
    author: string;
  };
}

function WisdomNotesPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wisdomNotes, setWisdomNotes] = useState<WisdomNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddBookForm, setShowAddBookForm] = useState(false);
  const [books, setBooks] = useState<{id: string, title: string, author: string}[]>([]);
  const [formData, setFormData] = useState({
    bookId: '',
    quote: '',
    impression: '',
  });
  const [bookFormData, setBookFormData] = useState({
    title: '',
    author: '',
  });
  const [selectedBook, setSelectedBook] = useState<{id: string, title: string, author: string} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchWisdomNotes();
      fetchBooks();
    }
  }, [user, loading, router]);

  // URL 파라미터에서 bookId를 읽어서 해당 책 선택
  useEffect(() => {
    const bookId = searchParams.get('bookId');
    if (bookId && books.length > 0) {
      const book = books.find(b => b.id === bookId);
      if (book) {
        setSelectedBook(book);
      }
    }
  }, [searchParams, books]);

  const fetchWisdomNotes = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await wisdomAPI.get(page, 10);
      
      if (append) {
        setWisdomNotes(prev => [...prev, ...(response.wisdomNotes || [])]);
      } else {
        setWisdomNotes(response.wisdomNotes || []);
      }
      
      setHasNextPage(response.pagination?.hasNextPage || false);
      setCurrentPage(page);
    } catch (error) {
      // Error fetching wisdom notes
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await booksAPI.get();
      setBooks(response || []);
    } catch (error) {
      // Error fetching books
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await wisdomAPI.create({
        bookId: formData.bookId,
        quote: formData.quote,
        impression: formData.impression,
      });

      setFormData({ bookId: '', quote: '', impression: '' });
      setShowAddForm(false);
      fetchWisdomNotes();
    } catch (error) {
      // Error creating wisdom note
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}. ${month}. ${day}.`;
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('정말로 이 초서를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await wisdomAPI.delete(noteId);
      fetchWisdomNotes();
    } catch (error) {
      // Error deleting wisdom note
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('정말로 이 책을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await booksAPI.delete(bookId);
      fetchBooks();
      
      // 선택된 책이 삭제된 책이었다면 선택 해제
      if (selectedBook?.id === bookId) {
        setSelectedBook(null);
      }
    } catch (error) {
      alert('책 삭제 중 오류가 발생했습니다.');
    }
  };

  const loadMore = () => {
    if (!isLoadingMore && hasNextPage) {
      fetchWisdomNotes(currentPage + 1, true);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await booksAPI.create({
        title: bookFormData.title,
        author: bookFormData.author,
      });

      setBookFormData({ title: '', author: '' });
      setShowAddBookForm(false);
      fetchBooks();
    } catch (error) {
      // Error creating book
    }
  };

  // 무한스크롤을 위한 Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasNextPage, isLoadingMore, currentPage]);

  // 선택된 책에 따른 필터링된 초서 목록
  const filteredNotes = selectedBook 
    ? wisdomNotes.filter(note => note.book.id === selectedBook.id)
    : wisdomNotes;

  // 랭크 계산 함수들
  const getRank = (notes: number) => {
    if (notes >= 100) return 'S';
    if (notes >= 80) return 'A';
    if (notes >= 60) return 'B';
    if (notes >= 40) return 'C';
    if (notes >= 20) return 'D';
    if (notes >= 10) return 'E';
    return 'F';
  };

  const getProgressToNextRank = (notes: number) => {
    const thresholds = { F: 0, E: 10, D: 20, C: 40, B: 60, A: 80, S: 100 };
    const currentRank = getRank(notes);
    
    if (currentRank === 'S') return { progress: 100, nextRank: 'S', currentThreshold: thresholds.S, nextThreshold: thresholds.S };
    
    let currentThreshold = 0;
    let nextThreshold = 0;
    let nextRank = 'S';
    
    if (currentRank === 'F') {
      currentThreshold = thresholds.F;
      nextThreshold = thresholds.E;
      nextRank = 'E';
    } else if (currentRank === 'E') {
      currentThreshold = thresholds.E;
      nextThreshold = thresholds.D;
      nextRank = 'D';
    } else if (currentRank === 'D') {
      currentThreshold = thresholds.D;
      nextThreshold = thresholds.C;
      nextRank = 'C';
    } else if (currentRank === 'C') {
      currentThreshold = thresholds.C;
      nextThreshold = thresholds.B;
      nextRank = 'B';
    } else if (currentRank === 'B') {
      currentThreshold = thresholds.B;
      nextThreshold = thresholds.A;
      nextRank = 'A';
    } else if (currentRank === 'A') {
      currentThreshold = thresholds.A;
      nextThreshold = thresholds.S;
      nextRank = 'S';
    }
    
    const progress = Math.min(100, ((notes - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
    
    return { progress, nextRank, currentThreshold, nextThreshold };
  };

  // 통계 계산
  const totalNotes = filteredNotes.length;
  const totalBooks = books.length;
  const avgNotesPerBook = totalBooks > 0 ? Math.round(totalNotes / totalBooks * 10) / 10 : 0;

  if (loading || isLoading) {
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
          filter: 'drop-shadow(0 0 15px rgba(153, 0, 255, 0.8))'
        }}>🧠</div>
        <div style={{ 
          color: '#9900ff', 
          fontSize: '1rem',
          fontFamily: 'Press Start 2P, cursive',
          textShadow: '0 0 10px rgba(153, 0, 255, 0.8)',
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
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      minHeight: 'calc(100dvh - 140px)',
      height: '100%',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}>
      {/* 스크롤 가능한 메인 콘텐츠 영역 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flex: 1,
        paddingBottom: '20px'
      }}>
      


      {/* 통계 요약 - 그리드 스타일 */}
      <div style={{
        padding: '0 4px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#ffffff',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive',
          textShadow: '0 0 8px rgba(153,0,255,0.6)'
        }}>
          통계
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '12px 6px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(153,0,255,0.1) 0%, rgba(153,0,255,0.05) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(153,0,255,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 30%, rgba(153,0,255,0.1) 0%, transparent 50%)',
              opacity: 0.5
            }} />
            <div style={{fontSize: '1.4rem', marginBottom: '4px', position: 'relative', zIndex: 1}}>📝</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive',
              position: 'relative',
              zIndex: 1
            }}>노트</div>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#9900ff',
              fontFamily: 'Press Start 2P, cursive',
              textShadow: '0 0 10px rgba(153,0,255,0.6)',
              position: 'relative',
              zIndex: 1
            }}>{totalNotes}</div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '12px 6px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(255,215,0,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 70% 70%, rgba(255,215,0,0.1) 0%, transparent 50%)',
              opacity: 0.5
            }} />
            <div style={{fontSize: '1.4rem', marginBottom: '4px', position: 'relative', zIndex: 1}}>📚</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive',
              position: 'relative',
              zIndex: 1
            }}>책</div>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#ffd700',
              fontFamily: 'Press Start 2P, cursive',
              textShadow: '0 0 10px rgba(255,215,0,0.6)',
              position: 'relative',
              zIndex: 1
            }}>{totalBooks}</div>
          </div>
          

        </div>
      </div>

      {/* 현재 랭크 표시 */}
      {totalNotes > 0 && (
        <div style={{
          padding: '0 8px'
        }}>
          <div style={{
            fontSize: '0.9rem',
            color: '#ffffff',
            marginBottom: '12px',
            textAlign: 'center',
            fontWeight: 600,
            fontFamily: 'Press Start 2P, cursive',
            textShadow: '0 0 8px rgba(153,0,255,0.6)'
          }}>
            누적 기록
          </div>
          
          <div style={{
            background: 'rgba(153,0,255,0.1)',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid rgba(153,0,255,0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 70% 70%, rgba(153,0,255,0.1) 0%, transparent 50%)',
              opacity: 0.5
            }} />
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              position: 'relative',
              zIndex: 1
            }}>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#9900ff',
                fontFamily: 'Press Start 2P, cursive'
              }}>{totalNotes}개</span>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 6px',
                background: 'rgba(153,0,255,0.3)',
                color: '#fff',
                borderRadius: '6px',
                fontFamily: 'Press Start 2P, cursive',
                border: '1px solid rgba(153,0,255,0.5)'
              }}>
                {getRank(totalNotes)}
              </div>
            </div>
            
            {/* 프로그레스 바 */}
            {(() => {
              const progress = getProgressToNextRank(totalNotes);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{
                    width: '100%',
                    height: '4px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <div style={{
                      width: `${progress.progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #9900ff 0%, #cc66ff 100%)',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease',
                      boxShadow: '0 0 6px rgba(153,0,255,0.4)'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#888',
                    textAlign: 'right',
                    fontFamily: 'Orbitron, monospace'
                  }}>
                    {progress.nextRank !== 'S' ? `${totalNotes}/${progress.nextThreshold}개` : '최고 등급'}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}



      {/* 책 선택 */}
      <div style={{
        padding: '0 8px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#ffffff',
          marginBottom: '12px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive',
          textShadow: '0 0 8px rgba(0,255,255,0.6)'
        }}>
          책 선택
        </div>
        <select
          value={selectedBook?.id || ''}
          onChange={(e) => {
            const book = books.find(b => b.id === e.target.value);
            setSelectedBook(book || null);
          }}
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(26, 26, 46, 0.8)',
            border: '2px solid #00ffff',
            borderRadius: '6px',
            color: '#ffffff',
            fontFamily: 'Orbitron, monospace',
            fontSize: '0.75rem',
            marginBottom: '8px'
          }}
        >
          <option value="">전체 책</option>
          {books.map(book => (
            <option key={book.id} value={book.id}>
              {book.title} - {book.author}
            </option>
          ))}
        </select>
        
        {/* 선택된 책 삭제 버튼 */}
        {selectedBook && (
          <button
            onClick={() => handleDeleteBook(selectedBook.id)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255,0,0,0.2)',
              border: '2px solid rgba(255,0,0,0.5)',
              color: '#ff0000',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              fontFamily: 'Press Start 2P, cursive',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 10px rgba(255,0,0,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,0,0,0.3)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(255,0,0,0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,0,0,0.2)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(255,0,0,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🗑️ 선택된 책 삭제
          </button>
        )}
      </div>

      {/* 초서 추가 */}
      <div style={{
        padding: '0 8px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(153,0,255,0.2)',
              border: '2px solid rgba(153,0,255,0.5)',
              color: '#9900ff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              fontFamily: 'Press Start 2P, cursive',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 10px rgba(153,0,255,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(153,0,255,0.3)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(153,0,255,0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(153,0,255,0.2)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(153,0,255,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            📝 새 초서 추가
          </button>
          <button
            onClick={() => setShowAddBookForm(true)}
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
            📚 새 책 추가
          </button>
        </div>
      </div>

      {/* 초서 목록 */}
      <div style={{
        padding: '0 8px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#ffffff',
          marginBottom: '12px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive',
          textShadow: '0 0 8px rgba(255,215,0,0.6)'
        }}>
          초서 목록
        </div>
        
        {filteredNotes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '0.75rem',
            padding: '12px',
            fontFamily: 'Orbitron, monospace',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            초서가 없습니다
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {filteredNotes.map(note => (
              <div key={note.id} style={{
                background: 'rgba(153,0,255,0.1)',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid rgba(153,0,255,0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(153,0,255,0.15)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(153,0,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(153,0,255,0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{flex: 1}}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#666',
                      marginBottom: '4px',
                      fontFamily: 'Orbitron, monospace'
                    }}>
                      📖 {note.book.title} - {note.book.author}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#666',
                      marginBottom: '6px',
                      fontFamily: 'Orbitron, monospace'
                    }}>
                      📅 {formatDate(note.date)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(note.id);
                    }}
                    style={{
                      background: 'rgba(153,0,255,0.2)',
                      border: '1px solid rgba(153,0,255,0.3)',
                      color: '#9900ff',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '50px',
                      fontFamily: 'Press Start 2P, cursive',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(153,0,255,0.3)';
                      e.currentTarget.style.boxShadow = '0 0 5px rgba(153,0,255,0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(153,0,255,0.2)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    삭제
                  </button>
                </div>
                
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px',
                  padding: '8px',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#ffffff',
                    fontFamily: 'Orbitron, monospace',
                    lineHeight: '1.4'
                  }}>
                    "{note.quote}"
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(255,215,0,0.05)',
                  borderRadius: '4px',
                  padding: '8px'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#ffffff',
                    fontFamily: 'Orbitron, monospace',
                    lineHeight: '1.4'
                  }}>
                    {note.impression}
                  </div>
                </div>
              </div>
            ))}
            
            {/* 무한스크롤 센티널 */}
            {hasNextPage && (
              <div id="scroll-sentinel" style={{
                height: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {isLoadingMore && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#666',
                    fontFamily: 'Orbitron, monospace'
                  }}>
                    로딩 중...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* 초서 추가 모달 */}
      {showAddForm && (
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
            border: '2px solid rgba(153,0,255,0.3)',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2 style={{ 
              color: '#9900ff', 
              marginTop: '16px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              새 초서 추가
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                  책 선택
                </label>
                <select
                  value={formData.bookId}
                  onChange={(e) => setFormData({...formData, bookId: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(153,0,255,0.3)',
                    borderRadius: '6px',
                    color: '#ffffff'
                  }}
                >
                  <option value="">책을 선택하세요</option>
                  {books.map(book => (
                    <option key={book.id} value={book.id}>
                      {book.title} - {book.author}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                  인용문
                </label>
                <textarea
                  value={formData.quote}
                  onChange={(e) => setFormData({...formData, quote: e.target.value})}
                  required
                  rows={3}
                  placeholder="인상 깊은 문장을 입력하세요"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(153,0,255,0.3)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                  감상
                </label>
                <textarea
                  value={formData.impression}
                  onChange={(e) => setFormData({...formData, impression: e.target.value})}
                  required
                  rows={4}
                  placeholder="이 문장에 대한 생각을 적어보세요"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(153,0,255,0.3)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(153,0,255,0.2)',
                    border: '2px solid rgba(153,0,255,0.5)',
                    color: '#9900ff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
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

      {/* 책 추가 모달 */}
      {showAddBookForm && (
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
            border: '2px solid rgba(255,215,0,0.3)',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2 style={{ 
              color: '#ffd700', 
              marginTop: '16px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              새 책 추가
            </h2>
            
            <form onSubmit={handleAddBook}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                  책 제목
                </label>
                <input
                  type="text"
                  value={bookFormData.title}
                  onChange={(e) => setBookFormData({...bookFormData, title: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,215,0,0.3)',
                    borderRadius: '6px',
                    color: '#ffffff'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ffffff' }}>
                  저자
                </label>
                <input
                  type="text"
                  value={bookFormData.author}
                  onChange={(e) => setBookFormData({...bookFormData, author: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,215,0,0.3)',
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
                    background: 'rgba(255,215,0,0.2)',
                    border: '2px solid rgba(255,215,0,0.5)',
                    color: '#ffd700',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBookForm(false)}
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
export default function WisdomNotesPage() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 130px)',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
          color: '#9900ff',
          fontSize: '1rem',
          fontFamily: 'Press Start 2P, cursive'
        }}>
          로딩 중...
        </div>
      }>
        <WisdomNotesPageContent />
      </Suspense>
    </AuthGuard>
  );
} 
