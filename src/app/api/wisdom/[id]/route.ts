import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 해당 초서가 현재 사용자의 것인지 확인
    const { data: wisdomNote, error: wisdomNoteError } = await supabaseAdmin
      .from('wisdom_notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (wisdomNoteError || !wisdomNote) {
      return NextResponse.json({ error: 'Wisdom note not found' }, { status: 404 });
    }

    // 초서 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('wisdom_notes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Wisdom note deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 