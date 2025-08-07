-- RLS 정책 수정 (무한 재귀 방지)

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view messages in their chat rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their chat rooms" ON chat_messages;

-- 새로운 간단한 정책 생성
CREATE POLICY "Users can view messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert messages" ON chat_messages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own messages" ON chat_messages FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own messages" ON chat_messages FOR DELETE USING (user_id = auth.uid());

-- 완료 메시지
SELECT 'RLS policies updated successfully!' as status; 