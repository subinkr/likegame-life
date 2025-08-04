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
        members: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        }
      }
    });

    if (!party) {
      return NextResponse.json({ error: '파티를 찾을 수 없습니다' }, { status: 404 });
    }

    // 사용자가 파티 멤버인지 확인
    const member = party.members.find(m => m.user.id === user.id);
    if (!member) {
      return NextResponse.json({ error: '파티 멤버가 아닙니다' }, { status: 403 });
    }

    // 파티장은 나갈 수 없음 (해산만 가능)
    if (party.leaderId === user.id) {
      return NextResponse.json({ 
        error: '파티장은 나갈 수 없습니다. 파티를 해산하거나 다른 멤버에게 파티장을 넘겨주세요.' 
      }, { status: 403 });
    }

    // 파티에서 나가기 (PartyMember 레코드 삭제)
    await prisma.partyMember.delete({
      where: {
        partyId_userId: {
          partyId: partyId,
          userId: user.id
        }
      }
    });

    // 해당 파티의 채팅방에서도 자동으로 나가기
    const partyWithChatRoom = await prisma.party.findUnique({
      where: { id: partyId },
      include: {
        chatRoom: true
      }
    });

    if (partyWithChatRoom?.chatRoom) {
      // 채팅방 참가자에서 제거
      await prisma.chatParticipant.deleteMany({
        where: {
          chatRoomId: partyWithChatRoom.chatRoom.id,
          userId: user.id
        }
      });

      // 시스템 메시지 생성 (사용자가 나감)
      await prisma.chatMessage.create({
        data: {
          chatRoomId: partyWithChatRoom.chatRoom.id,
          userId: user.id,
          content: 'SYSTEM_LEAVE',
        },
      });
    }

    return NextResponse.json({ 
      message: '파티에서 나갔습니다',
      partyId 
    });

  } catch (error) {
    console.error('파티 나가기 실패:', error);
    return NextResponse.json({ error: '파티 나가기에 실패했습니다' }, { status: 500 });
  }
} 