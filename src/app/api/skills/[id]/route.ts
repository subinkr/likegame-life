import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

// 스킬 수정
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

    const { id: skillId } = await params
    const { name, description, acquiredDate, expiryDate, parentSkillId } = await request.json()

    // 스킬 존재 확인 및 소유권 확인
    const { data: existingSkill, error: existingSkillError } = await supabaseAdmin
      .from('skills')
      .select('*')
      .eq('id', skillId)
      .eq('user_id', user.id)
      .single();

    if (existingSkillError || !existingSkill) {
      return NextResponse.json(
        { error: '존재하지 않는 스킬입니다.' },
        { status: 404 }
      );
    }

    // 필수 필드 검증
    if (!name || !description || !acquiredDate) {
      return NextResponse.json(
        { error: '스킬명, 설명, 획득일은 필수입니다.' },
        { status: 400 }
      );
    }

    const { data: skill, error: skillUpdateError } = await supabaseAdmin
      .from('skills')
      .update({
        name,
        description,
        acquired_date: new Date(acquiredDate).toISOString().split('T')[0],
        expiry_date: expiryDate ? new Date(expiryDate).toISOString().split('T')[0] : null,
        parent_skill_id: parentSkillId
      })
      .eq('id', skillId)
      .select(`
        *,
        parent_skill:skills!parent_skill_id(id, name, description)
      `)
      .single();

    if (skillUpdateError) {
      console.error('스킬 수정 에러:', skillUpdateError);
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 날짜 필드명을 프론트엔드에서 기대하는 형식으로 변환
    const transformedSkill = {
      ...skill,
      acquiredDate: skill.acquired_date,
      expiryDate: skill.expiry_date,
      parentSkillId: skill.parent_skill_id
    }

    return NextResponse.json({
      message: '스킬이 수정되었습니다.',
      skill: transformedSkill
    })

  } catch (error) {
    console.error('스킬 수정 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 스킬 삭제
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

    const { id: skillId } = await params

    // 스킬 존재 확인 및 소유권 확인
    const { data: existingSkill, error: existingSkillError } = await supabaseAdmin
      .from('skills')
      .select('*')
      .eq('id', skillId)
      .eq('user_id', user.id)
      .single();

    if (existingSkillError || !existingSkill) {
      return NextResponse.json(
        { error: '존재하지 않는 스킬입니다.' },
        { status: 404 }
      );
    }

    // 스킬 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('skills')
      .delete()
      .eq('id', skillId);

    if (deleteError) {
      console.error('스킬 삭제 에러:', deleteError);
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '스킬이 삭제되었습니다.'
    })

  } catch (error) {
    console.error('스킬 삭제 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 