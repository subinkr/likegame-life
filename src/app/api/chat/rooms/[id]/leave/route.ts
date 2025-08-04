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

    const { id: chatRoomId } = await params;

    // 채팅방 존재 확인 및 퀘스트 정보 포함
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        },
        quest: {
          select: {
            id: true,
            status: true,
            acceptedBy: true,
            creatorId: true
          }
        }
      }
    });

    if (!chatRoom) {
      return NextResponse.json({ error: '채팅방을 찾을 수 없습니다' }, { status: 404 });
    }

    // 사용자가 채팅방 참가자인지 확인
    const participant = chatRoom.participants.find(p => p.user.id === user.id);
    if (!participant) {
      return NextResponse.json({ error: '채팅방 참가자가 아닙니다' }, { status: 403 });
    }

    // 해당 채팅방이 활성 퀘스트의 채팅방인지 확인
    // 퀘스트 수락자 또는 생성자인 경우 나가기 제한
    if (chatRoom.quest && 
        ['OPEN', 'IN_PROGRESS'].includes(chatRoom.quest.status) &&
        (chatRoom.quest.acceptedBy === user.id || chatRoom.quest.creatorId === user.id)) {
      return NextResponse.json({ 
        error: '퀘스트 진행 중에는 채팅방을 나갈 수 없습니다. 퀘스트를 완료하거나 포기한 후 다시 시도해주세요.' 
      }, { status: 403 });
    }

    // 파티 채팅방인 경우 파티장 나가기 제한
    if (chatRoom.partyId) {
      const party = await prisma.party.findUnique({
        where: { id: chatRoom.partyId },
        select: { leaderId: true }
      });
      
      if (party && party.leaderId === user.id) {
        return NextResponse.json({ 
          error: '파티장은 채팅방을 나갈 수 없습니다. 파티를 해산하거나 다른 멤버에게 파티장을 넘겨주세요.' 
        }, { status: 403 });
      }
    }

    // 채팅방에서 참가자 제거
    await prisma.chatParticipant.delete({
      where: {
        chatRoomId_userId: {
          chatRoomId,
          userId: user.id,
        },
      },
    });

    // 시스템 메시지 생성 (사용자가 나감)
    await prisma.chatMessage.create({
      data: {
        chatRoomId,
        userId: user.id,
        content: 'SYSTEM_LEAVE',
      },
    });

    // 파티 채팅방인 경우 파티에서도 자동으로 나가기
    if (chatRoom.partyId) {
      await prisma.partyMember.delete({
        where: {
          partyId_userId: {
            partyId: chatRoom.partyId,
            userId: user.id,
          },
        },
      });
    }

    return NextResponse.json({ message: '채팅방에서 나갔습니다' });

  } catch (error) {
    console.error('채팅방 나가기 실패:', error);
    return NextResponse.json({ error: '채팅방 나가기에 실패했습니다' }, { status: 500 });
  }
} 