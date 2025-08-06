-- 스킬 테이블 개선사항 적용

-- 1. parent_skill_id 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_skills_parent_skill_id ON skills(parent_skill_id);

-- 2. 순환 참조 방지 제약조건 추가 (기존 제약조건이 있다면 삭제 후 재생성)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'skills_parent_skill_check' 
    AND table_name = 'skills'
  ) THEN
    ALTER TABLE skills DROP CONSTRAINT skills_parent_skill_check;
  END IF;
END $$;

ALTER TABLE skills ADD CONSTRAINT skills_parent_skill_check 
  CHECK (parent_skill_id != id);

-- 3. 스킬 테이블 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 스킬 테이블 업데이트 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_skills_updated_at ON skills;
CREATE TRIGGER trigger_update_skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION update_skills_updated_at();

-- 5. 스킬 뷰 생성 (기존 뷰가 있다면 삭제 후 재생성)
DROP VIEW IF EXISTS skills_with_parent;
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

-- 완료 메시지
SELECT 'Skills table improvements applied successfully!' as status; 