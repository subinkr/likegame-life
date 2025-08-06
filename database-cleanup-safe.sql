-- LikeGame.life 데이터베이스 안전 삭제

-- 1. 기존 정책들 삭제 (테이블이 존재할 때만)
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- chat_room_participants 테이블이 존재하는지 확인
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_room_participants'
    ) INTO table_exists;
    
    -- 테이블이 존재할 때만 트리거 삭제
    IF table_exists THEN
        DROP TRIGGER IF EXISTS trigger_create_system_message ON chat_room_participants;
    END IF;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 함수 삭제
DROP FUNCTION IF EXISTS public.create_system_message() CASCADE;
DROP FUNCTION IF EXISTS public.get_chat_room_participants(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_existing_users() CASCADE;

-- 3. 뷰 삭제
DROP VIEW IF EXISTS chat_rooms_with_participants CASCADE;

-- 4. 테이블 삭제 (CASCADE로 의존성 자동 처리)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_room_participants CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS wisdom_notes CASCADE;
DROP TABLE IF EXISTS party_members CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS user_titles CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS titles CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS stats CASCADE;
DROP TABLE IF EXISTS strength_records CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 5. 인덱스 삭제 (테이블 삭제 시 자동 삭제되지만 명시적으로)
DROP INDEX IF EXISTS idx_strength_records_user_id;
DROP INDEX IF EXISTS idx_strength_records_created_at;
DROP INDEX IF EXISTS idx_stats_user_id;
DROP INDEX IF EXISTS idx_stats_month;
DROP INDEX IF EXISTS idx_skills_user_id;
DROP INDEX IF EXISTS idx_user_badges_user_id;
DROP INDEX IF EXISTS idx_user_titles_user_id;
DROP INDEX IF EXISTS idx_quests_user_id;
DROP INDEX IF EXISTS idx_party_members_party_id;
DROP INDEX IF EXISTS idx_wisdom_notes_user_id;
DROP INDEX IF EXISTS idx_books_user_id;
DROP INDEX IF EXISTS idx_chat_messages_room_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;

-- 완료 메시지
SELECT 'Database cleanup completed successfully!' as status; 

-- 1. 기존 정책들 삭제 (테이블이 존재할 때만)
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- chat_room_participants 테이블이 존재하는지 확인
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_room_participants'
    ) INTO table_exists;
    
    -- 테이블이 존재할 때만 트리거 삭제
    IF table_exists THEN
        DROP TRIGGER IF EXISTS trigger_create_system_message ON chat_room_participants;
    END IF;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 함수 삭제
DROP FUNCTION IF EXISTS public.create_system_message() CASCADE;
DROP FUNCTION IF EXISTS public.get_chat_room_participants(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_existing_users() CASCADE;

-- 3. 뷰 삭제
DROP VIEW IF EXISTS chat_rooms_with_participants CASCADE;

-- 4. 테이블 삭제 (CASCADE로 의존성 자동 처리)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_room_participants CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS wisdom_notes CASCADE;
DROP TABLE IF EXISTS party_members CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS user_titles CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS titles CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS stats CASCADE;
DROP TABLE IF EXISTS strength_records CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 5. 인덱스 삭제 (테이블 삭제 시 자동 삭제되지만 명시적으로)
DROP INDEX IF EXISTS idx_strength_records_user_id;
DROP INDEX IF EXISTS idx_strength_records_created_at;
DROP INDEX IF EXISTS idx_stats_user_id;
DROP INDEX IF EXISTS idx_stats_month;
DROP INDEX IF EXISTS idx_skills_user_id;
DROP INDEX IF EXISTS idx_user_badges_user_id;
DROP INDEX IF EXISTS idx_user_titles_user_id;
DROP INDEX IF EXISTS idx_quests_user_id;
DROP INDEX IF EXISTS idx_party_members_party_id;
DROP INDEX IF EXISTS idx_wisdom_notes_user_id;
DROP INDEX IF EXISTS idx_books_user_id;
DROP INDEX IF EXISTS idx_chat_messages_room_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;

-- 완료 메시지
SELECT 'Database cleanup completed successfully!' as status; 
 