-- Supabase Replication 활성화
-- Supabase 대시보드 → SQL Editor에서 실행

-- 1. chat_messages 테이블에 대한 Replication 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- 2. chat_rooms 테이블에 대한 Replication 활성화 (선택사항)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;

-- 3. chat_room_participants 테이블에 대한 Replication 활성화 (선택사항)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_participants;

-- 4. 확인 쿼리
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'; 