'use client';
import React from 'react';

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

interface PartyCardProps {
  party: Party;
  user: any;
  onJoin: (partyId: string) => void;
  onLeave: (partyId: string) => void;
  onKick: (partyId: string, memberId: string) => void;
  onDisband: (partyId: string) => void;
  onChat: (partyId: string) => void;
  isUserInParty: (party: Party) => boolean;
  isPartyLeader: (party: Party) => boolean;
  canJoinParty: (party: Party) => boolean;
}

export default function PartyCard({ 
  party, 
  user, 
  onJoin, 
  onLeave, 
  onKick, 
  onDisband, 
  onChat,
  isUserInParty,
  isPartyLeader,
  canJoinParty
}: PartyCardProps) {
  const isJoined = isUserInParty(party);
  const isLeader = isPartyLeader(party);
  const canJoin = canJoinParty(party);

  return (
    <div style={{
      background: 'rgba(0,255,255,0.1)',
      borderRadius: '8px',
      padding: '12px',
      border: '2px solid rgba(0,255,255,0.3)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      minHeight: '220px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(0,255,255,0.2)';
      e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,255,0.3)';
      e.currentTarget.style.transform = 'translateY(-3px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(0,255,255,0.1)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      {/* 배경 효과 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 30% 30%, rgba(0,255,255,0.2) 0%, transparent 50%)',
        opacity: 0.3,
        pointerEvents: 'none'
      }} />
      
      {/* 상단: 아이콘과 제목 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          fontSize: '2rem',
          textShadow: '0 0 10px #00ffff'
        }}>👥</div>
        
        <div style={{
          fontWeight: 700,
          color: '#ffffff',
          fontSize: '0.8rem',
          fontFamily: 'Press Start 2P, cursive',
          lineHeight: '1.2',
          wordBreak: 'break-word',
          textShadow: '0 0 8px #00ffff'
        }}>
          {party.name}
        </div>
        
        {/* 상태 뱃지 */}
        <div style={{
          fontSize: '0.75rem',
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(0,255,255,0.2)',
          color: '#00ffff',
          fontFamily: 'Press Start 2P, cursive',
          fontWeight: 600,
          border: '1px solid rgba(0,255,255,0.3)',
          textShadow: '0 0 6px #00ffff'
        }}>
          {isJoined ? '👥 참가 중' : '👥 파티'}
        </div>
      </div>

      {/* 중간: 설명 */}
      <div style={{
        fontSize: '0.75rem',
        color: '#cccccc',
        marginBottom: '12px',
        lineHeight: '1.3',
        fontFamily: 'Orbitron, monospace',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        flex: 1,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {party.description}
      </div>
      
      {/* 하단: 정보와 버튼 */}
      <div style={{
        position: 'relative',
        zIndex: 1
      }}>
        {/* 멤버 정보 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          fontSize: '0.75rem',
          fontFamily: 'Orbitron, monospace'
        }}>
          <div style={{ color: '#00ffff' }}>
            👑 리더: {party.leader.nickname}
          </div>
          <div style={{ color: '#00ffff' }}>
            👥 {party.members.length}/{party.maxMembers}
          </div>
        </div>

        {/* 멤버 목록 */}
        <div style={{
          fontSize: '0.75rem',
          color: '#888',
          fontFamily: 'Orbitron, monospace',
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          멤버: {party.members.map(m => m.nickname).join(', ')}
        </div>

        {/* 버튼 영역 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {/* 참가 가능한 파티의 참가 버튼 */}
          {canJoin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJoin(party.id);
              }}
              style={{
                padding: '8px 16px',
                background: 'rgba(0,255,0,0.2)',
                border: '2px solid rgba(0,255,0,0.5)',
                color: '#00ff00',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                fontFamily: 'Press Start 2P, cursive',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 6px rgba(0,255,0,0.3)',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,255,0,0.3)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,0,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,255,0,0.2)';
                e.currentTarget.style.boxShadow = '0 0 6px rgba(0,255,0,0.3)';
              }}
            >
              ✅ 참가
            </button>
          )}

          {/* 참가 중인 파티의 버튼들 */}
          {isJoined && (
            <>
              {/* 파티 떠나기 버튼 */}
              {!isLeader && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLeave(party.id);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255,136,0,0.2)',
                    border: '2px solid rgba(255,136,0,0.5)',
                    color: '#ff8800',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    fontFamily: 'Press Start 2P, cursive',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 0 6px rgba(255,136,0,0.3)',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,136,0,0.3)';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(255,136,0,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,136,0,0.2)';
                    e.currentTarget.style.boxShadow = '0 0 6px rgba(255,136,0,0.3)';
                  }}
                >
                  🚪 떠나기
                </button>
              )}

              {/* 파티장의 버튼들 */}
              {isLeader && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDisband(party.id);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(255,0,0,0.2)',
                      border: '2px solid rgba(255,0,0,0.5)',
                      color: '#ff0000',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      fontFamily: 'Press Start 2P, cursive',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 0 6px rgba(255,0,0,0.3)',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,0,0,0.3)';
                      e.currentTarget.style.boxShadow = '0 0 10px rgba(255,0,0,0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,0,0,0.2)';
                      e.currentTarget.style.boxShadow = '0 0 6px rgba(255,0,0,0.3)';
                    }}
                  >
                    💥 해체
                  </button>
                  
                  {/* 멤버 추방 버튼들 */}
                  {party.members.filter(m => m.id !== user?.id).map((member) => (
                    <button
                      key={member.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onKick(party.id, member.id);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255,0,0,0.2)',
                        border: '2px solid rgba(255,0,0,0.5)',
                        color: '#ff0000',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        fontFamily: 'Press Start 2P, cursive',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 0 6px rgba(255,0,0,0.3)',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,0,0,0.3)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(255,0,0,0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,0,0,0.2)';
                        e.currentTarget.style.boxShadow = '0 0 6px rgba(255,0,0,0.3)';
                      }}
                    >
                      🚫 {member.nickname} 추방
                    </button>
                  ))}
                </>
              )}
            </>
          )}

          {/* 채팅방 버튼 (참가 중인 경우만) */}
          {isJoined && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChat(party.id);
              }}
              style={{
                padding: '6px 12px',
                background: 'rgba(128,0,255,0.2)',
                border: '2px solid rgba(128,0,255,0.5)',
                color: '#8000ff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                fontFamily: 'Press Start 2P, cursive',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 6px rgba(128,0,255,0.3)',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(128,0,255,0.3)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(128,0,255,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(128,0,255,0.2)';
                e.currentTarget.style.boxShadow = '0 0 6px rgba(128,0,255,0.3)';
              }}
            >
              💬 채팅
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
