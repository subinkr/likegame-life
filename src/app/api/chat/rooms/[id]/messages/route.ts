import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { id: chatRoomId } = await params;

    // 채팅방 참가자 확인
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId,
          userId: user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: '채팅방에 접근할 권한이 없습니다' }, { status: 403 });
    }

    // 메시지 조회
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('메시지 조회 실패:', error);
    return NextResponse.json({ error: '메시지를 불러오는데 실패했습니다' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { id: chatRoomId } = await params;
    const { content, userId: externalUserId, user: externalUser } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: '메시지 내용이 필요합니다' }, { status: 400 });
    }

    // 사용자가 해당 채팅방의 참가자인지 확인
    const participant = await (prisma as any).chatParticipant.findFirst({
      where: {
        chatRoomId,
        userId: user.id,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: '채팅방에 접근할 권한이 없습니다' }, { status: 403 });
    }

    // 메시지 저장 (외부 사용자 또는 현재 사용자)
    const messageUserId = externalUserId || user.id;
    const message = await (prisma as any).chatMessage.create({
      data: {
        chatRoomId,
        userId: messageUserId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    // 채팅방 업데이트 시간 갱신
    await (prisma as any).chatRoom.update({
      where: { id: chatRoomId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('메시지 전송 실패:', error);
    return NextResponse.json({ error: '메시지 전송에 실패했습니다' }, { status: 500 });
  }
} 