-- RLS 정책 수정 (Realtime 이벤트 테스트용)

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view messages in their chat rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their chat rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
DROP POLICY IF EXISTS "Enable all operations for chat_messages" ON chat_messages;

-- 임시로 모든 작업 허용 (Realtime 테스트용)
CREATE POLICY "Enable all operations for chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);

-- 완료 메시지
SELECT 'RLS policies updated successfully! (Temporary open access for testing)' as status; 