import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSupabase } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { id: questId } = await params;

    // 퀘스트 조회
    const { data: quest, error: questError } = await supabaseAdmin
      .from('quests')
      .select(`
        *,
        chat_room:chat_rooms(*)
      `)
      .eq('id', questId)
      .single();

    if (questError || !quest) {
      return NextResponse.json({ error: '퀘스트를 찾을 수 없습니다' }, { status: 404 });
    }

    // 수락한 사용자만 거절할 수 있음
    if (!quest.accepted_by_user_id || quest.accepted_by_user_id !== user.id) {
      return NextResponse.json({ error: '수락한 사용자만 거절할 수 있습니다' }, { status: 403 });
    }

    // 퀘스트가 진행 중인 상태인지 확인
    if (quest.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: '진행 중인 퀘스트만 거절할 수 있습니다' }, { status: 400 });
    }

    // 퀘스트 거절
    const { error: questUpdateError } = await supabaseAdmin
      .from('quests')
      .update({
        status: 'OPEN',
        accepted_by_user_id: null,
      })
      .eq('id', questId);

    if (questUpdateError) {
      return NextResponse.json({ error: '퀘스트 거절에 실패했습니다' }, { status: 500 });
    }

    // 채팅방에 포기 메시지 추가
    if (quest.chat_room) {
      const { error: messageError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          chat_room_id: quest.chat_room.id,
          user_id: user.id,
          content: `${user.nickname || user.email?.split('@')[0]}님이 퀘스트를 포기했습니다.`,
        });

      if (messageError) {
        // 시스템 메시지 생성 에러 무시
      }
    }

    return NextResponse.json({ 
      message: '퀘스트를 거절했습니다',
      quest: {
        ...quest,
        status: 'OPEN',
        accepted_by_user_id: null,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: '퀘스트 거절에 실패했습니다' }, { status: 500 });
  }
} 