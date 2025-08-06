import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

// 특정 책 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select(`
        *,
        wisdom_notes:wisdom_notes(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 책 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { title, author } = body;

    if (!title || !author) {
      return NextResponse.json({ error: 'Title and author are required' }, { status: 400 });
    }

    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const { data: updatedBook, error: updateError } = await supabaseAdmin
      .from('books')
      .update({
        title,
        author,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('책 수정 에러:', updateError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 책 삭제
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

    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('books')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('책 삭제 에러:', deleteError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 