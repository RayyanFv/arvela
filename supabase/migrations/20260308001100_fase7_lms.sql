-- ─── Fix lms_course_contents.type CHECK constraint ──────────────────────────
-- Constraint lama: ('video', 'text', 'quiz') — tidak include 'pdf'
-- Cari nama constraint-nya dan drop, lalu re-create
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'public.lms_course_contents'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%type%'
  LIMIT 1;
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.lms_course_contents DROP CONSTRAINT %I', con_name);
  END IF;
END;
$$;

-- Add new constraint that includes 'pdf'
ALTER TABLE public.lms_course_contents
  ADD CONSTRAINT lms_course_contents_type_check
  CHECK (type IN ('video', 'text', 'quiz', 'pdf'));

-- Also add constraint on content_type if not exist
ALTER TABLE public.lms_course_contents
  DROP CONSTRAINT IF EXISTS lms_course_contents_content_type_check;
ALTER TABLE public.lms_course_contents
  ADD CONSTRAINT lms_course_contents_content_type_check
  CHECK (content_type IS NULL OR content_type IN ('video', 'text', 'quiz', 'pdf'));

-- ─── lms_courses: tambah created_by, level ───────────────────────────────────
ALTER TABLE public.lms_courses
  ADD COLUMN IF NOT EXISTS created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS level       text DEFAULT 'all';

-- ─── lms_course_contents: tambah content_url, content_body, duration_mins ────
-- Kolom 'type' dan 'body' sudah ada, kita tambah alias baru untuk kejelasan
ALTER TABLE public.lms_course_contents
  ADD COLUMN IF NOT EXISTS content_type  text,
  ADD COLUMN IF NOT EXISTS content_url   text,
  ADD COLUMN IF NOT EXISTS content_body  text,
  ADD COLUMN IF NOT EXISTS duration_mins integer;

-- Sync content_type ← type (jika content_type belum terisi)
UPDATE public.lms_course_contents
  SET content_type = type
  WHERE content_type IS NULL AND type IS NOT NULL;

-- Sync content_body ← body
UPDATE public.lms_course_contents
  SET content_body = body
  WHERE content_body IS NULL AND body IS NOT NULL;

-- ─── lms_course_assignments: tambah company_id, deadline ─────────────────────
ALTER TABLE public.lms_course_assignments
  ADD COLUMN IF NOT EXISTS company_id  uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS deadline    date,
  ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Sync deadline ← due_date (jika ada)
UPDATE public.lms_course_assignments
  SET deadline = due_date
  WHERE deadline IS NULL AND due_date IS NOT NULL;

-- ─── (Hapus) lms_course_progress jika belum ada, buat baru ───────────────────
CREATE TABLE IF NOT EXISTS public.lms_course_progress (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id             uuid        NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  employee_id           uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  completion_percentage numeric     DEFAULT 0,
  is_completed          boolean     DEFAULT false,
  completed_at          timestamptz,
  last_accessed_at      timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, employee_id)
);

ALTER TABLE public.lms_course_progress ENABLE ROW LEVEL SECURITY;

-- ─── Fix: lms_content_progress UNIQUE constraint ──────────────────────────────
-- Tabel lama pakai (employee_id, content_id), kita butuh juga (content_id, employee_id)
-- Kolom 'content_id' mungkin sudah ada di lms_content_progress
-- Jika tidak: tambahkan kolom content_id
ALTER TABLE public.lms_content_progress
  ADD COLUMN IF NOT EXISTS content_id uuid REFERENCES public.lms_course_contents(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- ─── Drop policies yang mungkin sudah ada (safe) ──────────────────────────────
DROP POLICY IF EXISTS "HR manage company courses"      ON public.lms_courses;
DROP POLICY IF EXISTS "Employees view published courses" ON public.lms_courses;
DROP POLICY IF EXISTS "HR manage assignments"          ON public.lms_course_assignments;
DROP POLICY IF EXISTS "Employee own progress"          ON public.lms_course_progress;
DROP POLICY IF EXISTS "Employee own content progress"  ON public.lms_content_progress;
DROP POLICY IF EXISTS "Access lms sections"            ON public.lms_course_sections;
DROP POLICY IF EXISTS "Access lms contents"            ON public.lms_course_contents;
DROP POLICY IF EXISTS "Anyone in company can see published courses" ON public.lms_courses;
DROP POLICY IF EXISTS "Managers can manage courses"    ON public.lms_courses;

-- ─── Buat RLS policies yang benar ────────────────────────────────────────────
CREATE POLICY "HR manage company courses" ON public.lms_courses
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('hr', 'super_admin')
    )
  );

CREATE POLICY "Employees view published courses" ON public.lms_courses
  FOR SELECT USING (
    status = 'published' AND company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Access lms sections" ON public.lms_course_sections
  FOR ALL USING (course_id IN (SELECT id FROM public.lms_courses));

CREATE POLICY "Access lms contents" ON public.lms_course_contents
  FOR ALL USING (section_id IN (SELECT id FROM public.lms_course_sections));

CREATE POLICY "HR manage assignments" ON public.lms_course_assignments
  FOR ALL USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('hr', 'super_admin')
        AND p.company_id = (
          SELECT c.company_id FROM public.lms_courses c
          WHERE c.id = lms_course_assignments.course_id
        )
    )
  );

CREATE POLICY "Employee own progress" ON public.lms_course_progress
  FOR ALL USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.profiles p ON p.company_id = e.company_id
      WHERE e.id = lms_course_progress.employee_id
        AND p.id = auth.uid()
        AND p.role IN ('hr', 'super_admin')
    )
  );

CREATE POLICY "Employee own content progress" ON public.lms_content_progress
  FOR ALL USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
  );
