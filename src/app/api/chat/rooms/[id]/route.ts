import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSupabase } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const paramsData = await params;
    const { id } = paramsData;

    // 채팅방 정보 조회
    const { data: chatRoom, error } = await supabaseAdmin
      .from('chat_rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // 채팅방 조회 에러 무시
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 파티 채팅방인 경우 파티 멤버십도 확인
    if (chatRoom.party_id) {
      const { data: partyMember, error: partyMemberError } = await supabaseAdmin
        .from('party_members')
        .select('*')
        .eq('party_id', chatRoom.party_id)
        .eq('user_id', user.id)
        .single();

      if (partyMemberError || !partyMember) {
        return NextResponse.json(
          { error: '파티 멤버가 아니므로 채팅방에 접근할 수 없습니다.' },
          { status: 403 }
        );
      }
    }

    // 퀘스트 채팅방인 경우 퀘스트 권한도 확인
    if (chatRoom.quest_id) {
      const { data: quest, error: questError } = await supabaseAdmin
        .from('quests')
        .select('creator_id, accepted_by_user_id')
        .eq('id', chatRoom.quest_id)
        .single();

      if (questError || !quest) {
        return NextResponse.json(
          { error: '퀘스트를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const isCreator = quest.creator_id === user.id;
      const isAcceptor = quest.accepted_by_user_id === user.id;

      if (!isCreator && !isAcceptor) {
        return NextResponse.json(
          { error: '퀘스트 생성자이거나 수락한 사용자가 아니므로 채팅방에 접근할 수 없습니다.' },
          { status: 403 }
        );
      }
    }

    // 사용자가 해당 채팅방의 참가자인지 확인
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('chat_room_participants')
      .select('*')
      .eq('chat_room_id', id)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: '채팅방에 접근할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 채팅방 참가자 목록 조회
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from('chat_room_participants')
      .select(`
        user_id,
        users!inner(nickname)
      `)
      .eq('chat_room_id', id);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      // 참가자 정보 없이도 채팅방 정보는 반환
      return NextResponse.json(chatRoom);
    }

    // 참가자 정보를 필요한 형태로 변환
    const participantsData = participants.map((p: any) => ({
      id: p.user_id,
      nickname: p.users.nickname
    }));

    // 채팅방 정보와 참가자 정보를 함께 반환
    return NextResponse.json({
      ...chatRoom,
      participants: participantsData
    });
  } catch (error) {
    // 채팅방 조회 실패 무시
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 