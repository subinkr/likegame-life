import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSupabase } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// 메시지 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 사용자가 해당 채팅방의 참가자인지 확인
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('chat_room_participants')
      .select('*')
      .eq('chat_room_id', id)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: '채팅방에 접근할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // URL 파라미터에서 페이지네이션 정보 가져오기
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const before = searchParams.get('before'); // 특정 메시지 ID 이전의 메시지들

    let query = supabaseAdmin
      .from('chat_messages')
      .select(`
        id,
        chat_room_id,
        user_id,
        content,
        system_type,
        created_at,
        users!inner(nickname)
      `)
      .eq('chat_room_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // before 파라미터가 있으면 해당 메시지 이전의 메시지들을 가져옴
    if (before) {
      const { data: beforeMessage } = await supabaseAdmin
        .from('chat_messages')
        .select('created_at')
        .eq('id', before)
        .single();
      
      if (beforeMessage) {
        query = query.lt('created_at', beforeMessage.created_at);
      }
    } else if (offset > 0) {
      // offset이 있으면 해당 위치부터 가져옴
      query = query.range(offset, offset + limit - 1);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: '메시지를 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    const formattedMessages = (messages || []).map((message: any) => {
      // 안전한 날짜 변환
      let createdAt: string;
      try {
        // Supabase에서 반환되는 날짜 형식 처리
        let dateValue = message.created_at;
        
        // 객체인 경우 ISO 문자열로 변환
        if (typeof dateValue === 'object' && dateValue !== null && dateValue.toISOString) {
          dateValue = dateValue.toISOString();
        }
        
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          console.error('Invalid date detected:', message.created_at);
          createdAt = new Date().toISOString();
        } else {
          createdAt = date.toISOString();
        }
      } catch (error) {
        console.error('Error converting date:', error, message.created_at);
        createdAt = new Date().toISOString();
      }

      return {
        id: message.id,
        content: message.content,
        user: {
          name: Array.isArray(message.users) ? message.users[0]?.nickname || 'Unknown User' : (message.users as any)?.nickname || 'Unknown User'
        },
        createdAt,
        systemType: message.system_type || undefined
      };
    });

    // 응답에 페이지네이션 정보 포함
    const response = {
      messages: formattedMessages,
      hasMore: formattedMessages.length === limit,
      total: formattedMessages.length
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/chat/rooms/[id]/messages:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 메시지 전송
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromSupabase(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: '메시지 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사용자가 해당 채팅방의 참가자인지 확인
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('chat_room_participants')
      .select('*')
      .eq('chat_room_id', id)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: '채팅방에 접근할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 메시지 저장
    const { data: message, error } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        chat_room_id: id,
        user_id: user.id,
        content: content.trim(),
      })
      .select(`
        id,
        chat_room_id,
        user_id,
        content,
        system_type,
        created_at,
        users!inner(nickname)
      `)
      .single();

    if (error) {
      console.error('Error inserting message:', error);
      return NextResponse.json(
        { error: '메시지 전송에 실패했습니다.' },
        { status: 500 }
      );
    }



    const formattedMessage = {
      id: message.id,
      content: message.content,
      user: {
        name: Array.isArray(message.users) ? message.users[0]?.nickname || 'Unknown User' : (message.users as any)?.nickname || 'Unknown User'
      },
      createdAt: (() => {
        try {
          // Supabase에서 반환되는 날짜 형식 처리
          let dateValue = message.created_at;
          
          // 문자열인 경우 그대로 사용, 객체인 경우 ISO 문자열로 변환
          if (typeof dateValue === 'object' && dateValue !== null) {
            // PostgreSQL timestamp 객체인 경우
            if (dateValue.toISOString) {
              dateValue = dateValue.toISOString();
            } else {
              // 다른 객체 형식인 경우
              dateValue = JSON.stringify(dateValue);
            }
          }
          
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) {
            console.error('POST - Invalid date detected:', message.created_at, 'processed as:', dateValue);
            return new Date().toISOString();
          }
          return date.toISOString();
        } catch (error) {
          console.error('Error converting date in POST:', error, message.created_at);
          return new Date().toISOString();
        }
      })(),
      systemType: message.system_type || undefined
    };

    return NextResponse.json(formattedMessage);
  } catch (error) {
    console.error('Unexpected error in POST /api/chat/rooms/[id]/messages:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 