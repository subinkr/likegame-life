import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/server-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // 해당 초서가 현재 사용자의 것인지 확인
    const wisdomNote = await prisma.wisdomNote.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!wisdomNote) {
      return NextResponse.json({ error: 'Wisdom note not found' }, { status: 404 });
    }

    // 초서 삭제
    await prisma.wisdomNote.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Wisdom note deleted successfully' });
  } catch (error) {
    console.error('Error deleting wisdom note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 