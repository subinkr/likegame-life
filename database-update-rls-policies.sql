-- RLS 정책 완전 비활성화 (디버깅용)

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view messages in their chat rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their chat rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
DROP POLICY IF EXISTS "Enable all operations for chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON chat_messages;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON chat_messages;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON chat_messages;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON chat_messages;

-- RLS 완전 비활성화 (테스트용)
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- 완료 메시지
SELECT 'RLS completely disabled for testing!' as status; 