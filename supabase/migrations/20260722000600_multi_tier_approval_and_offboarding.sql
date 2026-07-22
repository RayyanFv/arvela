-- Migration: Multi-Tier Approval Engine & Offboarding (Resign Management)
-- Date: 2026-07-22

-- 1. Create approval_requests table
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id   uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    entity_type   text        NOT NULL, -- 'leave', 'attendance', 'resignation'
    entity_id     uuid        NOT NULL,
    current_step  integer     NOT NULL DEFAULT 1,
    status        text        NOT NULL DEFAULT 'pending_manager', -- 'pending_manager', 'pending_hr', 'approved', 'rejected'
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Create approval_steps table
CREATE TABLE IF NOT EXISTS public.approval_steps (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id   uuid        NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
    step_number  integer     NOT NULL, -- 1 = Manager/Head of Unit, 2 = HR Admin/Owner
    approver_id  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
    status       text        NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    notes        text,
    action_at    timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE(request_id, step_number)
);

-- 3. Create offboardings (Resignation Management) table
CREATE TABLE IF NOT EXISTS public.offboardings (
    id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id           uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id          uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    resignation_date     date        NOT NULL DEFAULT CURRENT_DATE,
    effective_date       date        NOT NULL,
    reason               text        NOT NULL,
    handover_notes       text,
    asset_checklist      jsonb       NOT NULL DEFAULT '[]'::jsonb,
    exit_interview_notes text,
    status               text        NOT NULL DEFAULT 'pending_manager', -- 'pending_manager', 'pending_hr', 'approved', 'rejected', 'completed'
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

-- 4. RLS Policies
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offboardings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users view approval_requests" ON public.approval_requests
    FOR SELECT TO authenticated USING (
        company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins & Managers manage approval_requests" ON public.approval_requests
    FOR ALL TO authenticated USING (
        company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Company users view approval_steps" ON public.approval_steps
    FOR SELECT TO authenticated USING (
        request_id IN (
            SELECT id FROM public.approval_requests 
            WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Approvers manage approval_steps" ON public.approval_steps
    FOR ALL TO authenticated USING (
        request_id IN (
            SELECT id FROM public.approval_requests 
            WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Company users view offboardings" ON public.offboardings
    FOR SELECT TO authenticated USING (
        company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Employees manage own offboardings" ON public.offboardings
    FOR INSERT TO authenticated WITH CHECK (
        employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
    );

CREATE POLICY "Admins & Managers manage offboardings" ON public.offboardings
    FOR ALL TO authenticated USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('super_admin','owner','hr_admin')
        )
    );
