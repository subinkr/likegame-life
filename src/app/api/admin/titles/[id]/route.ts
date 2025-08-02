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
    const { name, description, rarity, requiredBadges } = body;

    if (!name || !description) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const title = await prisma.title.update({
      where: { id: params.id },
      data: {
        name,
        description,
        rarity,
        requiredBadges: requiredBadges || []
      }
    });

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error updating title:', error);
    return NextResponse.json({ error: '칭호 수정에 실패했습니다.' }, { status: 500 });
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

    // 먼저 관련된 UserTitle 레코드들을 삭제
    await prisma.userTitle.deleteMany({
      where: { titleId: params.id }
    });

    // 그 다음 Title을 삭제
    await prisma.title.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting title:', error);
    return NextResponse.json({ error: '칭호 삭제에 실패했습니다.' }, { status: 500 });
  }
} 