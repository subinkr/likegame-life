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

    // 채팅방 정보 조회 (사용자가 참여한 채팅방인지 확인)
    const chatRoom = await (prisma as any).chatRoom.findFirst({
      where: {
        id: chatRoomId,
        participants: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
        },
      },
    });

    if (!chatRoom) {
      return NextResponse.json({ error: '채팅방을 찾을 수 없습니다' }, { status: 404 });
    }

    const formattedChatRoom = {
      id: chatRoom.id,
      name: chatRoom.name,
      type: chatRoom.type,
      participants: chatRoom.participants.map((p: any) => p.user),
    };

    return NextResponse.json(formattedChatRoom);
  } catch (error) {
    console.error('채팅방 정보 조회 실패:', error);
    return NextResponse.json({ error: '채팅방 정보를 불러오는데 실패했습니다' }, { status: 500 });
  }
} 