-- RLS 정책 수정 (Realtime 이벤트 지원)

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view messages in their chat rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their chat rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
DROP POLICY IF EXISTS "Enable all operations for chat_messages" ON chat_messages;

-- 채팅방 참가자만 메시지를 볼 수 있는 정책
CREATE POLICY "Users can view messages in their chat rooms" ON chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_room_participants crp
    WHERE crp.chat_room_id = chat_messages.chat_room_id
    AND crp.user_id = auth.uid()
  )
);

-- 채팅방 참가자만 메시지를 삽입할 수 있는 정책
CREATE POLICY "Users can insert messages in their chat rooms" ON chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_room_participants crp
    WHERE crp.chat_room_id = chat_messages.chat_room_id
    AND crp.user_id = auth.uid()
  )
);

-- 자신의 메시지만 수정할 수 있는 정책
CREATE POLICY "Users can update own messages" ON chat_messages
FOR UPDATE USING (
  user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid()
);

-- 자신의 메시지만 삭제할 수 있는 정책
CREATE POLICY "Users can delete own messages" ON chat_messages
FOR DELETE USING (
  user_id = auth.uid()
);

-- 완료 메시지
SELECT 'RLS policies updated successfully!' as status; 