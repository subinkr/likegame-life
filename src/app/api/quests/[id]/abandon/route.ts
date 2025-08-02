import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// 퀘스트 포기 (수락한 사람만 가능)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    if (!payload) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
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

    // 수락한 사람만 포기할 수 있음
    if (quest.acceptedBy !== payload.userId) {
      return NextResponse.json(
        { error: '퀘스트를 수락한 사람만 포기할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 진행 중인 퀘스트만 포기 가능
    if (quest.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: '포기할 수 없는 퀘스트입니다.' },
        { status: 400 }
      )
    }

    const updatedQuest = await prisma.quest.update({
      where: { id: questId },
      data: {
        acceptedBy: null,
        status: 'OPEN'
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
      message: '퀘스트를 포기했습니다.',
      quest: updatedQuest
    })

  } catch (error) {
    console.error('퀘스트 포기 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 