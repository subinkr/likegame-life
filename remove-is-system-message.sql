-- chat_messages 테이블에서 is_system_message 컬럼 제거
-- system_type이 null이 아니면 시스템 메시지로 판단하므로 is_system_message는 불필요

ALTER TABLE chat_messages DROP COLUMN IF EXISTS is_system_message;

-- 기존 데이터에서 system_type이 있는 메시지들을 확인
-- SELECT COUNT(*) FROM chat_messages WHERE system_type IS NOT NULL;

-- 변경사항 확인
-- SELECT id, content, system_type, created_at FROM chat_messages LIMIT 10;
