import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

// 뱃지 기반 칭호 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사용자의 달성한 뱃지들 조회
    const userBadges = await prisma.userBadge.findMany({
      where: {
        userId: user.id,
        achieved: true
      },
      include: {
        badge: true
      }
    })

    console.log('사용자 달성 뱃지:', userBadges.map(ub => ub.badge.name))

    // 뱃지 조합에 따른 칭호 결정
    const badgeNames = userBadges.map(ub => ub.badge.name)
    const badgeCategories = userBadges.map(ub => ub.badge.category)
    const badgeCount = badgeNames.length

    let titleName = ''
    let titleDescription = ''
    let requiredBadges: string[] = []

    // 뱃지 개수에 따른 기본 칭호만 생성 (단순화)
    if (badgeCount === 0) {
      titleName = '초보자'
      titleDescription = '아직 뱃지를 획득하지 못한 초보자'
      requiredBadges = []
    } else if (badgeCount >= 1 && badgeCount <= 3) {
      titleName = '수집가'
      titleDescription = '뱃지 수집을 시작한 수집가'
      requiredBadges = badgeNames
    } else if (badgeCount >= 4 && badgeCount <= 6) {
      titleName = '열정가'
      titleDescription = '다양한 활동에 열정을 보이는 열정가'
      requiredBadges = badgeNames
    } else if (badgeCount >= 7 && badgeCount <= 10) {
      titleName = '전문가'
      titleDescription = '여러 분야에서 전문성을 보이는 전문가'
      requiredBadges = badgeNames
    } else {
      titleName = '마스터'
      titleDescription = '수많은 뱃지를 수집한 마스터'
      requiredBadges = badgeNames
    }

    console.log('뱃지 기반 칭호 생성:', { titleName, titleDescription, requiredBadges, badgeCount })

    // 기존 칭호가 있는지 확인
    let existingTitle = await prisma.title.findUnique({
      where: { name: titleName }
    })

    // 칭호가 없으면 생성
    if (!existingTitle) {
      existingTitle = await prisma.title.create({
        data: {
          name: titleName,
          description: titleDescription,
          rarity: getRarityByBadgeCount(badgeCount),
          requiredBadges: requiredBadges
        }
      })
    }

    // 사용자의 기존 뱃지 기반 칭호들 삭제 (새로운 뱃지 조합에 맞는 칭호로 교체)
    await prisma.userTitle.deleteMany({
      where: {
        userId: user.id
      }
    })

    // 새로운 칭호 획득
    await prisma.userTitle.create({
      data: {
        userId: user.id,
        titleId: existingTitle.id,
        achieved: true,
        achievedDate: new Date()
      }
    })

    console.log('뱃지 기반 칭호 생성 완료:', { titleName, titleDescription })

    return NextResponse.json({
      title: existingTitle,
      achieved: true,
      message: `새로운 칭호를 획득했습니다: ${titleName}`
    })

  } catch (error) {
    console.error('뱃지 기반 칭호 생성 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 뱃지 개수에 따른 희귀도 결정
function getRarityByBadgeCount(badgeCount: number): string {
  if (badgeCount === 0) return 'common'
  if (badgeCount >= 1 && badgeCount <= 3) return 'common'
  if (badgeCount >= 4 && badgeCount <= 6) return 'rare'
  if (badgeCount >= 7 && badgeCount <= 10) return 'epic'
  return 'legendary'
} 