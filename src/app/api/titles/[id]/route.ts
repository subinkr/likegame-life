import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/server-auth'

// 칭호 수정
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

    const { id } = params
    const { name, description, category, rarity, requirement, requiredBadges } = await request.json()

    // 필수 필드 검증
    if (!name || !description || !rarity || !requirement) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기존 칭호 확인
    const existingTitle = await prisma.title.findUnique({
      where: { id }
    })

    if (!existingTitle) {
      return NextResponse.json(
        { error: '칭호를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 칭호 업데이트
    const updatedTitle = await prisma.title.update({
      where: { id },
      data: {
        name,
        description,
        category,
        rarity,
        requirement,
        requiredBadges: requiredBadges || []
      }
    })

    return NextResponse.json({
      message: '칭호가 성공적으로 수정되었습니다.',
      title: updatedTitle
    })

  } catch (error) {
    console.error('칭호 수정 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 칭호 삭제
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

    const { id } = params

    // 기존 칭호 확인
    const existingTitle = await prisma.title.findUnique({
      where: { id }
    })

    if (!existingTitle) {
      return NextResponse.json(
        { error: '칭호를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 칭호 삭제
    await prisma.title.delete({
      where: { id }
    })

    return NextResponse.json({
      message: '칭호가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('칭호 삭제 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 