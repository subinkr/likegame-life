import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

// 메인 페이지용 스탯 조회 (힘: 최고 기록, 민첩: 누적 기록, 지혜: 월 합계)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || getCurrentMonth()

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

    // 민첩: 30일간 누적 기록 (삭제되지 않은 기록들만)
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

    const stats = {
      strength: bestStrength,
      agility: totalAgility,
      wisdom: wisdomCount
    }

    // 랭크 계산
    const strengthRank = getRank('strength', stats.strength)
    const agilityRank = getRank('agility', stats.agility)
    const wisdomRank = getRank('wisdom', stats.wisdom)

    // 랭크 기반 칭호 자동 업데이트


    return NextResponse.json({
      stats,
      ranks: { strengthRank, agilityRank, wisdomRank }
    })

  } catch (error) {
    console.error('메인 스탯 조회 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 랭크 계산 함수
function getRank(type: string, value: number): string {
  const thresholds = {
    strength: { F: 0, E: 100, D: 200, C: 300, B: 400, A: 500, S: 600 },
    agility: { F: 0, E: 100, D: 200, C: 300, B: 400, A: 500, S: 600 },
    wisdom: { F: 0, E: 30, D: 60, C: 90, B: 120, A: 150, S: 180 }
  }

  const currentThresholds = thresholds[type as keyof typeof thresholds]
  
  if (value >= currentThresholds.S) return 'S'
  if (value >= currentThresholds.A) return 'A'
  if (value >= currentThresholds.B) return 'B'
  if (value >= currentThresholds.C) return 'C'
  if (value >= currentThresholds.D) return 'D'
  if (value >= currentThresholds.E) return 'E'
  return 'F'
}





function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
} 