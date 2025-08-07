-- chat_messages 테이블 스키마 수정
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. user_nickname 컬럼이 있는지 확인
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
AND column_name = 'user_nickname';

-- 2. user_nickname 컬럼이 있다면 제거
ALTER TABLE chat_messages DROP COLUMN IF EXISTS user_nickname;

-- 3. is_system_message 컬럼이 없다면 추가
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN DEFAULT FALSE;

-- 4. system_type 컬럼이 없다면 추가
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS system_type TEXT CHECK (system_type IN ('JOIN', 'LEAVE', 'OTHER'));

-- 5. 수정된 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
ORDER BY ordinal_position;

-- 6. 기존 시스템 메시지 업데이트 (필요한 경우)
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

-- 7. 최종 확인
SELECT 
  id,
  chat_room_id,
  user_id,
  content,
  created_at,
  is_system_message,
  system_type
FROM chat_messages 
ORDER BY created_at DESC 
LIMIT 10; 