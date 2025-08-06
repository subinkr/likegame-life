-- Supabase Realtime을 위한 데이터베이스 스키마 업데이트

-- 1. chat_messages 테이블에 user_nickname 컬럼 추가
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS user_nickname TEXT;

-- 2. 기존 메시지들의 user_nickname 업데이트
UPDATE chat_messages 
SET user_nickname = (
  SELECT nickname 
  FROM users 
  WHERE users.id = chat_messages.user_id
)
WHERE user_nickname IS NULL;

-- 3. Realtime 기능 활성화
-- Supabase Dashboard에서 다음 설정을 활성화하세요:
-- 1. Database > Replication > Enable realtime for chat_messages table
-- 2. Database > Replication > Enable realtime for chat_rooms table

-- 4. RLS (Row Level Security) 정책 업데이트
-- 채팅방 참가자만 메시지를 볼 수 있도록 정책 설정

-- chat_messages 테이블에 대한 RLS 정책
DROP POLICY IF EXISTS "Users can view messages in their chat rooms" ON chat_messages;
CREATE POLICY "Users can view messages in their chat rooms" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_room_participants 
      WHERE chat_room_participants.chat_room_id = chat_messages.chat_room_id 
      AND chat_room_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their chat rooms" ON chat_messages;
CREATE POLICY "Users can insert messages in their chat rooms" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_room_participants 
      WHERE chat_room_participants.chat_room_id = chat_messages.chat_room_id 
      AND chat_room_participants.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- 5. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_room_participants_room_user ON chat_room_participants(chat_room_id, user_id);

-- 6. 함수 생성 (시스템 메시지 자동 생성)
CREATE OR REPLACE FUNCTION create_system_message()
RETURNS TRIGGER AS $$
BEGIN
  -- 사용자가 채팅방에 참가할 때 시스템 메시지 생성
  IF TG_OP = 'INSERT' THEN
    INSERT INTO chat_messages (chat_room_id, user_id, content, user_nickname, created_at)
    VALUES (
      NEW.chat_room_id,
      NEW.user_id,
      'SYSTEM_JOIN',
      (SELECT nickname FROM users WHERE id = NEW.user_id),
      NOW()
    );
  END IF;
  
  -- 사용자가 채팅방에서 나갈 때 시스템 메시지 생성
  IF TG_OP = 'DELETE' THEN
    INSERT INTO chat_messages (chat_room_id, user_id, content, user_nickname, created_at)
    VALUES (
      OLD.chat_room_id,
      OLD.user_id,
      'SYSTEM_LEAVE',
      (SELECT nickname FROM users WHERE id = OLD.user_id),
      NOW()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 7. 트리거 생성
DROP TRIGGER IF EXISTS trigger_create_system_message ON chat_room_participants;
CREATE TRIGGER trigger_create_system_message
  AFTER INSERT OR DELETE ON chat_room_participants
  FOR EACH ROW
  EXECUTE FUNCTION create_system_message();

-- 8. 뷰 생성 (채팅방 목록 조회용)
CREATE OR REPLACE VIEW chat_rooms_with_participants AS
SELECT 
  cr.id,
  cr.name,
  cr.type,
  cr.created_at,
  cr.updated_at,
  COUNT(crp.user_id) as participant_count,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'id', u.id,
      'nickname', u.nickname
    )
  ) FILTER (WHERE u.id IS NOT NULL) as participants
FROM chat_rooms cr
LEFT JOIN chat_room_participants crp ON cr.id = crp.chat_room_id
LEFT JOIN users u ON crp.user_id = u.id
GROUP BY cr.id, cr.name, cr.type, cr.created_at, cr.updated_at;

-- 9. 함수 생성 (채팅방 참가자 목록 조회)
CREATE OR REPLACE FUNCTION get_chat_room_participants(room_id UUID)
RETURNS TABLE (
  user_id UUID,
  nickname TEXT,
  joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    crp.user_id,
    u.nickname,
    crp.created_at as joined_at
  FROM chat_room_participants crp
  JOIN users u ON crp.user_id = u.id
  WHERE crp.chat_room_id = room_id
  ORDER BY crp.created_at;
END;
$$ LANGUAGE plpgsql; 