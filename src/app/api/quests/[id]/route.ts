import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

// 퀘스트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const questId = params.id
    const { title, description, location, reward } = await request.json()

    // 퀘스트 존재 확인 및 소유권 확인
    const existingQuest = await prisma.quest.findFirst({
      where: {
        id: questId,
        creatorId: user.id
      }
    })

    if (!existingQuest) {
      return NextResponse.json(
        { error: '존재하지 않는 퀘스트입니다.' },
        { status: 404 }
      )
    }

    // 필수 필드 검증
    if (!title || !description || !location || !reward) {
      return NextResponse.json(
        { error: '제목, 내용, 위치, 사례금은 필수입니다.' },
        { status: 400 }
      )
    }

    const quest = await prisma.quest.update({
      where: { id: questId },
      data: {
        title,
        description,
        location,
        reward: parseInt(reward)
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
      message: '퀘스트가 수정되었습니다.',
      quest
    })

  } catch (error) {
    console.error('퀘스트 수정 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 퀘스트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const questId = params.id

    // 퀘스트 존재 확인 및 소유권 확인
    const existingQuest = await prisma.quest.findFirst({
      where: {
        id: questId,
        creatorId: user.id
      }
    })

    if (!existingQuest) {
      return NextResponse.json(
        { error: '존재하지 않는 퀘스트입니다.' },
        { status: 404 }
      )
    }

    // 퀘스트 삭제
    await prisma.quest.delete({
      where: { id: questId }
    })

    return NextResponse.json({
      message: '퀘스트가 삭제되었습니다.'
    })

  } catch (error) {
    console.error('퀘스트 삭제 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 