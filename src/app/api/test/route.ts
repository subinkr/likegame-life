import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      message: 'Database connection successful',
      userCount
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
} 