import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSupabase } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { id: questId } = await params;

    // 퀘스트 존재 확인
    const { data: quest, error: questError } = await supabaseAdmin
      .from('quests')
      .select(`
        *,
        creator:users!creator_id(id, nickname),
        accepted_by_user:users!accepted_by_user_id(id, nickname)
      `)
      .eq('id', questId)
      .single();

    if (questError || !quest) {
      return NextResponse.json({ error: '퀘스트를 찾을 수 없습니다' }, { status: 404 });
    }

    // 퀘스트 생성자만 완료할 수 있음
    if (quest.creator_id !== user.id) {
      return NextResponse.json({ error: '퀘스트 생성자만 완료할 수 있습니다' }, { status: 403 });
    }

    // 수락된 퀘스트만 완료할 수 있음
    if (!quest.accepted_by_user_id) {
      return NextResponse.json({ error: '수락된 퀘스트만 완료할 수 있습니다' }, { status: 400 });
    }

    // 이미 완료된 퀘스트는 다시 완료할 수 없음
    if (quest.status === 'COMPLETED') {
      return NextResponse.json({ error: '이미 완료된 퀘스트입니다' }, { status: 400 });
    }

    // 퀘스트 완료
    const { error: questUpdateError } = await supabaseAdmin
      .from('quests')
      .update({
        status: 'COMPLETED',
      })
      .eq('id', questId);

    if (questUpdateError) {
      console.error('퀘스트 완료 에러:', questUpdateError);
      return NextResponse.json({ error: '퀘스트 완료에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `퀘스트가 완료되었습니다.`,
      quest: {
        ...quest,
        status: 'COMPLETED',
      }
    });
  } catch (error) {
    console.error('퀘스트 완료 실패:', error);
    console.error('에러 상세:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: user?.id
    });
    return NextResponse.json({ error: '퀘스트 완료에 실패했습니다' }, { status: 500 });
  }
} 