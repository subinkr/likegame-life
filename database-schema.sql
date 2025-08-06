-- LikeGame.life 데이터베이스 스키마

-- 1. 사용자 테이블 (Supabase Auth와 연동)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 힘 기록 테이블
CREATE TABLE IF NOT EXISTS strength_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bench INTEGER NOT NULL DEFAULT 0,
  squat INTEGER NOT NULL DEFAULT 0,
  deadlift INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 스탯 테이블 (민첩, 지혜 기록)
CREATE TABLE IF NOT EXISTS stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agility INTEGER NOT NULL DEFAULT 0,
  wisdom INTEGER NOT NULL DEFAULT 0,
  month TEXT NOT NULL, -- YYYY-MM 형식
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 스킬 테이블
CREATE TABLE IF NOT EXISTS skills (
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

-- 5. 뱃지 테이블
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  rarity TEXT NOT NULL DEFAULT 'common',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 사용자 뱃지 테이블
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  achieved BOOLEAN NOT NULL DEFAULT false,
  achieved_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 7. 칭호 테이블
CREATE TABLE IF NOT EXISTS titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  rarity TEXT NOT NULL DEFAULT 'common',
  required_badges TEXT[], -- 뱃지 이름 배열
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 사용자 칭호 테이블
CREATE TABLE IF NOT EXISTS user_titles (
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
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  reward INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, abandoned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 파티 테이블
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  max_members INTEGER NOT NULL DEFAULT 4,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 파티 멤버 테이블
CREATE TABLE IF NOT EXISTS party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- leader, member
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(party_id, user_id)
);

-- 12. 지혜 노트 테이블
CREATE TABLE IF NOT EXISTS wisdom_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quote TEXT NOT NULL,
  impression TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. 책 테이블
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  status TEXT NOT NULL DEFAULT 'reading', -- reading, completed, abandoned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. 채팅방 테이블
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'quest', -- quest, party, general
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. 채팅방 참가자 테이블
CREATE TABLE IF NOT EXISTS chat_room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_room_id, user_id)
);

-- 16. 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_strength_records_user_id ON strength_records(user_id);
CREATE INDEX IF NOT EXISTS idx_strength_records_created_at ON strength_records(created_at);
CREATE INDEX IF NOT EXISTS idx_stats_user_id ON stats(user_id);
CREATE INDEX IF NOT EXISTS idx_stats_month ON stats(month);
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_titles_user_id ON user_titles(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_user_id ON quests(user_id);
CREATE INDEX IF NOT EXISTS idx_party_members_party_id ON party_members(party_id);
CREATE INDEX IF NOT EXISTS idx_wisdom_notes_user_id ON wisdom_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE strength_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
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

-- 기본 RLS 정책 (사용자는 자신의 데이터만 접근 가능)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own strength records" ON strength_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own strength records" ON strength_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own strength records" ON strength_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own strength records" ON strength_records FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" ON stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON stats FOR UPDATE USING (auth.uid() = user_id);

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

CREATE POLICY "Users can view own quests" ON quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quests" ON quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quests" ON quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quests" ON quests FOR DELETE USING (auth.uid() = user_id);

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
CREATE POLICY "Users can insert parties" ON parties FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own parties" ON parties FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own parties" ON parties FOR DELETE USING (auth.uid() = created_by);

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

-- 함수 생성 (사용자 생성 시 자동으로 users 테이블에 추가)
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

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users