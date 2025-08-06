import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

// 초서 목록 조회
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Wisdom GET 요청 시작');
    
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      console.log('❌ 인증 실패 - 사용자를 찾을 수 없음');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ 인증 성공:', user.id, user.email);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    console.log('📊 요청 파라미터:', { page, limit, skip });

    const { data: wisdomNotes, error: wisdomNotesError } = await supabaseAdmin
      .from('wisdom_notes')
      .select(`
        *,
        book:books(id, title, author)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .range(skip, skip + limit - 1);

    if (wisdomNotesError) {
      console.error('❌ 초서 조회 에러:', wisdomNotesError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    console.log('✅ 초서 조회 성공:', wisdomNotes?.length || 0, '개');

    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('wisdom_notes')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (countError) {
      console.error('❌ 초서 개수 조회 에러:', countError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      wisdomNotes,
      pagination: {
        page,
        limit,
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasNextPage: page * limit < (totalCount || 0),
      }
    });
  } catch (error) {
    console.error('❌ Wisdom GET 요청 중 예외 발생:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 새 초서 등록
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookId, quote, impression, date } = body;

    if (!bookId || !quote || !impression) {
      return NextResponse.json({ error: 'Book ID, quote, and impression are required' }, { status: 400 });
    }

    // 책이 존재하는지 확인
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const { data: wisdomNote, error: wisdomNoteError } = await supabaseAdmin
      .from('wisdom_notes')
      .insert({
        user_id: user.id,
        book_id: bookId,
        quote,
        impression,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
      })
      .select(`
        *,
        book:books(id, title, author)
      `)
      .single();

    if (wisdomNoteError) {
      console.error('초서 생성 에러:', wisdomNoteError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json(wisdomNote, { status: 201 });
  } catch (error) {
    console.error('Error creating wisdom note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}