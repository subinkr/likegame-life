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
    const { name, description, rarity, icon } = body;

    if (!name || !description || !icon) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const { data: badge, error } = await supabaseAdmin
      .from('badges')
      .update({
        name,
        description,
        rarity,
        icon
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('뱃지 업데이트 에러:', error);
      return NextResponse.json({ error: '업적 수정에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ badge });
  } catch (error) {
    console.error('Error updating badge:', error);
    return NextResponse.json({ error: '업적 수정에 실패했습니다.' }, { status: 500 });
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

    // 먼저 관련된 UserBadge 레코드들을 삭제
    const { error: deleteUserBadgesError } = await supabaseAdmin
      .from('user_badges')
      .delete()
      .eq('badge_id', id);

    if (deleteUserBadgesError) {
      console.error('사용자 뱃지 삭제 에러:', deleteUserBadgesError);
      return NextResponse.json({ error: '업적 삭제에 실패했습니다.' }, { status: 500 });
    }

    // 그 다음 Badge를 삭제
    const { error: deleteBadgeError } = await supabaseAdmin
      .from('badges')
      .delete()
      .eq('id', id);

    if (deleteBadgeError) {
      console.error('뱃지 삭제 에러:', deleteBadgeError);
      return NextResponse.json({ error: '업적 삭제에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting badge:', error);
    return NextResponse.json({ error: '업적 삭제에 실패했습니다.' }, { status: 500 });
  }
} 