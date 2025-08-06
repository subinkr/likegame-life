import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

// 개별 민첩 기록 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: recordId } = await params;

    // 기록이 사용자의 것인지 확인
    const { data: record, error: fetchError } = await supabaseAdmin
      .from('agility_records')
      .select('id, user_id')
      .eq('id', recordId)
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // 기록 소유자 확인
    if (record.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 기록 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('agility_records')
      .delete()
      .eq('id', recordId);

    if (deleteError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
