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

    const { id: partyId } = await params;
    const { memberId, confirmed } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: '추방할 멤버 ID가 필요합니다' }, { status: 400 });
    }

    // 확인 절차
    if (!confirmed) {
      return NextResponse.json({ error: '멤버 추방을 확인해주세요' }, { status: 400 });
    }

    // 파티 존재 확인
    const party = await prisma.party.findUnique({
      where: { id: partyId },
      include: {
        leader: {
          select: {
            id: true,
            nickname: true,
          },
        },
        members: {
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

    if (!party) {
      return NextResponse.json({ error: '파티를 찾을 수 없습니다' }, { status: 404 });
    }

    // 파티장만 추방할 수 있음
    if (party.leaderId !== user.id) {
      return NextResponse.json({ error: '파티장만 멤버를 추방할 수 있습니다' }, { status: 403 });
    }

    // 자신을 추방할 수 없음
    if (memberId === user.id) {
      return NextResponse.json({ error: '자신을 추방할 수 없습니다' }, { status: 400 });
    }

    // 멤버가 존재하는지 확인
    const member = party.members.find(m => m.userId === memberId);
    if (!member) {
      return NextResponse.json({ error: '추방할 멤버를 찾을 수 없습니다' }, { status: 404 });
    }

    // 멤버 추방
    await prisma.partyMember.delete({
      where: {
        partyId_userId: {
          partyId,
          userId: memberId,
        },
      },
    });

    // 채팅방에서도 추방
    const chatRoom = await (prisma as any).chatRoom.findUnique({
      where: { partyId },
    });

    if (chatRoom) {
      await (prisma as any).chatParticipant.deleteMany({
        where: {
          chatRoomId: chatRoom.id,
          userId: memberId,
        },
      });

      // 시스템 메시지 생성 (멤버가 추방됨)
      await (prisma as any).chatMessage.create({
        data: {
          chatRoomId: chatRoom.id,
          userId: memberId,
          content: 'SYSTEM_LEAVE',
        },
      });
    }

    return NextResponse.json({ message: '멤버가 추방되었습니다' });
  } catch (error) {
    console.error('멤버 추방 실패:', error);
    return NextResponse.json({ error: '멤버 추방에 실패했습니다' }, { status: 500 });
  }
} 