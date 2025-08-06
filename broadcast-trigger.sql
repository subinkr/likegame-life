-- Broadcast 트리거를 사용한 실시간 채팅 구현
-- Supabase 대시보드 → SQL Editor에서 실행

-- 1. Broadcast 함수 생성
CREATE OR REPLACE FUNCTION public.broadcast_chat_message()
RETURNS TRIGGER AS $$
BEGIN
  -- 새 메시지가 삽입될 때 채팅방의 모든 참가자에게 브로드캐스트
  PERFORM net.http_post(
    url := 'https://ahjlfxdrohvdkiznfyir.supabase.co/realtime/v1/broadcast',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.header.apikey')
    ),
    body := jsonb_build_object(
      'channel', 'chat_room_' || NEW.chat_room_id,
      'event', 'new_message',
      'payload', jsonb_build_object(
        'id', NEW.id,
        'content', NEW.content,
        'user_nickname', (SELECT nickname FROM users WHERE id = NEW.user_id),
        'created_at', NEW.created_at,
        'chat_room_id', NEW.chat_room_id
      )
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 트리거 생성
DROP TRIGGER IF EXISTS broadcast_chat_message_trigger ON chat_messages;
CREATE TRIGGER broadcast_chat_message_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_chat_message();

-- 3. 확인 쿼리
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'broadcast_chat_message_trigger'; 