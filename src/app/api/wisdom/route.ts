import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/server-auth';

// 초서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [wisdomNotes, totalCount] = await Promise.all([
      prisma.wisdomNote.findMany({
        where: { userId: user.id },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.wisdomNote.count({
        where: { userId: user.id },
      })
    ]);

    return NextResponse.json({
      wisdomNotes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
      }
    });
  } catch (error) {
    console.error('Error fetching wisdom notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 새 초서 등록
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookId, quote, impression, date } = body;

    if (!bookId || !quote || !impression) {
      return NextResponse.json({ error: 'Book ID, quote, and impression are required' }, { status: 400 });
    }

    // 책이 존재하는지 확인
    const book = await prisma.book.findFirst({
      where: { 
        id: bookId,
        userId: user.id 
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const wisdomNote = await prisma.wisdomNote.create({
      data: {
        userId: user.id,
        bookId,
        quote,
        impression,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
          }
        }
      }
    });

    return NextResponse.json(wisdomNote, { status: 201 });
  } catch (error) {
    console.error('Error creating wisdom note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 