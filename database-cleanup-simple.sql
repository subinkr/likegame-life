-- LikeGame.life 데이터베이스 간단 삭제

-- 1. 모든 테이블 삭제 (CASCADE로 의존성 자동 처리)
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

-- 2. 함수 삭제
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_existing_users() CASCADE;

-- 3. 트리거 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 완료 메시지
SELECT 'Database cleanup completed successfully!' as status; 

-- 1. 모든 테이블 삭제 (CASCADE로 의존성 자동 처리)
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

-- 2. 함수 삭제
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_existing_users() CASCADE;

-- 3. 트리거 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 완료 메시지
SELECT 'Database cleanup completed successfully!' as status; 
 