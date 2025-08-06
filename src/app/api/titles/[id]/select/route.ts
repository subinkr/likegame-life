import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

export async function POST(
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

    const { id: titleId } = await params

    // 칭호 존재 확인
    const { data: title, error: titleError } = await supabaseAdmin
      .from('titles')
      .select('*')
      .eq('id', titleId)
      .single();

    if (titleError || !title) {
      return NextResponse.json(
        { error: '존재하지 않는 칭호입니다.' },
        { status: 404 }
      );
    }

    // 사용자의 뱃지 달성 상태 조회
    const { data: userBadges, error: userBadgesError } = await supabaseAdmin
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', user.id)
      .eq('achieved', true);

    if (userBadgesError) {
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 뱃지 조건 확인
    const requiredBadgeNames = title.required_badges || []
    const hasRequiredBadges = requiredBadgeNames.length > 0 && requiredBadgeNames.every((badgeName: string) => {
      return (userBadges || []).some((ub: any) => ub.badge.name === badgeName)
    })

    if (!hasRequiredBadges) {
      return NextResponse.json(
        { error: '이 칭호를 획득하기 위한 뱃지가 부족합니다.' },
        { status: 400 }
      )
    }

    // 기존 선택된 칭호 모두 해제
    const { error: deselectError } = await supabaseAdmin
      .from('user_titles')
      .update({ selected: false })
      .eq('user_id', user.id)
      .eq('selected', true);

    if (deselectError) {
      // 기존 칭호 해제 에러 무시
    }

    // 기존 사용자 칭호 상태 확인
    const { data: existingUserTitle, error: existingError } = await supabaseAdmin
      .from('user_titles')
      .select('*')
      .eq('user_id', user.id)
      .eq('title_id', titleId)
      .single();

    let userTitle

    if (existingUserTitle && !existingError) {
      // 기존 상태 업데이트
      const { data: updatedUserTitle, error: updateError } = await supabaseAdmin
        .from('user_titles')
        .update({
          selected: true,
          achieved: true,
          achieved_date: existingUserTitle.achieved_date || new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('title_id', titleId)
        .select(`
          *,
          title:titles(*)
        `)
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: '서버 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      userTitle = updatedUserTitle;
    } else {
      // 새로 생성
      const { data: newUserTitle, error: createError } = await supabaseAdmin
        .from('user_titles')
        .insert({
          user_id: user.id,
          title_id: titleId,
          selected: true,
          achieved: true,
          achieved_date: new Date().toISOString()
        })
        .select(`
          *,
          title:titles(*)
        `)
        .single();

      if (createError) {
        return NextResponse.json(
          { error: '서버 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      userTitle = newUserTitle;
    }

    return NextResponse.json({
      message: '칭호를 선택했습니다!',
      userTitle
    })

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 