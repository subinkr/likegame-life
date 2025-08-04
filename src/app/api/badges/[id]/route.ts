import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

// 뱃지 수정
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

    const { id } = params
    const { name, description, category, rarity, requirement, icon } = await request.json()

    // 필수 필드 검증
    if (!name || !description || !category || !rarity || !requirement || !icon) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기존 뱃지 확인
    const existingBadge = await prisma.badge.findUnique({
      where: { id }
    })

    if (!existingBadge) {
      return NextResponse.json(
        { error: '뱃지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 뱃지 업데이트
    const updatedBadge = await prisma.badge.update({
      where: { id },
      data: {
        name,
        description,
        category,
        rarity,
        requirement,
        icon
      }
    })

    return NextResponse.json({
      message: '뱃지가 성공적으로 수정되었습니다.',
      badge: updatedBadge
    })

  } catch (error) {
    console.error('뱃지 수정 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 뱃지 삭제
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

    const { id } = params

    // 기존 뱃지 확인
    const existingBadge = await prisma.badge.findUnique({
      where: { id }
    })

    if (!existingBadge) {
      return NextResponse.json(
        { error: '뱃지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 뱃지 삭제
    await prisma.badge.delete({
      where: { id }
    })

    return NextResponse.json({
      message: '뱃지가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('뱃지 삭제 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 뱃지 토글 (달성/미달성)
export async function POST(
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

    const badgeId = params.id

    // 뱃지 존재 확인
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId }
    })

    if (!badge) {
      return NextResponse.json(
        { error: '뱃지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 사용자의 뱃지 상태 확인
    const existingUserBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: user.id,
          badgeId: badgeId
        }
      }
    })

    if (existingUserBadge) {
      // 이미 존재하면 토글
      const updatedUserBadge = await prisma.userBadge.update({
        where: {
          userId_badgeId: {
            userId: user.id,
            badgeId: badgeId
          }
        },
        data: {
          achieved: !existingUserBadge.achieved,
          achievedDate: !existingUserBadge.achieved ? new Date() : null
        }
      })

      return NextResponse.json({
        message: updatedUserBadge.achieved ? '뱃지를 달성했습니다!' : '뱃지 달성을 취소했습니다.',
        userBadge: updatedUserBadge
      })
    } else {
      // 새로 생성
      const newUserBadge = await prisma.userBadge.create({
        data: {
          userId: user.id,
          badgeId: badgeId,
          achieved: true,
          achievedDate: new Date()
        }
      })

      return NextResponse.json({
        message: '뱃지를 달성했습니다!',
        userBadge: newUserBadge
      })
    }

  } catch (error) {
    console.error('뱃지 토글 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 