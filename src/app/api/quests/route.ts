import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

// 퀘스트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const quests = await prisma.quest.findMany({
      where: {
        OR: [
          { creatorId: user.id },
          { acceptedBy: user.id }
        ]
      },
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({ quests })

  } catch (error) {
    console.error('퀘스트 조회 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 퀘스트 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { title, description, location, reward } = await request.json()

    // 필수 필드 검증
    if (!title || !description || !location || !reward) {
      return NextResponse.json(
        { error: '제목, 내용, 위치, 사례금은 필수입니다.' },
        { status: 400 }
      )
    }

    const quest = await prisma.quest.create({
      data: {
        creatorId: user.id,
        title,
        description,
        location,
        reward: parseInt(reward),
        status: 'OPEN'
      },
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

    return NextResponse.json({
      message: '퀘스트가 생성되었습니다.',
      quest
    })

  } catch (error) {
    console.error('퀘스트 생성 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 