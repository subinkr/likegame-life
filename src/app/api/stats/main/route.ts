import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSupabase } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    // 30일 전 날짜 계산
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 민첩성 총 거리 (30일간)
    const { data: agilityData, error: agilityError } = await supabaseAdmin
      .from('agility_records')
      .select('distance')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (agilityError) {
      console.error('Error fetching agility data:', agilityError);
      return NextResponse.json({ error: 'Failed to fetch agility data' }, { status: 500 });
    }

    const totalDistance = agilityData?.reduce((sum, record) => sum + (record.distance || 0), 0) || 0;

    // 지혜 노트 수 (30일간)
    const { data: wisdomData, error: wisdomError } = await supabaseAdmin
      .from('wisdom_notes')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (wisdomError) {
      console.error('Error fetching wisdom data:', wisdomError);
      return NextResponse.json({ error: 'Failed to fetch wisdom data' }, { status: 500 });
    }

    const noteCount = wisdomData?.length || 0;

    // 랭킹 계산 (30일간 기준)
    const { data: agilityRankData, error: agilityRankError } = await supabaseAdmin
      .from('agility_records')
      .select('user_id, distance')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (agilityRankError) {
      console.error('Error fetching agility rank data:', agilityRankError);
      return NextResponse.json({ error: 'Failed to fetch rank data' }, { status: 500 });
    }

    // 사용자별 총 거리 계산
    const userDistances = new Map<string, number>();
    agilityRankData?.forEach(record => {
      const current = userDistances.get(record.user_id) || 0;
      userDistances.set(record.user_id, current + (record.distance || 0));
    });

    // 거리 기준 랭킹 계산
    const sortedUsers = Array.from(userDistances.entries())
      .sort(([, a], [, b]) => b - a);

    const userRank = sortedUsers.findIndex(([userId]) => userId === user.id) + 1;

    // 지혜 랭킹 계산
    const { data: wisdomRankData, error: wisdomRankError } = await supabaseAdmin
      .from('wisdom_notes')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (wisdomRankError) {
      console.error('Error fetching wisdom rank data:', wisdomRankError);
      return NextResponse.json({ error: 'Failed to fetch wisdom rank data' }, { status: 500 });
    }

    // 사용자별 노트 수 계산
    const userNoteCounts = new Map<string, number>();
    wisdomRankData?.forEach(record => {
      const current = userNoteCounts.get(record.user_id) || 0;
      userNoteCounts.set(record.user_id, current + 1);
    });

    // 노트 수 기준 랭킹 계산
    const sortedWisdomUsers = Array.from(userNoteCounts.entries())
      .sort(([, a], [, b]) => b - a);

    const wisdomRank = sortedWisdomUsers.findIndex(([userId]) => userId === user.id) + 1;

    return NextResponse.json({
      totalDistance,
      noteCount,
      agilityRank: userRank,
      wisdomRank: wisdomRank,
      totalUsers: Math.max(sortedUsers.length, sortedWisdomUsers.length)
    });
  } catch (error) {
    console.error('Stats main API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
