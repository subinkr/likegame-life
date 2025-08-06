import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUserFromSupabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사용자가 참여한 채팅방 목록 조회
    const { data: chatRooms, error } = await supabaseAdmin
      .from('chat_rooms')
      .select(`
        *,
        participants:chat_room_participants(
          user:users(id, nickname)
        ),
        party:parties(
          members:party_members(user_id)
        ),
        quest:quests(
          creator_id,
          accepted_by_user_id
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      // 채팅방 목록 조회 에러 무시
      return NextResponse.json(
        { error: '채팅방 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 사용자가 참여한 채팅방만 필터링
    const userChatRooms = (chatRooms || []).filter((room: any) => {
      const participants = room.participants || [];
      const isParticipant = participants.some((p: any) => p.user.id === user.id);
      
      // 파티 채팅방인 경우 파티 멤버십도 확인
      if (room.party_id && room.party) {
        const partyMembers = room.party.members || [];
        const isPartyMember = partyMembers.some((m: any) => m.user_id === user.id);
        return isParticipant && isPartyMember;
      }
      
      // 퀘스트 채팅방인 경우 퀘스트 권한도 확인
      if (room.quest_id && room.quest) {
        const isCreator = room.quest.creator_id === user.id;
        const isAcceptor = room.quest.accepted_by_user_id === user.id;
        return isParticipant && (isCreator || isAcceptor);
      }
      
      return isParticipant;
    });

    // 응답 형식 맞추기
    const formattedChatRooms = userChatRooms.map((room: any) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      participants: (room.participants || []).map((p: any) => p.user),
    }));

    return NextResponse.json(formattedChatRooms);
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 