import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

// 뱃지 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 모든 뱃지 조회
    const { data: badges, error: badgesError } = await supabaseAdmin
      .from('badges')
      .select('*')
      .order('name', { ascending: true })

    if (badgesError) {
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 사용자의 뱃지 달성 상태 조회
    const { data: userBadges, error: userBadgesError } = await supabaseAdmin
      .from('user_badges')
      .select(`
        *,
        badges(*)
      `)
      .eq('user_id', user.id)

    if (userBadgesError) {
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 뱃지와 사용자 달성 상태 결합
    const badgesWithStatus = (badges || []).map(badge => {
      const userBadge = (userBadges || []).find(ub => ub.badge_id === badge.id)
      return {
        ...badge,
        achieved: userBadge?.achieved || false,
        achievedDate: userBadge?.achieved_date || null
      }
    })

    return NextResponse.json({ badges: badgesWithStatus })

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 