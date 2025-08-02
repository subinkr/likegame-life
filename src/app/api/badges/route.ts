import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

// 뱃지 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 모든 뱃지 조회
    const badges = await prisma.badge.findMany({
      orderBy: { name: 'asc' }
    })

    // 사용자의 뱃지 달성 상태 조회
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true }
    })

    // 뱃지와 사용자 달성 상태 결합
    const badgesWithStatus = badges.map(badge => {
      const userBadge = userBadges.find(ub => ub.badgeId === badge.id)
      return {
        ...badge,
        achieved: userBadge?.achieved || false,
        achievedDate: userBadge?.achievedDate || null
      }
    })

    return NextResponse.json({ badges: badgesWithStatus })

  } catch (error) {
    console.error('뱃지 조회 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 