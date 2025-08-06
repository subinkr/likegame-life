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

    const { id: badgeId } = await params

    // 뱃지 존재 확인
    const { data: badge, error: badgeError } = await supabaseAdmin
      .from('badges')
      .select('*')
      .eq('id', badgeId)
      .single()

    if (badgeError || !badge) {
      return NextResponse.json(
        { error: '존재하지 않는 뱃지입니다.' },
        { status: 404 }
      )
    }

    // 기존 사용자 뱃지 상태 확인
    const { data: existingUserBadge, error: userBadgeError } = await supabaseAdmin
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id)
      .eq('badge_id', badgeId)
      .single()

    let userBadge

    if (existingUserBadge) {
      // 기존 상태 토글
      const { data: updatedUserBadge, error: updateError } = await supabaseAdmin
        .from('user_badges')
        .update({
          achieved: !existingUserBadge.achieved,
          achieved_date: !existingUserBadge.achieved ? new Date().toISOString() : null
        })
        .eq('user_id', user.id)
        .eq('badge_id', badgeId)
        .select(`
          *,
          badges(*)
        `)
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: '서버 오류가 발생했습니다.' },
          { status: 500 }
        )
      }
      userBadge = updatedUserBadge
    } else {
      // 새로 생성 (달성 상태로)
      const { data: newUserBadge, error: createError } = await supabaseAdmin
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_id: badgeId,
          achieved: true,
          achieved_date: new Date().toISOString()
        })
        .select(`
          *,
          badges(*)
        `)
        .single()

      if (createError) {
        return NextResponse.json(
          { error: '서버 오류가 발생했습니다.' },
          { status: 500 }
        )
      }
      userBadge = newUserBadge
    }

    // 뱃지 상태 변경 후 관련 칭호 상태 업데이트
    const { data: userBadges, error: userBadgesError } = await supabaseAdmin
      .from('user_badges')
      .select(`
        *,
        badges(*)
      `)
      .eq('user_id', user.id)
      .eq('achieved', true)

    if (userBadgesError) {
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const badgeCount = (userBadges || []).length

    // 모든 칭호들의 상태 재계산
    const { data: allTitles, error: titlesError } = await supabaseAdmin
      .from('titles')
      .select('*')

    if (titlesError) {
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    for (const title of (allTitles || [])) {
      // 필요한 뱃지 확인
      const requiredBadgeNames = title.required_badges || []
      const userBadgeNames = (userBadges || []).map((ub: any) => ub.badges.name)
      const shouldHaveTitle = requiredBadgeNames.length > 0 && requiredBadgeNames.every((badgeName: any) => userBadgeNames.includes(badgeName))

      // 사용자의 칭호 상태 확인
      const { data: existingUserTitle, error: userTitleError } = await supabaseAdmin
        .from('user_titles')
        .select('*')
        .eq('user_id', user.id)
        .eq('title_id', title.id)
        .single()

      if (shouldHaveTitle && !existingUserTitle) {
        // 칭호 획득
        const { error: insertError } = await supabaseAdmin
          .from('user_titles')
          .insert({
            user_id: user.id,
            title_id: title.id,
            achieved: true,
            achieved_date: new Date().toISOString()
          })

        if (insertError) {
          // 칭호 생성 에러 무시
        }
      } else if (!shouldHaveTitle && existingUserTitle) {
        // 뱃지 조건을 만족하지 않으면 칭호 비활성화 및 선택 해제
        const { error: updateError } = await supabaseAdmin
          .from('user_titles')
          .update({
            achieved: false,
            selected: false,
            achieved_date: null
          })
          .eq('user_id', user.id)
          .eq('title_id', title.id)

        if (updateError) {
          // 칭호 업데이트 에러 무시
        }
      }
    }

    return NextResponse.json({
      message: userBadge.achieved ? '뱃지를 획득했습니다!' : '뱃지 획득을 취소했습니다.',
      userBadge
    })

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 