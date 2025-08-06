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

    // 퀘스트 정보 조회
    const { data: quest, error } = await supabaseAdmin
      .from('quests')
      .select(`
        *,
        creator:users!creator_id(id, email, nickname),
        accepted_by_user:users!accepted_by_user_id(id, email, nickname)
      `)
      .eq('id', id)
      .single();

    if (error || !quest) {
      return NextResponse.json(
        { error: '퀘스트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(quest);
  } catch (error) {
    console.error('퀘스트 조회 실패:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 퀘스트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { id: questId } = await params
    const { title, description, location, reward } = await request.json()

    // 퀘스트 존재 확인 및 소유권 확인
    const { data: existingQuest, error: existingQuestError } = await supabaseAdmin
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('creator_id', user.id)
      .single();

    if (existingQuestError || !existingQuest) {
      return NextResponse.json(
        { error: '존재하지 않는 퀘스트입니다.' },
        { status: 404 }
      );
    }

    // 필수 필드 검증
    if (!title || !description || !location || !reward) {
      return NextResponse.json(
        { error: '제목, 내용, 위치, 사례금은 필수입니다.' },
        { status: 400 }
      );
    }

    const { data: quest, error: questUpdateError } = await supabaseAdmin
      .from('quests')
      .update({
        title,
        description,
        location,
        reward: parseInt(reward)
      })
      .eq('id', questId)
      .select(`
        *,
        creator:users!creator_id(id, email, nickname),
        accepted_by_user:users!accepted_by_user_id(id, email, nickname)
      `)
      .single();

    if (questUpdateError) {
      console.error('퀘스트 수정 에러:', questUpdateError);
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '퀘스트가 수정되었습니다.',
      quest
    })

  } catch (error) {
    console.error('퀘스트 수정 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 퀘스트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { id: questId } = await params

    // 퀘스트 존재 확인 및 소유권 확인
    const { data: existingQuest, error: existingQuestError } = await supabaseAdmin
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('creator_id', user.id)
      .single();

    if (existingQuestError || !existingQuest) {
      return NextResponse.json(
        { error: '존재하지 않는 퀘스트입니다.' },
        { status: 404 }
      );
    }

    // 퀘스트 삭제
    await supabaseAdmin.from('quests').delete().eq('id', questId )

    return NextResponse.json({
      message: '퀘스트가 삭제되었습니다.'
    })

  } catch (error) {
    console.error('퀘스트 삭제 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 