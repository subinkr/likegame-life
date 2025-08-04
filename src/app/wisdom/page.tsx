'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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

      const response = await fetch(`/api/wisdom?page=${page}&limit=10`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (append) {
          setWisdomNotes(prev => [...prev, ...data.wisdomNotes]);
        } else {
          setWisdomNotes(data.wisdomNotes);
        }
        
        setHasNextPage(data.pagination.hasNextPage);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching wisdom notes:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
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
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ bookId: '', quote: '', impression: '' });
        setShowAddForm(false);
        fetchWisdomNotes();
      }
    } catch (error) {
      console.error('Error creating wisdom note:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('정말로 이 초서를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/wisdom/${noteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchWisdomNotes();
      }
    } catch (error) {
      console.error('Error deleting wisdom note:', error);
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
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bookFormData),
      });

      if (response.ok) {
        setBookFormData({ title: '', author: '' });
        setShowAddBookForm(false);
        fetchBooks();
      }
    } catch (error) {
      console.error('Error creating book:', error);
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

  if (loading || isLoading) {
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
        }}>🧠</div>
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
      minHeight: 'calc(100vh - 130px)'
    }}>
      {/* 지혜 요약 */}
      <div style={{
        background: 'rgba(153,0,255,0.05)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          gap: '4px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '6px',
            background: 'rgba(153,0,255,0.1)',
            borderRadius: '4px',
            flex: 1
          }}>
            <div style={{fontSize: '1.2rem', marginBottom: '2px'}}>📝</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive'
            }}>노트</div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#9900ff',
              fontFamily: 'Press Start 2P, cursive'
            }}>{filteredNotes.length}</div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '6px',
            background: 'rgba(255,215,0,0.1)',
            borderRadius: '4px',
            flex: 1
          }}>
            <div style={{fontSize: '1.2rem', marginBottom: '2px'}}>📚</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ffffff',
              fontFamily: 'Press Start 2P, cursive'
            }}>책</div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#ffff00',
              fontFamily: 'Press Start 2P, cursive'
            }}>{books.length}</div>
          </div>
        </div>
      </div>

      {/* 선택된 책 정보 */}
      {selectedBook && (
        <div style={{
          background: 'rgba(255,215,0,0.1)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            fontSize: '0.8rem',
            color: '#ffff00',
            marginBottom: '8px',
            textAlign: 'center',
            fontWeight: 600,
            fontFamily: 'Press Start 2P, cursive'
          }}>
            📖 선택된 책
          </div>
          <div style={{
            background: 'rgba(255,215,0,0.1)',
            borderRadius: '6px',
            padding: '8px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#ffff00',
              marginBottom: '4px',
              fontFamily: 'Press Start 2P, cursive'
            }}>
              {selectedBook.title}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#666',
              fontFamily: 'Orbitron, monospace'
            }}>
              {selectedBook.author}
            </div>
          </div>
        </div>
      )}

      {/* 책 선택 */}
      <div style={{
        background: 'rgba(0,255,255,0.05)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#ffffff',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive'
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
            fontSize: '0.75rem'
          }}
        >
          <option value="">전체 책</option>
          {books.map(book => (
            <option key={book.id} value={book.id}>
              {book.title} - {book.author}
            </option>
          ))}
        </select>
      </div>

      {/* 초서 추가 */}
      <div style={{
        background: 'rgba(153,0,255,0.05)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#ffffff',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive'
        }}>
          초서 추가
        </div>
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <div 
            style={{
              flex: 1,
              padding: '8px',
              background: 'rgba(153,0,255,0.1)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: '#ffffff',
              fontWeight: 600,
              fontFamily: 'Press Start 2P, cursive',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              border: '2px solid rgba(153,0,255,0.3)'
            }}
            onClick={() => setShowAddForm(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(153,0,255,0.2)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(153,0,255,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(153,0,255,0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            새 초서
          </div>
          <div 
            style={{
              flex: 1,
              padding: '8px',
              background: 'rgba(255,215,0,0.1)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: '#ffffff',
              fontWeight: 600,
              fontFamily: 'Press Start 2P, cursive',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              border: '2px solid rgba(255,215,0,0.3)'
            }}
            onClick={() => setShowAddBookForm(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,215,0,0.2)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(255,215,0,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,215,0,0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            새 책
          </div>
        </div>
      </div>

      {/* 초서 목록 */}
      <div style={{
        background: 'rgba(255,215,0,0.05)',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#ffffff',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: 600,
          fontFamily: 'Press Start 2P, cursive'
        }}>
          초서 목록
        </div>
        
        {filteredNotes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '0.75rem',
            padding: '12px',
            fontFamily: 'Orbitron, monospace'
          }}>
            초서가 없습니다
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {filteredNotes.map(note => (
              <div key={note.id} style={{
                background: 'rgba(153,0,255,0.1)',
                borderRadius: '6px',
                padding: '12px',
                border: '1px solid rgba(153,0,255,0.3)',
                transition: 'all 0.3s ease'
              }}>
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
                    onClick={() => handleDelete(note.id)}
                    style={{
                      background: 'rgba(153,0,255,0.2)',
                      border: '1px solid rgba(153,0,255,0.3)',
                      color: '#9900ff',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '32px',
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
                    color: '#9900ff',
                    fontWeight: 600,
                    marginBottom: '4px',
                    fontFamily: 'Press Start 2P, cursive'
                  }}>
                    💬 인용
                  </div>
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
                    color: '#ffff00',
                    fontWeight: 600,
                    marginBottom: '4px',
                    fontFamily: 'Press Start 2P, cursive'
                  }}>
                    💭 감상
                  </div>
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
              초서 추가
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
                    border: '2px solid rgba(0,255,255,0.3)',
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
                    border: '2px solid rgba(0,255,255,0.3)',
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
                    border: '2px solid rgba(0,255,255,0.3)',
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
                    background: 'rgba(0,255,255,0.2)',
                    border: '2px solid rgba(0,255,255,0.5)',
                    color: '#00ffff',
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
                    border: '2px solid rgba(0,255,255,0.3)',
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
      <WisdomNotesPageContent />
    </Suspense>
  );
} 