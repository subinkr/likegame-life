-- 데이터베이스 스키마 업데이트 스크립트

-- 1. parties 테이블 업데이트
-- created_by 컬럼을 leader_id로 변경
ALTER TABLE parties RENAME COLUMN created_by TO leader_id;

-- 2. quests 테이블 업데이트
-- user_id 컬럼을 creator_id로 변경
ALTER TABLE quests RENAME COLUMN user_id TO creator_id;

-- 3. accepted_by_user_id 컬럼 추가 (이미 존재하면 무시)
ALTER TABLE quests ADD COLUMN IF NOT EXISTS accepted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 4. chat_rooms 테이블에 party_id와 quest_id 컬럼 추가
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES parties(id) ON DELETE CASCADE;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS quest_id UUID REFERENCES quests(id) ON DELETE CASCADE;

-- 5. 기존 인덱스 제거
DROP INDEX IF EXISTS idx_quests_user_id;

-- 6. 새로운 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_quests_creator_id ON quests(creator_id);

-- 7. RLS 정책 업데이트
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own quests" ON quests;
DROP POLICY IF EXISTS "Users can insert own quests" ON quests;
DROP POLICY IF EXISTS "Users can update own quests" ON quests;
DROP POLICY IF EXISTS "Users can delete own quests" ON quests;

-- 새로운 정책 생성
CREATE POLICY "Users can view quests" ON quests FOR SELECT USING (true);
CREATE POLICY "Users can insert own quests" ON quests FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own quests" ON quests FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own quests" ON quests FOR DELETE USING (auth.uid() = creator_id);

-- 완료 메시지
SELECT 'Database schema updated successfully!' as status; 