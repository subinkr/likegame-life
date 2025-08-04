import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await getCurrentUser(request);
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

    // 퀘스트 생성자만 완료할 수 있음
    if (quest.creatorId !== user.id) {
      return NextResponse.json({ error: '퀘스트 생성자만 완료할 수 있습니다' }, { status: 403 });
    }

    // 수락된 퀘스트만 완료할 수 있음
    if (!quest.acceptedBy) {
      return NextResponse.json({ error: '수락되지 않은 퀘스트는 완료할 수 없습니다' }, { status: 400 });
    }

    // 이미 완료된 퀘스트는 다시 완료할 수 없음
    if (quest.status === 'COMPLETED') {
      return NextResponse.json({ error: '이미 완료된 퀘스트입니다' }, { status: 400 });
    }

    // 퀘스트 완료
    await prisma.quest.update({
      where: { id: questId },
      data: {
        status: 'COMPLETED',
        rewardPaid: true,
      },
    });

    return NextResponse.json({ 
      message: `퀘스트가 완료되었습니다. ${quest.reward.toLocaleString()}원이 지급되었습니다.`,
      quest: {
        ...quest,
        status: 'COMPLETED',
        rewardPaid: true,
      }
    });
  } catch (error) {
    console.error('퀘스트 완료 실패:', error);
    console.error('에러 상세:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: user?.id
    });
    return NextResponse.json({ error: '퀘스트 완료에 실패했습니다' }, { status: 500 });
  }
} 