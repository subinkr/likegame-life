import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

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
        { error: '존재하지 않는 뱃지입니다.' },
        { status: 404 }
      )
    }

    // 기존 사용자 뱃지 상태 확인
    const existingUserBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: user.id,
          badgeId
        }
      }
    })

    let userBadge

    if (existingUserBadge) {
      // 기존 상태 토글
      userBadge = await prisma.userBadge.update({
        where: {
          userId_badgeId: {
            userId: user.id,
            badgeId
          }
        },
        data: {
          achieved: !existingUserBadge.achieved,
          achievedDate: !existingUserBadge.achieved ? new Date() : null
        },
        include: { badge: true }
      })
    } else {
      // 새로 생성 (달성 상태로)
      userBadge = await prisma.userBadge.create({
        data: {
          userId: user.id,
          badgeId,
          achieved: true,
          achievedDate: new Date()
        },
        include: { badge: true }
      })
    }

    // 뱃지 상태 변경 후 관련 칭호 상태 업데이트
    const userBadges = await prisma.userBadge.findMany({
      where: {
        userId: user.id,
        achieved: true
      },
      include: { badge: true }
    })

    const badgeCount = userBadges.length
    console.log('뱃지 토글 후 상태:', { badgeCount, userBadge: userBadge.achieved })

    // 모든 칭호들의 상태 재계산
    const allTitles = await prisma.title.findMany()

    for (const title of allTitles) {
      // 필요한 뱃지 확인
      const requiredBadgeNames = title.requiredBadges || []
      const userBadgeNames = userBadges.map(ub => ub.badge.name)
      const shouldHaveTitle = requiredBadgeNames.length > 0 && requiredBadgeNames.every(badgeName => userBadgeNames.includes(badgeName))

      // 사용자의 칭호 상태 확인
      const existingUserTitle = await prisma.userTitle.findFirst({
        where: {
          userId: user.id,
          titleId: title.id
        }
      })

      if (shouldHaveTitle && !existingUserTitle) {
        // 칭호 획득
        await prisma.userTitle.create({
          data: {
            userId: user.id,
            titleId: title.id,
            achieved: true,
            achievedDate: new Date()
          }
        })
        console.log(`칭호 획득: ${title.name}`)
      } else if (!shouldHaveTitle && existingUserTitle) {
        // 뱃지 조건을 만족하지 않으면 칭호 비활성화 및 선택 해제
        await prisma.userTitle.update({
          where: {
            userId_titleId: {
              userId: user.id,
              titleId: title.id
            }
          },
          data: {
            achieved: false,
            selected: false,
            achievedDate: null
          }
        })
        console.log(`칭호 비활성화 및 선택 해제: ${title.name}`)
      }
    }

    return NextResponse.json({
      message: userBadge.achieved ? '뱃지를 획득했습니다!' : '뱃지 획득을 취소했습니다.',
      userBadge
    })

  } catch (error) {
    console.error('뱃지 토글 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 