-- wisdom_notes 테이블 업데이트

-- 1. book_id 컬럼 추가
ALTER TABLE wisdom_notes ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES books(id) ON DELETE SET NULL;

-- 2. title 컬럼 제거 (사용하지 않음)
ALTER TABLE wisdom_notes DROP COLUMN IF EXISTS title;

-- 완료 메시지
SELECT 'Wisdom notes table updated successfully!' as status; 