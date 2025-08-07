-- 닉네임 필수화 및 중복 방지를 위한 데이터베이스 수정 스크립트

-- 1. 기존 닉네임이 NULL인 사용자들을 임시 닉네임으로 업데이트
UPDATE users 
SET nickname = 'user_' || id::text 
WHERE nickname IS NULL OR nickname = '';

-- 2. 중복된 닉네임이 있는 경우 처리 (임시로 숫자 추가)
-- 먼저 중복된 닉네임들을 찾아서 임시로 변경
WITH duplicate_nicknames AS (
  SELECT nickname, COUNT(*) as count
  FROM users 
  WHERE nickname IS NOT NULL
  GROUP BY nickname 
  HAVING COUNT(*) > 1
)
UPDATE users 
SET nickname = nickname || '_' || id::text
WHERE nickname IN (SELECT nickname FROM duplicate_nicknames);

-- 3. nickname 컬럼을 NOT NULL로 변경
ALTER TABLE users ALTER COLUMN nickname SET NOT NULL;

-- 4. nickname 컬럼에 UNIQUE 제약조건 추가 (이미 있다면 무시됨)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_nickname_key' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_nickname_key UNIQUE (nickname);
  END IF;
END $$;

-- 5. 닉네임 길이 제한 추가 (선택사항)
ALTER TABLE users ADD CONSTRAINT nickname_length_check 
  CHECK (LENGTH(nickname) >= 2 AND LENGTH(nickname) <= 20);

-- 6. 닉네임 형식 제한 추가 (선택사항) - 영문, 숫자, 한글, 언더스코어만 허용
ALTER TABLE users ADD CONSTRAINT nickname_format_check 
  CHECK (nickname ~ '^[a-zA-Z0-9가-힣_]+$');

-- 7. 현재 상태 확인을 위한 쿼리
SELECT 
  '현재 사용자 수' as info,
  COUNT(*) as count
FROM users
UNION ALL
SELECT 
  '닉네임이 있는 사용자 수' as info,
  COUNT(*) as count
FROM users 
WHERE nickname IS NOT NULL AND nickname != ''
UNION ALL
SELECT 
  '중복 닉네임 수' as info,
  COUNT(*) as count
FROM (
  SELECT nickname, COUNT(*) as cnt
  FROM users 
  WHERE nickname IS NOT NULL
  GROUP BY nickname 
  HAVING COUNT(*) > 1
) duplicates; 