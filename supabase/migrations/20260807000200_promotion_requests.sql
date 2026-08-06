-- Migration: Promotion Requests (Manajemen Naik Pangkat)
-- Date: 2026-08-07
-- Reuses the existing multi-tier approval engine (approval_requests/approval_steps).

CREATE TABLE IF NOT EXISTS public.promotion_requests (
    id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id         uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id        uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    current_grade_id   uuid        REFERENCES public.job_grades(id) ON DELETE SET NULL,
    target_grade_id    uuid        NOT NULL REFERENCES public.job_grades(id) ON DELETE CASCADE,
    effective_date     date        NOT NULL,
    reason             text        NOT NULL,
    status             text        NOT NULL DEFAULT 'pending_manager', -- 'pending_manager', 'pending_hr', 'approved', 'rejected'
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promotion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users view promotion_requests" ON public.promotion_requests
    FOR SELECT TO authenticated USING (
        company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins & Managers manage promotion_requests" ON public.promotion_requests
    FOR ALL TO authenticated USING (
        company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE TRIGGER on_promotion_requests_update
    BEFORE UPDATE ON public.promotion_requests
    FOR EACH ROW EXECUTE PROCEDURE public.handle_attendance();
