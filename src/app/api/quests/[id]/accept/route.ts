import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

// 퀘스트 수락
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { id: questId } = await params

    // 퀘스트 존재 확인
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            nickname: true
          }
        }
      }
    })

    if (!quest) {
      return NextResponse.json(
        { error: '존재하지 않는 퀘스트입니다.' },
        { status: 404 }
      )
    }

    // 자신이 만든 퀘스트는 수락할 수 없음
    if (quest.creatorId === user.id) {
      return NextResponse.json(
        { error: '자신이 만든 퀘스트는 수락할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 이미 수락된 퀘스트인지 확인
    if (quest.acceptedBy) {
      return NextResponse.json(
        { error: '이미 수락된 퀘스트입니다.' },
        { status: 400 }
      )
    }

    // 퀘스트가 열린 상태인지 확인
    if (quest.status !== 'OPEN') {
      return NextResponse.json(
        { error: '수락할 수 없는 퀘스트입니다.' },
        { status: 400 }
      )
    }

    // 트랜잭션으로 퀘스트 수락과 채팅방 생성을 함께 처리
    const result = await prisma.$transaction(async (tx) => {
      // 퀘스트 상태 업데이트
      const updatedQuest = await tx.quest.update({
        where: { id: questId },
        data: {
          acceptedBy: user.id,
          status: 'IN_PROGRESS'
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              nickname: true
            }
          },
          acceptedByUser: {
            select: {
              id: true,
              email: true,
              nickname: true
            }
          }
        }
      })

      // 1대1 채팅방 생성
      const chatRoom = await (tx as any).chatRoom.create({
        data: {
          name: quest.title,
          type: 'DIRECT',
          questId: questId,
        },
      })

      // 퀘스트 생성자와 수락자를 채팅방에 추가
      await (tx as any).chatParticipant.createMany({
        data: [
          {
            chatRoomId: chatRoom.id,
            userId: quest.creatorId,
          },
          {
            chatRoomId: chatRoom.id,
            userId: user.id,
          },
        ],
      });

      // 시스템 메시지 생성 (수락자가 참가)
      await (tx as any).chatMessage.create({
        data: {
          chatRoomId: chatRoom.id,
          userId: user.id,
          content: 'SYSTEM_JOIN',
        },
      });

      return { updatedQuest, chatRoom }
    })

    return NextResponse.json({
      message: '퀘스트를 수락했습니다.',
      quest: result.updatedQuest
    })

  } catch (error) {
    console.error('퀘스트 수락 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 