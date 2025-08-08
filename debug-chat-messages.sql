-- 채팅 메시지 디버깅 쿼리

-- 1. 최근 메시지 10개 확인
SELECT 
  id,
  chat_room_id,
  user_id,
  content,
  system_type,
  created_at,
  CASE 
    WHEN created_at IS NULL THEN 'NULL'
    ELSE created_at::text
  END as created_at_status
FROM chat_messages 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. created_at이 NULL인 메시지 확인
SELECT 
  id,
  chat_room_id,
  user_id,
  content,
  system_type,
  created_at
FROM chat_messages 
WHERE created_at IS NULL
ORDER BY id DESC;

-- 3. 사용자 정보 확인
SELECT 
  id,
  nickname,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. 특정 채팅방의 메시지와 사용자 정보 조인
SELECT 
  cm.id,
  cm.chat_room_id,
  cm.user_id,
  cm.content,
  cm.system_type,
  cm.created_at,
  u.nickname,
  CASE 
    WHEN cm.created_at IS NULL THEN 'NULL'
    ELSE cm.created_at::text
  END as created_at_status
FROM chat_messages cm
LEFT JOIN users u ON cm.user_id = u.id
ORDER BY cm.created_at DESC 
LIMIT 10;
