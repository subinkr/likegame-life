-- 채팅 관련 RLS 정책 설정
-- Supabase 대시보드에서 실행하거나 SQL Editor에서 실행

-- chat_messages 테이블에 대한 읽기 정책
CREATE POLICY "Users can read messages in rooms they participate in" ON chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_room_participants
    WHERE chat_room_participants.chat_room_id = chat_messages.chat_room_id
    AND chat_room_participants.user_id = auth.uid()
  )
);

-- chat_messages 테이블에 대한 쓰기 정책
CREATE POLICY "Users can insert messages in rooms they participate in" ON chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_room_participants
    WHERE chat_room_participants.chat_room_id = chat_messages.chat_room_id
    AND chat_room_participants.user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- chat_rooms 테이블에 대한 읽기 정책
CREATE POLICY "Users can read rooms they participate in" ON chat_rooms
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_room_participants
    WHERE chat_room_participants.chat_room_id = chat_rooms.id
    AND chat_room_participants.user_id = auth.uid()
  )
);

-- chat_room_participants 테이블에 대한 읽기 정책
CREATE POLICY "Users can read participants in rooms they participate in" ON chat_room_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_room_participants crp
    WHERE crp.chat_room_id = chat_room_participants.chat_room_id
    AND crp.user_id = auth.uid()
  )
); 