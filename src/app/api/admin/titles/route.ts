import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { data: titles, error } = await supabaseAdmin
      .from('titles')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('칭호 조회 에러:', error);
      return NextResponse.json({ error: '칭호를 불러오는데 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ titles });
  } catch (error) {
    console.error('Error fetching titles:', error);
    return NextResponse.json({ error: '칭호를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { name, description, rarity, requiredBadges } = body;

    if (!name || !description) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const { data: title, error } = await supabaseAdmin
      .from('titles')
      .insert({
        name,
        description,
        rarity,
        required_badges: requiredBadges || []
      })
      .select()
      .single();

    if (error) {
      console.error('칭호 생성 에러:', error);
      return NextResponse.json({ error: '칭호 생성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error creating title:', error);
    return NextResponse.json({ error: '칭호 생성에 실패했습니다.' }, { status: 500 });
  }
} 