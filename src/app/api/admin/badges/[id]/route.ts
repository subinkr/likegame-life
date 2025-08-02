import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('likegame-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, rarity, icon } = body;

    if (!name || !description || !icon) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const badge = await prisma.badge.update({
      where: { id: params.id },
      data: {
        name,
        description,
        rarity,
        icon
      }
    });

    return NextResponse.json({ badge });
  } catch (error) {
    console.error('Error updating badge:', error);
    return NextResponse.json({ error: '업적 수정에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('likegame-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 먼저 관련된 UserBadge 레코드들을 삭제
    await prisma.userBadge.deleteMany({
      where: { badgeId: params.id }
    });

    // 그 다음 Badge를 삭제
    await prisma.badge.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting badge:', error);
    return NextResponse.json({ error: '업적 삭제에 실패했습니다.' }, { status: 500 });
  }
} 