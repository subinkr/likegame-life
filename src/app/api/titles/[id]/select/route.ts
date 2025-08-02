import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

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

    const titleId = params.id

    // 칭호 존재 확인
    const title = await prisma.title.findUnique({
      where: { id: titleId }
    })

    if (!title) {
      return NextResponse.json(
        { error: '존재하지 않는 칭호입니다.' },
        { status: 404 }
      )
    }

    // 사용자의 뱃지 달성 상태 조회
    const userBadges = await prisma.userBadge.findMany({
      where: { 
        userId: user.id,
        achieved: true
      },
      include: { badge: true }
    })

    // 뱃지 기반 칭호인 경우에만 뱃지 조건 확인
    if (title.category === 'badge-based') {
      const requiredBadgeNames = title.requiredBadges || []
      const hasRequiredBadges = requiredBadgeNames.length > 0 && requiredBadgeNames.every(badgeName => {
        return userBadges.some(ub => ub.badge.name === badgeName)
      })

      if (!hasRequiredBadges) {
        return NextResponse.json(
          { error: '이 칭호를 획득하기 위한 뱃지가 부족합니다.' },
          { status: 400 }
        )
      }
    }

    // 기존 선택된 칭호 모두 해제
    await prisma.userTitle.updateMany({
      where: { 
        userId: user.id,
        selected: true
      },
      data: { selected: false }
    })

    // 기존 사용자 칭호 상태 확인
    const existingUserTitle = await prisma.userTitle.findUnique({
      where: {
        userId_titleId: {
          userId: user.id,
          titleId
        }
      }
    })

    let userTitle

    if (existingUserTitle) {
      // 기존 상태 업데이트
      userTitle = await prisma.userTitle.update({
        where: {
          userId_titleId: {
            userId: user.id,
            titleId
          }
        },
        data: {
          selected: true,
          achieved: true,
          achievedDate: existingUserTitle.achievedDate || new Date()
        },
        include: { title: true }
      })
    } else {
      // 새로 생성
      userTitle = await prisma.userTitle.create({
        data: {
          userId: user.id,
          titleId,
          selected: true,
          achieved: true,
          achievedDate: new Date()
        },
        include: { title: true }
      })
    }

    return NextResponse.json({
      message: '칭호를 선택했습니다!',
      userTitle
    })

  } catch (error) {
    console.error('칭호 선택 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 