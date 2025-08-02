import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

// 퀘스트 수락
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const questId = params.id

    // 퀘스트 존재 확인
    const quest = await prisma.quest.findUnique({
      where: { id: questId }
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

    const updatedQuest = await prisma.quest.update({
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

    return NextResponse.json({
      message: '퀘스트를 수락했습니다.',
      quest: updatedQuest
    })

  } catch (error) {
    console.error('퀘스트 수락 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 