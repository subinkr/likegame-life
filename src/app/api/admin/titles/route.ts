import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('likegame-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const titles = await prisma.title.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ titles });
  } catch (error) {
    console.error('Error fetching titles:', error);
    return NextResponse.json({ error: '칭호를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('likegame-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, rarity, requiredBadges } = body;

    if (!name || !description) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const title = await prisma.title.create({
      data: {
        name,
        description,
        rarity,
        requiredBadges: requiredBadges || []
      }
    });

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error creating title:', error);
    return NextResponse.json({ error: '칭호 생성에 실패했습니다.' }, { status: 500 });
  }
} 