import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserFromSupabase } from '@/lib/auth';

// 퀘스트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { data: quests, error } = await supabaseAdmin
      .from('quests')
      .select(`
        *,
        creator:users!creator_id(id, email, nickname),
        accepted_by_user:users!accepted_by_user_id(id, email, nickname)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('퀘스트 조회 에러:', error);
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(quests)

  } catch (error) {
    console.error('퀘스트 조회 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 퀘스트 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromSupabase(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { title, description, location, reward } = await request.json()

    // 필수 필드 검증
    if (!title || !description || !location || !reward) {
      return NextResponse.json(
        { error: '제목, 내용, 위치, 원화 보상은 필수입니다.' },
        { status: 400 }
      )
    }

    // 보상 금액 검증 (최소 1000원)
    const rewardAmount = parseInt(reward)
    if (rewardAmount < 1000) {
      return NextResponse.json(
        { error: '보상 금액은 1,000원 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 퀘스트 생성
    const { data: quest, error: questError } = await supabaseAdmin
      .from('quests')
      .insert({
        creator_id: user.id,
        title,
        description,
        location,
        reward: parseInt(reward),
        status: 'OPEN'
      })
      .select(`
        *,
        creator:users!creator_id(id, email, nickname)
      `)
      .single();

    if (questError) {
      console.error('퀘스트 생성 에러:', questError);
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 퀘스트 생성 후 채팅방 생성
    console.log('채팅방 생성 시작:', {
      name: quest.title,
      type: 'QUEST',
      created_by: user.id,
      quest_id: quest.id
    });

    const { data: chatRoom, error: chatError } = await supabaseAdmin
      .from('chat_rooms')
      .insert({
        name: quest.title,
        type: 'QUEST',
        created_by: user.id,
        quest_id: quest.id
      })
      .select()
      .single();

    if (chatError) {
      console.error('채팅방 생성 에러:', chatError);
      // 채팅방 생성 실패해도 퀘스트는 생성된 상태로 반환
      console.warn('퀘스트는 생성되었지만 채팅방 생성에 실패했습니다.');
    } else {
      console.log('채팅방 생성 성공:', chatRoom);
      
      // 퀘스트 생성자를 채팅방에 추가
      const { error: participantError } = await supabaseAdmin
        .from('chat_room_participants')
        .insert({
          chat_room_id: chatRoom.id,
          user_id: user.id
        });

      if (participantError) {
        console.error('채팅방 참가자 추가 에러:', participantError);
      } else {
        console.log('퀘스트 생성자가 채팅방에 추가됨');
      }
    }

    return NextResponse.json({
      message: '퀘스트가 생성되었습니다.',
      quest,
      chatRoom
    })

  } catch (error) {
    console.error('퀘스트 생성 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 