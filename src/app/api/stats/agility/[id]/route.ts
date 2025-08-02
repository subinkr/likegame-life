import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/server-auth';

// 개별 민첩 기록 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // 기록이 존재하고 해당 사용자의 것인지 확인
    const record = await prisma.stat.findFirst({
      where: {
        id: id,
        userId: user.id,
        agility: { gt: 0 }
      }
    });

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // 기록 삭제
    await prisma.stat.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting agility record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 