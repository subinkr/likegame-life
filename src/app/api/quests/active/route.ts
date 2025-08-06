import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    
    if (!user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const userId = user.id;

    // 사용자가 수락하거나 생성한 활성 퀘스트 조회 (채팅방 정보 포함)
    const { data: activeQuest, error } = await supabaseAdmin
      .from('quests')
      .select(`
        *,
        creator:users!creator_id(id, nickname),
        accepted_by_user:users!accepted_by_user_id(id, nickname),
        chat_room:chat_rooms(id, name)
      `)
      .or(`accepted_by_user_id.eq.${userId},creator_id.eq.${userId}`)
      .eq('status', 'IN_PROGRESS')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116는 결과가 없을 때
      return NextResponse.json(
        { error: '퀘스트 정보를 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasActiveQuest: !!activeQuest,
      quest: activeQuest ? {
        id: activeQuest.id,
        title: activeQuest.title,
        description: activeQuest.description,
        status: activeQuest.status,
        chatRoomId: activeQuest.chat_room?.id || null,
        creator: activeQuest.creator,
        acceptedBy: activeQuest.accepted_by_user
      } : null
    });

  } catch (error) {
    return NextResponse.json(
      { error: '퀘스트 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 