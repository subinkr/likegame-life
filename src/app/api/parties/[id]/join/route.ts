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

    // 파티 존재 확인
    const party = await prisma.party.findUnique({
      where: { id: partyId },
      include: {
        members: true,
      },
    });

    if (!party) {
      return NextResponse.json({ error: '파티를 찾을 수 없습니다' }, { status: 404 });
    }

    // 이미 참가 중인지 확인
    const existingMember = party.members.find(member => member.userId === user.id);
    if (existingMember) {
      return NextResponse.json({ error: '이미 참가 중인 파티입니다' }, { status: 400 });
    }

    // 파티 인원 수 확인
    if (party.members.length >= party.maxMembers) {
      return NextResponse.json({ error: '파티 인원이 가득 찼습니다' }, { status: 400 });
    }

    // 파티 참가
    await prisma.partyMember.create({
      data: {
        partyId,
        userId: user.id,
      },
    });

    // 채팅방에 참가자 추가
    const chatRoom = await (prisma as any).chatRoom.findUnique({
      where: { partyId },
    });

    if (chatRoom) {
      await (prisma as any).chatParticipant.create({
        data: {
          chatRoomId: chatRoom.id,
          userId: user.id,
        },
      });

      // 시스템 메시지 생성 (사용자가 참가)
      await (prisma as any).chatMessage.create({
        data: {
          chatRoomId: chatRoom.id,
          userId: user.id,
          content: 'SYSTEM_JOIN',
        },
      });
    }

    return NextResponse.json({ message: '파티 참가가 완료되었습니다' });
  } catch (error) {
    console.error('파티 참가 실패:', error);
    return NextResponse.json({ error: '파티 참가에 실패했습니다' }, { status: 500 });
  }
} 