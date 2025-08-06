-- Supabase에서 Replication 활성화
-- Supabase 대시보드에서 실행하거나 SQL Editor에서 실행

-- chat_messages 테이블에 대한 Replication 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- chat_rooms 테이블에 대한 Replication 활성화 (선택사항)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;

-- chat_room_participants 테이블에 대한 Replication 활성화 (선택사항)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_participants; 