import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

// 퀘스트 완료 (생성자만 가능)
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

    // 생성자만 완료할 수 있음
    if (quest.creatorId !== user.id) {
      return NextResponse.json(
        { error: '퀘스트 생성자만 완료할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 진행 중인 퀘스트만 완료 가능
    if (quest.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: '완료할 수 없는 퀘스트입니다.' },
        { status: 400 }
      )
    }

    const updatedQuest = await prisma.quest.update({
      where: { id: questId },
      data: {
        status: 'COMPLETED'
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
      message: '퀘스트가 완료되었습니다.',
      quest: updatedQuest
    })

  } catch (error) {
    console.error('퀘스트 완료 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 