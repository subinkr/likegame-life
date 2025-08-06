import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { data: badges, error } = await supabaseAdmin
      .from('badges')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: '업적을 불러오는데 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ badges });
  } catch (error) {
    return NextResponse.json({ error: '업적을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { name, description, rarity, icon } = body;

    if (!name || !description || !icon) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const { data: badge, error } = await supabaseAdmin
      .from('badges')
      .insert({
        name,
        description,
        rarity,
        icon
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '업적 생성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ badge });
  } catch (error) {
    return NextResponse.json({ error: '업적 생성에 실패했습니다.' }, { status: 500 });
  }
} 