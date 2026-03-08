-- Migration Fase 5 — Employee Management
-- Fokus: Transisi kandidat menjadi karyawan

CREATE TABLE IF NOT EXISTS public.employees (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id       uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  application_id   uuid        REFERENCES public.applications(id) ON DELETE SET NULL, 
  job_title        text,
  department       text,
  manager_id       uuid        REFERENCES public.profiles(id), 
  joined_at        timestamptz DEFAULT now(),
  status           text        NOT NULL DEFAULT 'onboarding' 
                               CHECK (status IN ('onboarding', 'active', 'terminated', 'resigned')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz,
  UNIQUE(profile_id)
);

CREATE INDEX IF NOT EXISTS employees_profile_id_idx ON public.employees(profile_id);
CREATE INDEX IF NOT EXISTS employees_company_id_idx ON public.employees(company_id);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Employees can view own record" ON public.employees
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "HR can view company employees" ON public.employees
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'boss')
    )
  );

CREATE POLICY "HR can manage employees" ON public.employees
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('hr', 'super_admin')
    )
  );
