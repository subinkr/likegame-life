import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

// 책 목록 조회
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Books GET 요청 시작');
    
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      console.log('❌ 인증 실패 - 사용자를 찾을 수 없음');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ 인증 성공:', user.id, user.email);

    const { data: books, error: booksError } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (booksError) {
      console.error('❌ 책 목록 조회 에러:', booksError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    console.log('✅ 책 목록 조회 성공:', books?.length || 0, '개');

    return NextResponse.json(books);
  } catch (error) {
    console.error('❌ Books GET 요청 중 예외 발생:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 새 책 등록
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, author } = body;

    if (!title || !author) {
      return NextResponse.json({ error: 'Title and author are required' }, { status: 400 });
    }

    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .insert({
        user_id: user.id,
        title,
        author,
      })
      .select()
      .single();

    if (bookError) {
      console.error('책 생성 에러:', bookError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}