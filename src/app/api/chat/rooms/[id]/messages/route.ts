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

    // 메시지 목록 조회
    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select(`
        *,
        user:users(nickname)
      `)
      .eq('chat_room_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: '메시지를 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    const formattedMessages = (messages || []).map((message: any) => ({
      id: message.id,
      content: message.content,
      user_nickname: message.user_nickname || message.user?.nickname || message.user_id,
      created_at: message.created_at,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
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
    console.log('POST API route called for room:', await params);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    const user = await getCurrentUserFromSupabase(request);
    console.log('User from auth:', user);
    
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

    // 사용자 닉네임 가져오기
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('nickname')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: '사용자 정보를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 메시지 저장 (user_nickname 필드 포함)
    const { data: message, error } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        chat_room_id: id,
        user_id: user.id,
        user_nickname: userData.nickname, // 닉네임 저장
        content: content.trim(),
      })
      .select(`
        *,
        user:users(nickname)
      `)
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        { error: '메시지 전송에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log('Message saved to database:', message);

    const formattedMessage = {
      id: message.id,
      content: message.content,
      user_nickname: message.user_nickname || message.user?.nickname || message.user_id,
      created_at: message.created_at,
    };

    console.log('Message saved successfully:', formattedMessage);

    return NextResponse.json(formattedMessage);
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 