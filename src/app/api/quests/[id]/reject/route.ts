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

    // 퀘스트 조회
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      include: {
        chatRoom: true,
      },
    });

    if (!quest) {
      return NextResponse.json({ error: '퀘스트를 찾을 수 없습니다' }, { status: 404 });
    }

    // 수락자인지 확인
    if (!quest.acceptedBy || quest.acceptedBy !== user.id) {
      return NextResponse.json({ error: '퀘스트를 수락한 사용자가 아닙니다' }, { status: 403 });
    }

    // 퀘스트가 진행 중인 상태인지 확인
    if (quest.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: '진행 중인 퀘스트만 거절할 수 있습니다' }, { status: 400 });
    }

    // 퀘스트 상태를 OPEN으로 되돌리고 수락자 정보 제거
    await prisma.quest.update({
      where: { id: questId },
      data: {
        status: 'OPEN',
        acceptedBy: null,
      },
    });

    // 채팅방이 있다면 삭제
    if (quest.chatRoom) {
      await (prisma as any).chatRoom.delete({
        where: { id: quest.chatRoom.id },
      });
    }

    return NextResponse.json({ 
      message: '퀘스트를 거절했습니다',
      quest: {
        ...quest,
        status: 'OPEN',
        acceptedBy: null,
      }
    });
  } catch (error) {
    console.error('퀘스트 거절 실패:', error);
    return NextResponse.json({ error: '퀘스트 거절에 실패했습니다' }, { status: 500 });
  }
} 