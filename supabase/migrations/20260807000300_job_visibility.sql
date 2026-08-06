-- Migration: Job Visibility Levels (public / link_only / invited)
-- Date: 2026-08-07

ALTER TABLE public.jobs
    ADD COLUMN IF NOT EXISTS visibility    text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'link_only', 'invited')),
    ADD COLUMN IF NOT EXISTS access_token  text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

CREATE INDEX IF NOT EXISTS jobs_visibility_idx ON public.jobs(visibility);

-- Invited-only: per-email personal invite links
CREATE TABLE IF NOT EXISTS public.job_invites (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id      uuid        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    email       text        NOT NULL,
    token       text        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    opened_at   timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(job_id, email)
);

ALTER TABLE public.job_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can manage job_invites for own company jobs" ON public.job_invites
    FOR ALL TO authenticated USING (
        job_id IN (
            SELECT id FROM public.jobs WHERE company_id IN (
                SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin','owner','hr_admin')
            )
        )
    );

-- Public policy on jobs already restricts to status = 'published'; visibility
-- gating for link_only/invited happens in application code (token check),
-- since RLS can't easily verify a caller-supplied query-string token here.
