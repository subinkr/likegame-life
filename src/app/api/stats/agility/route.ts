import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/server-auth';

// 민첩 기록 목록 조회 (30일간의 누적 기록)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 30일 전 날짜 계산
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const records = await prisma.stat.findMany({
      where: { 
        userId: user.id,
        agility: { gt: 0 },
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        month: true,
        agility: true,
        createdAt: true,
      }
    });

    // 누적 거리 계산
    const totalDistance = records.reduce((sum, record) => sum + record.agility, 0);

    // 개별 기록 목록만 반환 (누적 기록 제외)
    if (records.length > 0) {
      // 개별 기록 목록
      const individualRecords = records.map(record => ({
        id: record.id,
        month: record.month,
        distance: record.agility,
        createdAt: record.createdAt,
        isCumulative: false,
      }));

      return NextResponse.json(individualRecords);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching agility records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 새 민첩 기록 추가
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { distance } = body;

    if (distance === undefined) {
      return NextResponse.json({ error: 'Distance is required' }, { status: 400 });
    }

    const currentDate = new Date();

    // 새로운 기록 생성 (기존 기록을 덮어쓰지 않음)
    const record = await prisma.stat.create({
      data: {
        userId: user.id,
        month: currentDate.toISOString().slice(0, 7), // YYYY-MM 형식
        strength: 0,
        agility: distance,
        wisdom: 0,
      },
    });

    return NextResponse.json({
      id: record.id,
      month: record.month,
      distance: record.agility,
      createdAt: record.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating agility record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 