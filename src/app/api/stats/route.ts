import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

// 스탯 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || getCurrentMonth()

    // 해당 월의 모든 기록을 가져와서 합계 계산
    const stats = await prisma.stat.findMany({
      where: {
        userId: user.id,
        month
      }
    })

    // 각 스탯의 합계 계산
    const totalStats = stats.reduce((acc, stat) => ({
      strength: acc.strength + stat.strength,
      agility: acc.agility + stat.agility,
      wisdom: acc.wisdom + stat.wisdom
    }), { strength: 0, agility: 0, wisdom: 0 })

    // 랭크 계산
    const strengthRank = getRank('strength', totalStats.strength)
    const agilityRank = getRank('agility', totalStats.agility)
    const wisdomRank = getRank('wisdom', totalStats.wisdom)

    return NextResponse.json({
      stats: totalStats,
      ranks: { strengthRank, agilityRank, wisdomRank }
    })

  } catch (error) {
    console.error('스탯 조회 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 스탯 업데이트
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { strength, agility, wisdom, month } = await request.json()
    const targetMonth = month || getCurrentMonth()

    // 새로운 기록 생성 (기존 기록을 덮어쓰지 않음)
    const stats = await prisma.stat.create({
      data: {
        userId: user.id,
        month: targetMonth,
        strength: strength || 0,
        agility: agility || 0,
        wisdom: wisdom || 0
      }
    })

    // 해당 월의 총 스탯 계산
    const monthlyStats = await prisma.stat.findMany({
      where: {
        userId: user.id,
        month: targetMonth
      }
    })

    const totalStats = monthlyStats.reduce((acc, stat) => ({
      strength: acc.strength + stat.strength,
      agility: acc.agility + stat.agility,
      wisdom: acc.wisdom + stat.wisdom
    }), { strength: 0, agility: 0, wisdom: 0 })

    // 랭크 계산
    const strengthRank = getRank('strength', totalStats.strength)
    const agilityRank = getRank('agility', totalStats.agility)
    const wisdomRank = getRank('wisdom', totalStats.wisdom)

    return NextResponse.json({
      message: '스탯이 업데이트되었습니다.',
      stats,
      ranks: { strengthRank, agilityRank, wisdomRank }
    })

  } catch (error) {
    console.error('스탯 업데이트 에러:', error)
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