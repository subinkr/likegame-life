import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { id: questId } = await params;

    // 퀘스트 존재 확인
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true,
          },
        },
        acceptedByUser: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    if (!quest) {
      return NextResponse.json({ error: '퀘스트를 찾을 수 없습니다' }, { status: 404 });
    }

    // 퀘스트 생성자만 취소할 수 있음
    if (quest.creatorId !== user.id) {
      return NextResponse.json({ error: '퀘스트 생성자만 취소할 수 있습니다' }, { status: 403 });
    }

    // 이미 완료된 퀘스트는 취소할 수 없음
    if (quest.status === 'COMPLETED') {
      return NextResponse.json({ error: '완료된 퀘스트는 취소할 수 없습니다' }, { status: 400 });
    }

    // 퀘스트 취소 (수락자가 있어도 취소 가능)
    await prisma.quest.update({
      where: { id: questId },
      data: {
        status: 'CANCELLED',
        acceptedBy: null, // 수락자 정보도 초기화
      },
    });

    return NextResponse.json({ 
      message: '퀘스트가 취소되었습니다',
      quest: {
        ...quest,
        status: 'CANCELLED',
        acceptedBy: null,
      }
    });
  } catch (error) {
    console.error('퀘스트 취소 실패:', error);
    return NextResponse.json({ error: '퀘스트 취소에 실패했습니다' }, { status: 500 });
  }
} 