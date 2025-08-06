import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: any = {
      user: { id: user.id, email: user.email },
      tables: {}
    };

    // 각 테이블 존재 여부 확인
    const tables = [
      'users',
      'strength_records', 
      'agility_records',
      'wisdom_notes',
      'skills',
      'badges',
      'user_badges',
      'titles',
      'user_titles',
      'quests',
      'parties',
      'party_members',
      'books',
      'chat_rooms',
      'chat_room_participants',
      'chat_messages'
    ];

    for (const tableName of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1);
        
        results.tables[tableName] = {
          exists: !error,
          error: error?.message || null,
          count: data?.length || 0
        };
      } catch (err) {
        results.tables[tableName] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          count: 0
        };
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: any = {
      user: { id: user.id, email: user.email },
      tables: {}
    };

    // 각 테이블 존재 여부 확인
    const tables = [
      'users',
      'strength_records', 
      'agility_records',
      'wisdom_notes',
      'skills',
      'badges',
      'user_badges',
      'titles',
      'user_titles',
      'quests',
      'parties',
      'party_members',
      'books',
      'chat_rooms',
      'chat_room_participants',
      'chat_messages'
    ];

    for (const tableName of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1);
        
        results.tables[tableName] = {
          exists: !error,
          error: error?.message || null,
          count: data?.length || 0
        };
      } catch (err) {
        results.tables[tableName] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          count: 0
        };
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
 