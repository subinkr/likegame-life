import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/server-auth';

// 힘 기록 목록 조회 (30일간의 최고 기록)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 30일 전 날짜 계산
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const records = await prisma.strengthRecord.findMany({
      where: { 
        userId: user.id,
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { createdAt: 'desc' }, // 최신 기록 순으로 정렬
    });

    // 모든 기록 목록 반환 (시간 순서, 최고 기록 표시)
    if (records.length > 0) {
      // 최고 기록 찾기
      const bestRecord = records.reduce((best, current) => 
        current.total > best.total ? current : best
      );
      
      const allRecords = records.map((record) => {
        return {
          id: record.id,
          month: record.createdAt.toISOString().slice(0, 7), // YYYY-MM 형식
          bench: record.bench,
          squat: record.squat,
          deadlift: record.deadlift,
          total: record.total,
          createdAt: record.createdAt,
          isBestRecord: record.id === bestRecord.id, // 최고 기록인지 확인
        };
      });

      return NextResponse.json({ records: allRecords });
    }

    return NextResponse.json({ records: [] });
  } catch (error) {
    console.error('Error fetching strength records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 새 힘 기록 추가
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bench, squat, deadlift } = body;

    if (bench === undefined || squat === undefined || deadlift === undefined) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const total = bench + squat + deadlift;

    // 새로운 기록 생성
    const record = await prisma.strengthRecord.create({
      data: {
        userId: user.id,
        bench,
        squat,
        deadlift,
        total,
      },
    });

    return NextResponse.json({
      id: record.id,
      month: record.createdAt.toISOString().slice(0, 7), // YYYY-MM 형식
      bench: record.bench,
      squat: record.squat,
      deadlift: record.deadlift,
      total: record.total,
      createdAt: record.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating strength record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 