-- LikeGame.life 데이터베이스 생성

-- 1. 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT UNIQUE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 힘 기록 테이블
CREATE TABLE strength_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bench INTEGER NOT NULL DEFAULT 0,
  squat INTEGER NOT NULL DEFAULT 0,
  deadlift INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 민첩 기록 테이블 (30일 누적 기록용)
CREATE TABLE agility_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  distance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 스킬 테이블
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  acquired_date DATE NOT NULL,
  expiry_date DATE,
  parent_skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 스킬 테이블에 순환 참조 방지 제약조건 추가
ALTER TABLE skills ADD CONSTRAINT skills_parent_skill_check 
  CHECK (parent_skill_id != id);

-- 5. 뱃지 테이블
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  rarity TEXT NOT NULL DEFAULT 'common',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 사용자 뱃지 테이블
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  achieved BOOLEAN NOT NULL DEFAULT false,
  achieved_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 7. 칭호 테이블
CREATE TABLE titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  rarity TEXT NOT NULL DEFAULT 'common',
  required_badges TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 사용자 칭호 테이블
CREATE TABLE user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  achieved BOOLEAN NOT NULL DEFAULT false,
  selected BOOLEAN NOT NULL DEFAULT false,
  achieved_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, title_id)
);

-- 9. 퀘스트 테이블
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  reward INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  accepted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 파티 테이블
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  max_members INTEGER NOT NULL DEFAULT 4,
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 파티 멤버 테이블
CREATE TABLE party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(party_id, user_id)
);

-- 12. 지혜 노트 테이블
CREATE TABLE wisdom_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  quote TEXT NOT NULL,
  impression TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. 책 테이블
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  status TEXT NOT NULL DEFAULT 'reading',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. 채팅방 테이블
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'quest',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. 채팅방 참가자 테이블
CREATE TABLE chat_room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_room_id, user_id)
);

-- 16. 채팅 메시지 테이블
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. 인덱스 생성
CREATE INDEX idx_strength_records_user_id ON strength_records(user_id);
CREATE INDEX idx_strength_records_created_at ON strength_records(created_at);
CREATE INDEX idx_agility_records_user_id ON agility_records(user_id);
CREATE INDEX idx_agility_records_created_at ON agility_records(created_at);
CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_skills_parent_skill_id ON skills(parent_skill_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_titles_user_id ON user_titles(user_id);
CREATE INDEX idx_quests_creator_id ON quests(creator_id);
CREATE INDEX idx_party_members_party_id ON party_members(party_id);
CREATE INDEX idx_wisdom_notes_user_id ON wisdom_notes(user_id);
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(chat_room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- 18. RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE strength_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE agility_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE wisdom_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 19. 기본 RLS 정책
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own strength records" ON strength_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own strength records" ON strength_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own strength records" ON strength_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own strength records" ON strength_records FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own agility records" ON agility_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own agility records" ON agility_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agility records" ON agility_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agility records" ON agility_records FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own skills" ON skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skills" ON skills FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own badges" ON user_badges FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own titles" ON user_titles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own titles" ON user_titles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own titles" ON user_titles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view quests" ON quests FOR SELECT USING (true);
CREATE POLICY "Users can insert own quests" ON quests FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own quests" ON quests FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own quests" ON quests FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Users can view own wisdom notes" ON wisdom_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wisdom notes" ON wisdom_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wisdom notes" ON wisdom_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wisdom notes" ON wisdom_notes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own books" ON books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own books" ON books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own books" ON books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own books" ON books FOR DELETE USING (auth.uid() = user_id);

-- 뱃지와 칭호는 모든 사용자가 볼 수 있음
CREATE POLICY "Users can view all badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Users can view all titles" ON titles FOR SELECT USING (true);

-- 파티 관련 정책
CREATE POLICY "Users can view parties" ON parties FOR SELECT USING (true);
CREATE POLICY "Users can insert parties" ON parties FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Users can update own parties" ON parties FOR UPDATE USING (auth.uid() = leader_id);
CREATE POLICY "Users can delete own parties" ON parties FOR DELETE USING (auth.uid() = leader_id);

CREATE POLICY "Users can view party members" ON party_members FOR SELECT USING (true);
CREATE POLICY "Users can insert party members" ON party_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own party membership" ON party_members FOR DELETE USING (auth.uid() = user_id);

-- 채팅 관련 정책
CREATE POLICY "Users can view chat rooms" ON chat_rooms FOR SELECT USING (true);
CREATE POLICY "Users can insert chat rooms" ON chat_rooms FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own chat rooms" ON chat_rooms FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own chat rooms" ON chat_rooms FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view chat room participants" ON chat_room_participants FOR SELECT USING (true);
CREATE POLICY "Users can insert chat room participants" ON chat_room_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat room participation" ON chat_room_participants FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their chat rooms" ON chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_room_participants 
    WHERE chat_room_participants.chat_room_id = chat_messages.chat_room_id 
    AND chat_room_participants.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert messages in their chat rooms" ON chat_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_room_participants 
    WHERE chat_room_participants.chat_room_id = chat_messages.chat_room_id 
    AND chat_room_participants.user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- 20. 사용자 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nickname = EXCLUDED.nickname,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 21. 기존 사용자 동기화
CREATE OR REPLACE FUNCTION sync_existing_users()
RETURNS void AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, role)
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'nickname', split_part(au.email, '@', 1)),
    'user'
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nickname = EXCLUDED.nickname,
    role = EXCLUDED.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT sync_existing_users();

-- 완료 메시지
SELECT 'Database created successfully!' as status; 

-- 스킬 테이블 업데이트 트리거
CREATE OR REPLACE FUNCTION update_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION update_skills_updated_at(); 

-- 스킬 뷰 (선행 스킬 정보 포함)
CREATE VIEW skills_with_parent AS
SELECT 
  s.id,
  s.user_id,
  s.name,
  s.description,
  s.acquired_date,
  s.expiry_date,
  s.parent_skill_id,
  p.name as parent_skill_name,
  s.created_at,
  s.updated_at
FROM skills s
LEFT JOIN skills p ON s.parent_skill_id = p.id;

-- 22. 실시간 채팅 기능

-- 시스템 메시지 자동 생성 함수
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

-- 시스템 메시지 트리거
CREATE TRIGGER trigger_create_system_message
  AFTER INSERT OR DELETE ON chat_room_participants
  FOR EACH ROW
  EXECUTE FUNCTION create_system_message();

-- 브로드캐스트 함수 (실시간 채팅)
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

-- 브로드캐스트 트리거
CREATE TRIGGER broadcast_chat_message_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_chat_message();

-- 채팅방 참가자 목록 조회 함수
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

-- 채팅방 목록 조회 뷰
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

-- 23. Realtime 활성화
-- Supabase Dashboard에서 다음 설정을 활성화하세요:
-- 1. Database > Replication > Enable realtime for chat_messages table
-- 2. Database > Replication > Enable realtime for chat_rooms table
-- 3. Database > Replication > Enable realtime for chat_room_participants table

-- Replication 활성화 (선택사항 - Supabase 대시보드에서 실행)
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_participants; 