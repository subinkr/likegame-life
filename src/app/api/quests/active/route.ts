import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const userId = user.id;

    // 사용자가 수락하거나 생성한 활성 퀘스트 조회 (채팅방 정보 포함)
    const activeQuest = await prisma.quest.findFirst({
      where: {
        OR: [
          {
            acceptedBy: userId,
            status: {
              in: ['OPEN', 'IN_PROGRESS']
            }
          },
          {
            creatorId: userId,
            status: {
              in: ['OPEN', 'IN_PROGRESS']
            }
          }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true
          }
        },
        acceptedByUser: {
          select: {
            id: true,
            nickname: true
          }
        },
        chatRoom: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      hasActiveQuest: !!activeQuest,
      quest: activeQuest ? {
        id: activeQuest.id,
        title: activeQuest.title,
        description: activeQuest.description,
        status: activeQuest.status,
        chatRoomId: activeQuest.chatRoom?.id || null,
        creator: activeQuest.creator,
        acceptedBy: activeQuest.acceptedByUser
      } : null
    });

  } catch (error) {
    console.error('활성 퀘스트 조회 실패:', error);
    return NextResponse.json(
      { error: '퀘스트 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 