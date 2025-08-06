import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUserFromSupabase } from '@/lib/auth'

// 뱃지 수정
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
    const { name, description, category, rarity, requirement, icon } = await request.json()

    // 필수 필드 검증
    if (!name || !description || !category || !rarity || !requirement || !icon) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기존 뱃지 확인
    const { data: existingBadge, error: findError } = await supabaseAdmin
      .from('badges')
      .select('*')
      .eq('id', id)
      .single()

    if (findError || !existingBadge) {
      return NextResponse.json(
        { error: '뱃지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 뱃지 업데이트
    const { data: updatedBadge, error: updateError } = await supabaseAdmin
      .from('badges')
      .update({
        name,
        description,
        rarity,
        icon
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('뱃지 업데이트 에러:', updateError)
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '뱃지가 성공적으로 수정되었습니다.',
      badge: updatedBadge
    })

  } catch (error) {
    console.error('뱃지 수정 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 뱃지 삭제
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

    // 기존 뱃지 확인
    const { data: existingBadge, error: findError } = await supabaseAdmin
      .from('badges')
      .select('*')
      .eq('id', id)
      .single()

    if (findError || !existingBadge) {
      return NextResponse.json(
        { error: '뱃지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 뱃지 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('badges')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('뱃지 삭제 에러:', deleteError)
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '뱃지가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('뱃지 삭제 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 뱃지 토글 (달성/미달성)
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
        { error: '뱃지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 사용자의 뱃지 상태 확인
    const { data: existingUserBadge, error: userBadgeError } = await supabaseAdmin
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id)
      .eq('badge_id', badgeId)
      .single()

    let updatedUserBadge

    if (existingUserBadge) {
      // 이미 존재하면 토글
      const { data: updatedBadge, error: updateError } = await supabaseAdmin
        .from('user_badges')
        .update({
          achieved: !existingUserBadge.achieved,
          achieved_date: !existingUserBadge.achieved ? new Date().toISOString() : null
        })
        .eq('user_id', user.id)
        .eq('badge_id', badgeId)
        .select()
        .single()

      if (updateError) {
        console.error('뱃지 업데이트 에러:', updateError)
        return NextResponse.json(
          { error: '서버 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      updatedUserBadge = updatedBadge
    } else {
      // 새로 생성
      const { data: newUserBadge, error: createError } = await supabaseAdmin
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_id: badgeId,
          achieved: true,
          achieved_date: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('뱃지 생성 에러:', createError)
        return NextResponse.json(
          { error: '서버 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      updatedUserBadge = newUserBadge
    }

    // 뱃지 상태 변경 후 관련 칭호 자동 활성화/비활성화
    let updatedTitles = []
    
    if (updatedUserBadge.achieved) {
      // 뱃지가 활성화된 경우, 이 뱃지를 필요로 하는 칭호들을 확인
      const { data: titles, error: titlesError } = await supabaseAdmin
        .from('titles')
        .select('*')
        .contains('required_badges', [badge.name])

      if (!titlesError && titles) {
        for (const title of titles) {
          // 해당 칭호의 모든 필요 뱃지가 달성되었는지 확인
          const { data: userBadges, error: userBadgesError } = await supabaseAdmin
            .from('user_badges')
            .select(`
              *,
              badge:badges(*)
            `)
            .eq('user_id', user.id)
            .eq('achieved', true)

          if (!userBadgesError && userBadges) {
            const requiredBadgeNames = title.required_badges || []
            const hasAllRequiredBadges = requiredBadgeNames.length > 0 && 
              requiredBadgeNames.every((badgeName: string) => {
                return userBadges.some((ub: any) => ub.badge.name === badgeName)
              })

            if (hasAllRequiredBadges) {
              // 칭호 활성화
              const { data: existingUserTitle } = await supabaseAdmin
                .from('user_titles')
                .select('*')
                .eq('user_id', user.id)
                .eq('title_id', title.id)
                .single()

              let userTitle
              if (existingUserTitle) {
                // 기존 칭호 업데이트
                const { data: updatedUserTitle } = await supabaseAdmin
                  .from('user_titles')
                  .update({
                    achieved: true,
                    achieved_date: existingUserTitle.achieved_date || new Date().toISOString()
                  })
                  .eq('user_id', user.id)
                  .eq('title_id', title.id)
                  .select()
                  .single()
                userTitle = updatedUserTitle
              } else {
                // 새 칭호 생성
                const { data: newUserTitle } = await supabaseAdmin
                  .from('user_titles')
                  .insert({
                    user_id: user.id,
                    title_id: title.id,
                    achieved: true,
                    achieved_date: new Date().toISOString(),
                    selected: false
                  })
                  .select()
                  .single()
                userTitle = newUserTitle
              }
              
              if (userTitle) {
                updatedTitles.push({
                  id: title.id,
                  name: title.name,
                  achieved: true,
                  achieved_date: userTitle.achieved_date
                })
              }
            }
          }
        }
      }
    } else {
      // 뱃지가 비활성화된 경우, 이 뱃지를 필요로 하는 칭호들을 비활성화
      const { data: titles, error: titlesError } = await supabaseAdmin
        .from('titles')
        .select('*')
        .contains('required_badges', [badge.name])

      if (!titlesError && titles) {
        for (const title of titles) {
          // 해당 칭호의 모든 필요 뱃지가 달성되었는지 확인
          const { data: userBadges, error: userBadgesError } = await supabaseAdmin
            .from('user_badges')
            .select(`
              *,
              badge:badges(*)
            `)
            .eq('user_id', user.id)
            .eq('achieved', true)

          if (!userBadgesError && userBadges) {
            const requiredBadgeNames = title.required_badges || []
            const hasAllRequiredBadges = requiredBadgeNames.length > 0 && 
              requiredBadgeNames.every((badgeName: string) => {
                return userBadges.some((ub: any) => ub.badge.name === badgeName)
              })

            if (!hasAllRequiredBadges) {
              // 칭호 비활성화 및 선택 해제
              await supabaseAdmin
                .from('user_titles')
                .update({
                  achieved: false,
                  selected: false,
                  achieved_date: null
                })
                .eq('user_id', user.id)
                .eq('title_id', title.id)
              
              updatedTitles.push({
                id: title.id,
                name: title.name,
                achieved: false,
                achieved_date: null
              })
            }
          }
        }
      }
    }

    return NextResponse.json({
      message: updatedUserBadge.achieved ? '뱃지를 달성했습니다!' : '뱃지 달성을 취소했습니다.',
      userBadge: updatedUserBadge,
      updatedTitles: updatedTitles
    })

  } catch (error) {
    console.error('뱃지 토글 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 