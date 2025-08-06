import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

// 스킬 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { data: skills, error } = await supabaseAdmin
      .from('skills')
      .select('*')
      .eq('user_id', user.id)
      .order('acquired_date', { ascending: false })

    if (error) {
      console.error('스킬 조회 에러:', error)
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 날짜 필드명을 프론트엔드에서 기대하는 형식으로 변환
    const transformedSkills = skills.map((skill: any) => ({
      ...skill,
      acquiredDate: skill.acquired_date,
      expiryDate: skill.expiry_date,
      parentSkillId: skill.parent_skill_id
    }))

    return NextResponse.json({ skills: transformedSkills })

  } catch (error) {
    console.error('스킬 조회 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 스킬 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { name, description, acquiredDate, expiryDate, parentSkillId } = await request.json()

    // 필수 필드 검증
    if (!name || !description || !acquiredDate) {
      return NextResponse.json(
        { error: '스킬명, 설명, 획득일은 필수입니다.' },
        { status: 400 }
      )
    }

    const { data: skill, error } = await supabaseAdmin
      .from('skills')
      .insert({
        user_id: user.id,
        name,
        description,
        acquired_date: new Date(acquiredDate).toISOString().split('T')[0],
        expiry_date: expiryDate ? new Date(expiryDate).toISOString().split('T')[0] : null,
        parent_skill_id: parentSkillId
      })
      .select('*')
      .single()

    if (error) {
      console.error('스킬 생성 에러:', error)
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 날짜 필드명을 프론트엔드에서 기대하는 형식으로 변환
    const transformedSkill = {
      ...skill,
      acquiredDate: skill.acquired_date,
      expiryDate: skill.expiry_date,
      parentSkillId: skill.parent_skill_id
    }

    return NextResponse.json({
      message: '스킬이 등록되었습니다.',
      skill: transformedSkill
    })

  } catch (error) {
    console.error('스킬 생성 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 