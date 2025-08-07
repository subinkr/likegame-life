-- RLS 정책 수정 (무한 재귀 방지) - 더 간단한 버전

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view messages in their chat rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their chat rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;

-- 가장 간단한 정책 생성 (모든 사용자가 모든 메시지를 볼 수 있음)
CREATE POLICY "Enable all operations for chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);

-- 완료 메시지
SELECT 'RLS policies updated successfully!' as status; 