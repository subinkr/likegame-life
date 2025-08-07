-- RLS 정책 수정 (참고 예제 기반)

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view messages in their chat rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their chat rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
DROP POLICY IF EXISTS "Enable all operations for chat_messages" ON chat_messages;

-- 간단한 정책: 인증된 사용자는 모든 메시지를 볼 수 있음
CREATE POLICY "Enable read access for authenticated users" ON chat_messages
FOR SELECT USING (auth.role() = 'authenticated');

-- 인증된 사용자는 메시지를 삽입할 수 있음
CREATE POLICY "Enable insert access for authenticated users" ON chat_messages
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 자신의 메시지만 수정할 수 있음
CREATE POLICY "Enable update for users based on user_id" ON chat_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 자신의 메시지만 삭제할 수 있음
CREATE POLICY "Enable delete for users based on user_id" ON chat_messages
FOR DELETE USING (auth.uid() = user_id);

-- 완료 메시지
SELECT 'RLS policies updated successfully! (Simple auth-based policies)' as status; 