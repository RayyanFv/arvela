-- Migration Fase 7 — LMS (Learning Management System)
-- Fokus: Pembuatan kursus, pengelolaan materi, dan progres belajar

-- 1. COURSES
CREATE TABLE IF NOT EXISTS public.lms_courses (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  description    text,
  thumbnail_url  text,
  category       text,
  status         text        DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz
);

-- 2. SECTIONS (Chapters)
CREATE TABLE IF NOT EXISTS public.lms_course_sections (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id      uuid        NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  order_index    integer     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 3. CONTENT
CREATE TABLE IF NOT EXISTS public.lms_course_contents (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id     uuid        NOT NULL REFERENCES public.lms_course_sections(id) ON DELETE CASCADE,
  type           text        NOT NULL CHECK (type IN ('video', 'text', 'quiz')),
  title          text        NOT NULL,
  body           text,       -- For markdown text or external video URL
  assessment_id  uuid        REFERENCES public.assessments(id), -- If type = 'quiz'
  order_index    integer     NOT NULL DEFAULT 0,
  is_required    boolean     DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 4. COURSE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.lms_course_assignments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  course_id      uuid        NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  assigned_at    timestamptz DEFAULT now(),
  due_date       date,
  completed_at   timestamptz,
  status         text        DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 5. PROGRESS
CREATE TABLE IF NOT EXISTS public.lms_content_progress (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  content_id     uuid        NOT NULL REFERENCES public.lms_course_contents(id) ON DELETE CASCADE,
  is_completed   boolean     DEFAULT false,
  watch_duration integer     DEFAULT 0, -- in seconds
  last_accessed  timestamptz DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, content_id)
);

-- Enable RLS
ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_course_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_content_progress ENABLE ROW LEVEL SECURITY;

-- Select Policies
CREATE POLICY "Anyone in company can see published courses" ON public.lms_courses
  FOR SELECT USING (
    status = 'published' AND company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage courses" ON public.lms_courses
  FOR ALL USING (
    company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin')
    )
  );

-- Assignments & Progress (Private)
CREATE POLICY "Employees can see own assignments" ON public.lms_course_assignments
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
  );

CREATE POLICY "Employees can manage own content progress" ON public.lms_content_progress
  FOR ALL USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
  );

-- Inherit section/content access from courses
CREATE POLICY "Section inherited access" ON public.lms_course_sections
  FOR SELECT USING (course_id IN (SELECT id FROM public.lms_courses));

CREATE POLICY "Content inherited access" ON public.lms_course_contents
  FOR SELECT USING (section_id IN (SELECT id FROM public.lms_course_sections));
