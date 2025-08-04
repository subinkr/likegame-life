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
    const { confirmed } = await request.json();

    // 확인 절차
    if (!confirmed) {
      return NextResponse.json({ error: '파티 해산을 확인해주세요' }, { status: 400 });
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
      },
    });

    if (!party) {
      return NextResponse.json({ error: '파티를 찾을 수 없습니다' }, { status: 404 });
    }

    // 파티장만 해산할 수 있음
    if (party.leaderId !== user.id) {
      return NextResponse.json({ error: '파티장만 파티를 해산할 수 있습니다' }, { status: 403 });
    }

    // 트랜잭션으로 파티 해산 처리
    await prisma.$transaction(async (tx) => {
      // 채팅방 삭제 (CASCADE로 자동 삭제됨)
      await (tx as any).chatRoom.deleteMany({
        where: { partyId },
      });

      // 파티 멤버 삭제
      await tx.partyMember.deleteMany({
        where: { partyId },
      });

      // 파티 삭제
      await tx.party.delete({
        where: { id: partyId },
      });
    });

    return NextResponse.json({ message: '파티가 해산되었습니다' });
  } catch (error) {
    console.error('파티 해산 실패:', error);
    return NextResponse.json({ error: '파티 해산에 실패했습니다' }, { status: 500 });
  }
} 