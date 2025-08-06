import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 데이터베이스 연결 테스트
    const { data: userCount, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' });

    if (countError) {
      console.error('Database connection error:', countError);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: countError.message 
      }, { status: 500 });
    }

    // 테이블 존재 여부 확인
    const tables = ['users', 'strength_records', 'stats', 'skills', 'badges', 'user_badges', 'titles', 'user_titles'];
    const tableStatus = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
        
        tableStatus[table] = {
          exists: !error,
          error: error ? error.message : null
        };
      } catch (err) {
        tableStatus[table] = {
          exists: false,
          error: err.message
        };
      }
    }

    return NextResponse.json({
      message: 'Database connection successful',
      userCount,
      tableStatus,
      currentUser: {
        id: user.id,
        email: user.email,
        nickname: user.nickname
      }
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
        
        tableStatus[table] = {
          exists: !error,
          error: error ? error.message : null
        };
      } catch (err) {
        tableStatus[table] = {
          exists: false,
          error: err.message
        };
      }
    }

    return NextResponse.json({
      message: 'Database connection successful',
      userCount,
      tableStatus,
      currentUser: {
        id: user.id,
        email: user.email,
        nickname: user.nickname
      }
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }