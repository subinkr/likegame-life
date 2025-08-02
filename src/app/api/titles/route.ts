import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

// 칭호 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 모든 칭호 조회
    const titles = await prisma.title.findMany({
      orderBy: { name: 'asc' }
    })

    // 사용자의 뱃지 달성 상태 조회
    const userBadges = await prisma.userBadge.findMany({
      where: { 
        userId: user.id,
        achieved: true
      },
      include: { badge: true }
    })

    // 사용자의 칭호 상태 조회
    const userTitles = await prisma.userTitle.findMany({
      where: { userId: user.id },
      include: { title: true }
    })

    // 30일 전 날짜 계산
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // 힘: 30일간 최고 기록 (StrengthRecord 모델 사용)
    const strengthRecords = await prisma.strengthRecord.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { total: 'desc' },
      select: { 
        id: true,
        total: true,
        createdAt: true
      }
    })
    
    // 최고 기록 찾기
    let bestStrength = 0
    if (strengthRecords.length > 0) {
      bestStrength = strengthRecords[0].total
    }

    // 민첩: 30일간 누적 기록
    const agilityRecords = await prisma.stat.findMany({
      where: {
        userId: user.id,
        agility: { gt: 0 },
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { 
        id: true,
        agility: true,
        createdAt: true
      }
    })
    
    // 실제로 존재하는 기록들만 누적
    let totalAgility = 0
    for (const record of agilityRecords) {
      const exists = await prisma.stat.findUnique({
        where: { id: record.id },
        select: { id: true }
      })
      if (exists) {
        totalAgility += record.agility
      }
    }

    // 지혜: 30일간 초서 개수 (WisdomNote 모델 사용)
    const wisdomCount = await prisma.wisdomNote.count({
      where: {
        userId: user.id,
        date: {
          gte: thirtyDaysAgo,
          lte: new Date(),
        },
      },
    })

    // 랭크 계산 함수


    // 모든 뱃지 개수 미리 계산
    const allBadges = await prisma.badge.findMany()
    const badgeCount = userBadges.length

    // 칭호와 사용자 상태 결합
    const titlesWithStatus = titles.map(title => {
      const userTitle = userTitles.find(ut => ut.titleId === title.id)
      
      let achieved = false
      
      // 모든 칭호를 뱃지 기반으로 처리
      const requiredBadgeNames = Array.isArray(title.requiredBadges) ? title.requiredBadges : []
      
      // requiredBadges가 비어있으면 달성 조건이 없는 것이므로 달성되지 않음
      if (requiredBadgeNames.length === 0) {
        achieved = false
      } else {
        // 모든 필요한 뱃지를 보유했는지 확인
        const hasAllRequiredBadges = requiredBadgeNames.every(badgeName => {
          return userBadges.some(ub => ub.badge.name === badgeName)
        })
        
        // 뱃지 조건을 만족하면 활성화, 만족하지 않으면 비활성화
        achieved = hasAllRequiredBadges
      }

      return {
        ...title,
        achieved: achieved || userTitle?.achieved || false,
        selected: userTitle?.selected || false,
        achievedDate: userTitle?.achievedDate || null
      }
    })

    return NextResponse.json({ titles: titlesWithStatus })

  } catch (error) {
    console.error('칭호 조회 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 