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

    const { id: questId } = await params;
    
    console.log('퀘스트 ID로 채팅방 조회:', {
      questId,
      userId: user.id
    });

    // 퀘스트 ID로 채팅방 찾기
    const chatRoom = await (prisma as any).chatRoom.findFirst({
      where: {
        questId: questId,
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
      console.log('퀘스트 채팅방을 찾을 수 없음:', {
        questId,
        userId: user.id
      });
      return NextResponse.json({ error: '채팅방을 찾을 수 없습니다' }, { status: 404 });
    }

    const formattedChatRoom = {
      id: chatRoom.id,
      name: chatRoom.name,
      type: chatRoom.type,
      participants: chatRoom.participants.map((p: any) => p.user),
    };

    console.log('퀘스트 채팅방 찾음:', {
      chatRoomId: chatRoom.id,
      questId
    });

    return NextResponse.json(formattedChatRoom);
  } catch (error) {
    console.error('퀘스트 채팅방 조회 실패:', error);
    return NextResponse.json({ error: '채팅방 정보를 불러오는데 실패했습니다' }, { status: 500 });
  }
} 