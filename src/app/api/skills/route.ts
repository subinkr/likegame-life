import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

// 스킬 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const skills = await prisma.skill.findMany({
      where: { userId: user.id },
      orderBy: { acquiredDate: 'desc' },
      include: {
        parentSkill: true,
        childSkills: true
      }
    })

    return NextResponse.json({ skills })

  } catch (error) {
    console.error('스킬 조회 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 스킬 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { name, description, category, acquiredDate, expiryDate, parentSkillId } = await request.json()

    // 필수 필드 검증
    if (!name || !description || !acquiredDate) {
      return NextResponse.json(
        { error: '스킬명, 설명, 획득일은 필수입니다.' },
        { status: 400 }
      )
    }

    const skill = await prisma.skill.create({
      data: {
        userId: user.id,
        name,
        description,
        category,
        acquiredDate: new Date(acquiredDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        parentSkillId
      },
      include: {
        parentSkill: true,
        childSkills: true
      }
    })

    return NextResponse.json({
      message: '스킬이 등록되었습니다.',
      skill
    })

  } catch (error) {
    console.error('스킬 생성 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 