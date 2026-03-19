-- Migration v0.1: New Features implementation

-- =============================================================
-- 1. Pre Screening / Prerequisite
-- =============================================================
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS screening_questions jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS screening_answers jsonb DEFAULT '{}'::jsonb;

-- =============================================================
-- 2. Assessment Proctoring & Interview Integration
-- =============================================================
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS jitsi_room_id text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS ai_review_result text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS recording_url text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS session_questions jsonb DEFAULT '[]'::jsonb;

-- Proctoring
CREATE TABLE IF NOT EXISTS public.proctoring_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id uuid NOT NULL REFERENCES public.assessment_assignments(id) ON DELETE CASCADE,
    log_type text NOT NULL, -- e.g. 'tab_switch', 'copy_paste', 'face_missing', 'multiple_faces', 'tab_blur'
    timestamp timestamptz NOT NULL DEFAULT now(),
    details jsonb
);

ALTER TABLE public.proctoring_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can view proctoring logs" ON public.proctoring_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assessment_assignments a
            JOIN public.assessments ast ON ast.id = a.assessment_id
            WHERE a.id = proctoring_logs.assignment_id 
            AND is_admin() AND ast.company_id = my_company_id()
        )
    );

CREATE POLICY "Public cand insert proctoring logs" ON public.proctoring_logs
    FOR INSERT WITH CHECK (true); -- Filter by token via application logic

-- =============================================================
-- 3. HR Perspective (Interview Templates)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.interview_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title text NOT NULL,
    questions jsonb NOT NULL DEFAULT '[]'::jsonb, -- array of standardized questions
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.interview_templates(id) ON DELETE SET NULL;

ALTER TABLE public.interview_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can view and manage templates" ON public.interview_templates
    FOR ALL USING (
        is_admin() AND company_id = my_company_id()
    );

-- =============================================================
-- 6. Prosedur Surat Rekrutmen (PKWT & PKWTT)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.recruitment_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    document_type text NOT NULL CHECK (document_type IN ('pkwt', 'pkwtt', 'other')),
    document_url text NOT NULL,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'completed')),
    uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.recruitment_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can manage recruitment documents" ON public.recruitment_documents
    FOR ALL USING (
        is_admin() AND company_id = my_company_id()
    );
