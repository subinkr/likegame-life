import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSupabase } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 모든 칭호 조회
    const { data: titles, error } = await supabaseAdmin
      .from('titles')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching titles:', error);
      return NextResponse.json({ error: 'Failed to fetch titles' }, { status: 500 });
    }

    // 사용자의 칭호 달성 상태 조회
    const { data: userTitles, error: userTitlesError } = await supabaseAdmin
      .from('user_titles')
      .select(`
        *,
        title:titles(*)
      `)
      .eq('user_id', user.id);

    if (userTitlesError) {
      console.error('사용자 칭호 조회 에러:', userTitlesError);
      return NextResponse.json({ error: 'Failed to fetch user titles' }, { status: 500 });
    }

    // 사용자의 뱃지 달성 상태 조회 (칭호 조건 확인용)
    const { data: userBadges, error: userBadgesError } = await supabaseAdmin
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', user.id)
      .eq('achieved', true);

    if (userBadgesError) {
      console.error('사용자 뱃지 조회 에러:', userBadgesError);
      return NextResponse.json({ error: 'Failed to fetch user badges' }, { status: 500 });
    }

    // 칭호와 사용자 달성 상태 결합
    const titlesWithStatus = (titles || []).map(title => {
      const userTitle = (userTitles || []).find(ut => ut.title_id === title.id);
      
      // 뱃지 조건 확인
      const requiredBadgeNames = title.required_badges || [];
      const hasRequiredBadges = requiredBadgeNames.length > 0 && 
        requiredBadgeNames.every((badgeName: string) => {
          return (userBadges || []).some((ub: any) => ub.badge.name === badgeName);
        });
      
      const isAchieved = requiredBadgeNames.length === 0 || hasRequiredBadges;
      
      return {
        ...title,
        achieved: userTitle?.achieved || isAchieved,
        selected: userTitle?.selected || false,
        achievedDate: userTitle?.achieved_date || (isAchieved ? new Date().toISOString() : null)
      };
    });

    return NextResponse.json({ titles: titlesWithStatus });
  } catch (error) {
    console.error('Titles API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, requirement_type, requirement_value } = body;

    const { data, error } = await supabaseAdmin
      .from('titles')
      .insert({
        name,
        description,
        requirement_type,
        requirement_value
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating title:', error);
      return NextResponse.json({ error: 'Failed to create title' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Titles API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
