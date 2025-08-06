import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSupabase } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 사용자 인증
    const user = await getCurrentUserFromSupabase(request);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { chat_room_id, content } = await request.json();

    if (!chat_room_id || !content) {
      return NextResponse.json({ error: '채팅방 ID와 메시지 내용이 필요합니다.' }, { status: 400 });
    }

    // 채팅방 참가 권한 확인
    const { data: roomParticipant, error: participantError } = await supabase
      .from('chat_room_participants')
      .select('*')
      .eq('chat_room_id', chat_room_id)
      .eq('user_id', user.id)
      .single();

    if (participantError || !roomParticipant) {
      return NextResponse.json({ error: '채팅방에 참가할 권한이 없습니다.' }, { status: 403 });
    }

    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, nickname')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('사용자 정보 조회 실패:', userError);
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 메시지 저장
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        chat_room_id,
        user_id: user.id,
        content: content.trim(),
        user_nickname: userData.nickname // Realtime에서 사용할 수 있도록 nickname도 저장
      })
      .select('*')
      .single();

    if (messageError) {
      console.error('메시지 저장 실패:', messageError);
      return NextResponse.json({ error: '메시지 저장에 실패했습니다.' }, { status: 500 });
    }

    // 채팅방 업데이트 시간 갱신
    await supabase
      .from('chat_rooms')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chat_room_id);

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        chat_room_id: message.chat_room_id,
        user_id: message.user_id,
        content: message.content,
        created_at: message.created_at,
        user: {
          id: userData.id,
          nickname: userData.nickname
        }
      }
    });

  } catch (error) {
    console.error('채팅 메시지 전송 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 