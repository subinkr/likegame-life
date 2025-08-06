import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSupabase } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// SSE 스트림을 위한 메시지 저장소
const messageStreams = new Map<string, Set<ReadableStreamDefaultController>>();

// 메시지 브로드캐스트 함수
export function broadcastMessage(roomId: string, message: any) {
  const controllers = messageStreams.get(roomId);
  if (controllers) {
    const data = `data: ${JSON.stringify(message)}\n\n`;
    controllers.forEach(controller => {
      try {
        controller.enqueue(new TextEncoder().encode(data));
      } catch (error) {
        console.error('SSE 전송 실패:', error);
      }
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // URL 파라미터에서 토큰 추출
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    // 토큰으로 사용자 인증
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
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

    // SSE 스트림 생성
    const stream = new ReadableStream({
      start(controller) {
        // 연결 유지 메시지
        controller.enqueue(new TextEncoder().encode('data: {"type": "connected"}\n\n'));

        // 스트림에 컨트롤러 추가
        if (!messageStreams.has(id)) {
          messageStreams.set(id, new Set());
        }
        messageStreams.get(id)!.add(controller);

        // 연결 해제 시 정리
        request.signal.addEventListener('abort', () => {
          const controllers = messageStreams.get(id);
          if (controllers) {
            controllers.delete(controller);
            if (controllers.size === 0) {
              messageStreams.delete(id);
            }
          }
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('SSE 스트림 생성 실패:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 