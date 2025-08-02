import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

// 스킬 수정
export async function PUT(
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

    const skillId = params.id
    const { name, description, category, acquiredDate, expiryDate, parentSkillId } = await request.json()

    // 스킬 존재 확인 및 소유권 확인
    const existingSkill = await prisma.skill.findFirst({
      where: {
        id: skillId,
        userId: user.id
      }
    })

    if (!existingSkill) {
      return NextResponse.json(
        { error: '존재하지 않는 스킬입니다.' },
        { status: 404 }
      )
    }

    // 필수 필드 검증
    if (!name || !description || !acquiredDate) {
      return NextResponse.json(
        { error: '스킬명, 설명, 획득일은 필수입니다.' },
        { status: 400 }
      )
    }

    const skill = await prisma.skill.update({
      where: { id: skillId },
      data: {
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
      message: '스킬이 수정되었습니다.',
      skill
    })

  } catch (error) {
    console.error('스킬 수정 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 스킬 삭제
export async function DELETE(
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

    const skillId = params.id

    // 스킬 존재 확인 및 소유권 확인
    const existingSkill = await prisma.skill.findFirst({
      where: {
        id: skillId,
        userId: user.id
      }
    })

    if (!existingSkill) {
      return NextResponse.json(
        { error: '존재하지 않는 스킬입니다.' },
        { status: 404 }
      )
    }

    // 스킬 삭제
    await prisma.skill.delete({
      where: { id: skillId }
    })

    return NextResponse.json({
      message: '스킬이 삭제되었습니다.'
    })

  } catch (error) {
    console.error('스킬 삭제 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 