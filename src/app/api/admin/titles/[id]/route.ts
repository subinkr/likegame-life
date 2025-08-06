import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { name, description, rarity, requiredBadges } = body;

    if (!name || !description) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const { data: title, error: titleError } = await supabaseAdmin
      .from('titles')
      .update({
        name,
        description,
        rarity,
        required_badges: requiredBadges || []
      })
      .eq('id', id)
      .select()
      .single();

    if (titleError) {
      return NextResponse.json({ error: '칭호 수정에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ title });
  } catch (error) {
    return NextResponse.json({ error: '칭호 수정에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;

    // 먼저 관련된 UserTitle 레코드들을 삭제
    const { error: userTitleDeleteError } = await supabaseAdmin
      .from('user_titles')
      .delete()
      .eq('title_id', id);

    if (userTitleDeleteError) {
      // 사용자 칭호 삭제 에러 무시
    }

    // 그 다음 Title을 삭제
    const { error: titleDeleteError } = await supabaseAdmin
      .from('titles')
      .delete()
      .eq('id', id);

    if (titleDeleteError) {
      return NextResponse.json({ error: '칭호 삭제에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '칭호 삭제에 실패했습니다.' }, { status: 500 });
  }
} 