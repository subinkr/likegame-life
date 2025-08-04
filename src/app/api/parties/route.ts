import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    console.log('파티 목록 조회 시작');
    const parties = await prisma.party.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedParties = parties.map(party => ({
      id: party.id,
      name: party.name,
      description: party.description,
      maxMembers: party.maxMembers,
      leader: party.leader,
      members: party.members.map(member => member.user),
    }));

    console.log('파티 목록 조회 완료:', formattedParties.length, '개');
    return NextResponse.json(formattedParties);
  } catch (error) {
    console.error('파티 목록 조회 실패:', error);
    return NextResponse.json({ error: '파티 목록을 불러오는데 실패했습니다' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('파티 생성 요청 시작');
    
    const user = await getCurrentUser(request);
    if (!user) {
      console.log('인증 실패');
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    console.log('사용자 확인 완료:', user.id);

    const body = await request.json();
    console.log('요청 본문:', body);
    
    const { name, description, maxMembers } = body;

    if (!name || !description || !maxMembers) {
      console.log('필수 필드 누락:', { name, description, maxMembers });
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 });
    }

    // 최대 인원 제한 (2-6명)
    if (maxMembers < 2 || maxMembers > 6) {
      console.log('최대 인원 제한 위반:', maxMembers);
      return NextResponse.json({ error: '파티 인원은 2명에서 6명 사이여야 합니다' }, { status: 400 });
    }

    console.log('파티 생성 시작:', { name, description, maxMembers, leaderId: user.id });

    // 파티 생성
    const party = await prisma.party.create({
      data: {
        name,
        description,
        maxMembers,
        leaderId: user.id,
      },
      include: {
        leader: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    console.log('파티 생성 완료:', party.id);

    // 파티장을 멤버로 추가
    await prisma.partyMember.create({
      data: {
        partyId: party.id,
        userId: user.id,
      },
    });

    console.log('파티장 멤버 추가 완료');

    // 파티용 채팅방 생성
    const chatRoom = await (prisma as any).chatRoom.create({
      data: {
        name: party.name,
        type: 'PARTY',
        partyId: party.id,
      },
    });

    console.log('채팅방 생성 완료:', chatRoom.id);

    // 파티장을 채팅방 참가자로 추가
    await (prisma as any).chatParticipant.create({
      data: {
        chatRoomId: chatRoom.id,
        userId: user.id,
      },
    });

    console.log('채팅방 참가자 추가 완료');

    const result = {
      id: party.id,
      name: party.name,
      description: party.description,
      maxMembers: party.maxMembers,
      leader: party.leader,
      members: [party.leader],
    };

    console.log('파티 생성 완료:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('파티 생성 실패 - 상세 에러:', error);
    console.error('에러 스택:', error instanceof Error ? error.stack : '스택 없음');
    return NextResponse.json({ 
      error: '파티 생성에 실패했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 에러'
    }, { status: 500 });
  }
} 