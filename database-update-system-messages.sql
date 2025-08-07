-- 시스템 메시지 개선을 위한 데이터베이스 수정 SQL

-- 1. chat_messages 테이블에서 user_nickname 컬럼 제거
ALTER TABLE chat_messages DROP COLUMN IF EXISTS user_nickname;

-- 2. chat_messages 테이블에 시스템 메시지 필드 추가 (이미 있다면 무시)
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN DEFAULT FALSE;

ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS system_type TEXT CHECK (system_type IN ('JOIN', 'LEAVE', 'OTHER'));

-- 3. 기존 시스템 메시지 업데이트 (SYSTEM_JOIN, SYSTEM_LEAVE 텍스트를 가진 메시지들)
UPDATE chat_messages 
SET 
  is_system_message = TRUE,
  system_type = CASE 
    WHEN content = 'SYSTEM_JOIN' THEN 'JOIN'
    WHEN content = 'SYSTEM_LEAVE' THEN 'LEAVE'
    ELSE 'OTHER'
  END,
  content = CASE 
    WHEN content = 'SYSTEM_JOIN' THEN (SELECT nickname FROM users WHERE id = chat_messages.user_id) || '님이 입장했습니다'
    WHEN content = 'SYSTEM_LEAVE' THEN (SELECT nickname FROM users WHERE id = chat_messages.user_id) || '님이 퇴장했습니다'
    ELSE content
  END
WHERE content IN ('SYSTEM_JOIN', 'SYSTEM_LEAVE');

-- 4. 시스템 메시지 생성 함수 업데이트
CREATE OR REPLACE FUNCTION create_system_message()
RETURNS TRIGGER AS $$
BEGIN
  -- 사용자가 채팅방에 참가할 때 시스템 메시지 생성
  IF TG_OP = 'INSERT' THEN
    INSERT INTO chat_messages (chat_room_id, user_id, content, is_system_message, system_type, created_at)
    VALUES (
      NEW.chat_room_id,
      NEW.user_id,
      (SELECT nickname FROM users WHERE id = NEW.user_id) || '님이 입장했습니다',
      TRUE,
      'JOIN',
      NOW()
    );
  END IF;
  
  -- 사용자가 채팅방에서 나갈 때 시스템 메시지 생성
  IF TG_OP = 'DELETE' THEN
    INSERT INTO chat_messages (chat_room_id, user_id, content, is_system_message, system_type, created_at)
    VALUES (
      OLD.chat_room_id,
      OLD.user_id,
      (SELECT nickname FROM users WHERE id = OLD.user_id) || '님이 퇴장했습니다',
      TRUE,
      'LEAVE',
      NOW()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. 브로드캐스트 함수 업데이트
CREATE OR REPLACE FUNCTION public.broadcast_chat_message()
RETURNS TRIGGER AS $$
BEGIN
  -- 새 메시지가 삽입될 때 채팅방의 모든 참가자에게 브로드캐스트
  PERFORM net.http_post(
    url := 'https://ahjlfxdrohvdkiznfyir.supabase.co/realtime/v1/broadcast',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.header.apikey')
    ),
    body := jsonb_build_object(
      'channel', 'chat_room_' || NEW.chat_room_id,
      'event', 'new_message',
      'payload', jsonb_build_object(
        'id', NEW.id,
        'content', NEW.content,
        'user_id', NEW.user_id,
        'created_at', NEW.created_at,
        'chat_room_id', NEW.chat_room_id,
        'is_system_message', NEW.is_system_message,
        'system_type', NEW.system_type
      )
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 인덱스 추가 (선택사항 - 성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_chat_messages_system ON chat_messages(is_system_message, system_type);

-- 7. 확인용 쿼리
SELECT 
  id,
  content,
  user_id,
  is_system_message,
  system_type,
  created_at
FROM chat_messages 
WHERE is_system_message = TRUE 
ORDER BY created_at DESC 
LIMIT 10; 