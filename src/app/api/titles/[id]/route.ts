import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

// 칭호 수정
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

    const { id } = await params
    const { name, description, rarity, requiredBadges } = await request.json()

    // 필수 필드 검증
    if (!name || !description || !rarity) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기존 칭호 확인
    const { data: existingTitle, error: existingTitleError } = await supabaseAdmin
      .from('titles')
      .select('*')
      .eq('id', id)
      .single();

    if (existingTitleError || !existingTitle) {
      return NextResponse.json(
        { error: '칭호를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 칭호 업데이트
    const { data: updatedTitle, error: updateError } = await supabaseAdmin
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

    if (updateError) {
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '칭호가 성공적으로 수정되었습니다.',
      title: updatedTitle
    })

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 칭호 삭제
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

    const { id } = await params

    // 기존 칭호 확인
    const { data: existingTitle, error: existingTitleError } = await supabaseAdmin
      .from('titles')
      .select('*')
      .eq('id', id)
      .single();

    if (existingTitleError || !existingTitle) {
      return NextResponse.json(
        { error: '칭호를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 칭호 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('titles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '칭호가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 