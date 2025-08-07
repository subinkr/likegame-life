-- 데이터베이스 스키마 확인 SQL
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. chat_messages 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
ORDER BY ordinal_position;

-- 2. chat_messages 테이블의 실제 데이터 샘플 확인
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
LIMIT 5;

-- 3. users 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 4. chat_room_participants 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'chat_room_participants' 
ORDER BY ordinal_position;

-- 5. 최근 에러 로그 확인 (있는 경우)
SELECT * FROM pg_stat_activity 
WHERE state = 'active' 
AND query LIKE '%chat_messages%'
ORDER BY query_start DESC; 