'use client';
import React from 'react';

interface Quest {
  id: string;
  title: string;
  description: string;
  location: string;
  reward: number;
  rewardPaid?: boolean;
  status: string;
  creator_id: string;
  creator: {
    id: string;
    nickname: string;
  };
  accepted_by_user_id?: string;
  accepted_by_user?: {
    id: string;
    nickname: string;
  };
}

interface QuestCardProps {
  quest: Quest;
  user: any;
  onAccept: (questId: string) => void;
  onComplete: (questId: string) => void;
  onReject: (questId: string) => void;
  onCancel: (questId: string) => void;
  onChat: (questId: string) => void;
}

export default function QuestCard({ 
  quest, 
  user, 
  onAccept, 
  onComplete, 
  onReject, 
  onCancel, 
  onChat 
}: QuestCardProps) {
  const isMyQuest = quest.creator_id === user?.id;
  const isAcceptedByMe = quest.accepted_by_user_id === user?.id;
  const isInProgress = quest.status === 'IN_PROGRESS';
  const isAvailable = quest.status === 'OPEN';
  
  // 상태별 색상 테마
  let bgColor, borderColor, statusBg, statusColor, statusText;
  
  if (quest.status === 'COMPLETED') {
    // 완료된 퀘스트
    bgColor = 'rgba(128,128,128,0.1)';
    borderColor = 'rgba(128,128,128,0.3)';
    statusBg = 'rgba(0,255,0,0.2)';
    statusColor = '#00ff00';
    statusText = isMyQuest ? '✅ 완료된 퀘스트' : '✅ 완료한 퀘스트';
  } else if (isMyQuest) {
    // 내가 만든 퀘스트
    bgColor = 'rgba(255,215,0,0.1)';
    borderColor = 'rgba(255,215,0,0.3)';
    statusBg = 'rgba(255,215,0,0.2)';
    statusColor = '#ffd700';
    statusText = isInProgress ? '👑 진행중인 퀘스트' : '👑 생성한 퀘스트';
  } else if (isAcceptedByMe) {
    // 내가 수락한 퀘스트
    bgColor = 'rgba(0,255,255,0.1)';
    borderColor = 'rgba(0,255,255,0.3)';
    statusBg = 'rgba(0,255,255,0.2)';
    statusColor = '#00ffff';
    statusText = '⚔️ 수락한 퀘스트';
  } else {
    // 기본
    bgColor = 'rgba(255,215,0,0.1)';
    borderColor = 'rgba(255,215,0,0.3)';
    statusBg = 'rgba(255,215,0,0.2)';
    statusColor = '#ffd700';
    statusText = '📋 활성';
  }

  return (
    <div style={{
      background: bgColor,
      borderRadius: '8px',
      padding: '12px',
      border: `2px solid ${borderColor}`,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '220px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}
    onMouseEnter={(e) => {
      if (quest.status === 'COMPLETED') {
        e.currentTarget.style.background = 'rgba(128,128,128,0.2)';
        e.currentTarget.style.boxShadow = '0 0 15px rgba(128,128,128,0.3)';
      } else {
        e.currentTarget.style.background = bgColor.replace('0.1', '0.2');
        e.currentTarget.style.boxShadow = `0 0 15px ${borderColor}`;
      }
      e.currentTarget.style.transform = 'translateY(-3px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = bgColor;
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
        background: quest.status === 'COMPLETED' 
          ? 'radial-gradient(circle at 30% 30%, rgba(128,128,128,0.2) 0%, transparent 50%)'
          : `radial-gradient(circle at 30% 30%, ${statusBg} 0%, transparent 50%)`,
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
          textShadow: `0 0 10px ${statusColor}`,
          opacity: quest.status === 'COMPLETED' ? 0.6 : 1
        }}>📜</div>
        
        <div style={{
          fontWeight: 700,
          color: quest.status === 'COMPLETED' ? '#888888' : '#ffffff',
          fontSize: '0.8rem',
          fontFamily: 'Press Start 2P, cursive',
          lineHeight: '1.2',
          wordBreak: 'break-word',
          textShadow: quest.status === 'COMPLETED' ? 'none' : `0 0 8px ${statusColor}`
        }}>
          {quest.title}
        </div>
        
        {/* 상태 뱃지 */}
        <div style={{
          fontSize: '0.75rem',
          padding: '3px 8px',
          borderRadius: '6px',
          background: statusBg,
          color: statusColor,
          fontFamily: 'Press Start 2P, cursive',
          fontWeight: 600,
          border: `1px solid ${statusColor}30`,
          textShadow: quest.status === 'COMPLETED' ? 'none' : `0 0 6px ${statusColor}`
        }}>
          {statusText}
        </div>
      </div>

      {/* 중간: 설명 */}
      <div style={{
        fontSize: '0.75rem',
        color: quest.status === 'COMPLETED' ? '#666666' : '#cccccc',
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
        {quest.description}
      </div>
      
      {/* 하단: 정보와 버튼 */}
      <div style={{
        position: 'relative',
        zIndex: 1
      }}>
        {/* 보상과 위치 정보 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          fontSize: '0.75rem',
          fontFamily: 'Orbitron, monospace'
        }}>
          <div style={{ color: quest.status === 'COMPLETED' ? '#666666' : '#ffd700' }}>
            📍 {quest.location}
          </div>
          <div style={{ color: quest.status === 'COMPLETED' ? '#666666' : '#00ff00' }}>
            💰 {quest.reward}
          </div>
        </div>

        {/* 생성자/수락자 정보 */}
        <div style={{
          fontSize: '0.75rem',
          color: quest.status === 'COMPLETED' ? '#666666' : '#888',
          fontFamily: 'Orbitron, monospace',
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          생성자: {quest.creator.nickname}
          {quest.accepted_by_user && (
            <div>수락자: {quest.accepted_by_user.nickname}</div>
          )}
        </div>

        {/* 버튼 영역 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {/* 내가 만든 퀘스트의 버튼들 */}
          {isMyQuest && quest.status !== 'COMPLETED' && (
            <>
              {/* 아무도 수락하지 않았을 때 취소 가능 */}
              {!quest.accepted_by_user_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(quest.id);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255,136,0,0.2)',
                    border: '2px solid rgba(255,136,0,0.5)',
                    color: '#ff8800',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
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
                  ❌ 취소
                </button>
              )}

              {/* 누군가 수락했을 때 취소와 완료 가능 */}
              {quest.accepted_by_user_id && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(quest.id);
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
                    ❌ 취소
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onComplete(quest.id);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(0,255,255,0.2)',
                      border: '2px solid rgba(0,255,255,0.5)',
                      color: '#00ffff',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      fontFamily: 'Press Start 2P, cursive',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 0 6px rgba(0,255,255,0.3)',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0,255,255,0.3)';
                      e.currentTarget.style.boxShadow = '0 0 10px rgba(0,255,255,0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0,255,255,0.2)';
                      e.currentTarget.style.boxShadow = '0 0 6px rgba(0,255,255,0.3)';
                    }}
                  >
                    🏆 완료
                  </button>
                </>
              )}
            </>
          )}

          {/* 내가 수락한 퀘스트의 버튼들 */}
          {isAcceptedByMe && quest.status !== 'COMPLETED' && (
            <>
              {/* 수행 중인 퀘스트 포기 버튼 */}
              {isInProgress && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(quest.id);
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
                  🚫 포기
                </button>
              )}
            </>
          )}

          {/* 수락 가능한 퀘스트의 수락 버튼 */}
          {!isMyQuest && !isAcceptedByMe && quest.status === 'OPEN' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept(quest.id);
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
              ✅ 수락
            </button>
          )}

          {/* 채팅방 버튼 (퀘스트와 관련있는 사람만) */}
          {(isMyQuest || isAcceptedByMe) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChat(quest.id);
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
