import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 사용자가 참여한 채팅방 목록 조회
    const chatRooms = await (prisma as any).chatRoom.findMany({
      where: {
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
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            user: {
              select: {
                nickname: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const formattedRooms = chatRooms.map((room: any) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      participants: room.participants.map((p: any) => p.user),
      lastMessage: room.messages[0] ? {
        content: room.messages[0].content,
        createdAt: room.messages[0].createdAt.toISOString(),
        user: room.messages[0].user,
      } : undefined,
    }));

    return NextResponse.json(formattedRooms);
  } catch (error) {
    console.error('채팅방 목록 조회 실패:', error);
    return NextResponse.json({ error: '채팅방 목록을 불러오는데 실패했습니다' }, { status: 500 });
  }
} 