-- ──────────────────────────────────────────────────
-- MIGRATION: ADD CERTIFICATE TOGGLE TO COURSES
-- RUN THIS IN SUPABASE SQL EDITOR
-- ──────────────────────────────────────────────────

-- 1. Add column to lms_courses
ALTER TABLE lms_courses 
ADD COLUMN IF NOT EXISTS has_certificate BOOLEAN DEFAULT true;

-- 2. Update existing records to have certificate enabled by default
UPDATE lms_courses SET has_certificate = true WHERE has_certificate IS NULL;

-- 3. Notify that the patch is complete
COMMENT ON COLUMN lms_courses.has_certificate IS 'Toggle to enable/disable automated certificate issuance for this course';
