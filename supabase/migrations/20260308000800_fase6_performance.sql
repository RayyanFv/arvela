-- Migration Fase 6 — Performance & Onboarding Tasks
-- Fokus: Pemantauan kinerja dan orientasi karyawan baru

-- ONBOARDING TASKS
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  description    text,
  is_completed   boolean     DEFAULT false,
  due_date       date,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz
);

-- OKRS (OBJECTIVES)
CREATE TABLE IF NOT EXISTS public.okrs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  company_id       uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title            text        NOT NULL,
  description      text,
  period           text        NOT NULL, -- e.g., 'Q1 2026'
  status           text        DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  total_progress   numeric     DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz
);

-- KEY RESULTS (KR)
CREATE TABLE IF NOT EXISTS public.key_results (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id         uuid        NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  target_value   numeric     NOT NULL,
  current_value  numeric     DEFAULT 0,
  unit           text,       -- e.g., '%', 'IDR', 'tasks'
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz
);

-- FUNCTION: auto-calculate OKR progress
CREATE OR REPLACE FUNCTION public.calculate_okr_progress()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.okrs
  SET total_progress = (
    SELECT COALESCE(AVG((current_value / NULLIF(target_value, 0)) * 100), 0)
    FROM public.key_results
    WHERE okr_id = COALESCE(NEW.okr_id, OLD.okr_id)
  )
  WHERE id = COALESCE(NEW.okr_id, OLD.okr_id);
  RETURN NEW;
END;
$$;

-- Trigger calculation
DROP TRIGGER IF EXISTS on_kr_change ON public.key_results;
CREATE TRIGGER on_kr_change
  AFTER INSERT OR UPDATE OR DELETE ON public.key_results
  FOR EACH ROW EXECUTE PROCEDURE public.calculate_okr_progress();

-- Enable RLS
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

-- ONBOARDING RLS
CREATE POLICY "Employees can see and update own onboarding" ON public.onboarding_tasks
  FOR ALL USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
  );

CREATE POLICY "HR can manage all onboarding in company" ON public.onboarding_tasks
  FOR ALL USING (
    employee_id IN (
        SELECT e.id FROM public.employees e
        JOIN public.profiles p ON p.company_id = e.company_id
        WHERE p.id = auth.uid() AND p.role IN ('hr', 'super_admin')
    )
  );

-- OKRs RLS
CREATE POLICY "Employees can view own OKRs" ON public.okrs
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
  );

CREATE POLICY "HR can manage company OKRs" ON public.okrs
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('hr', 'super_admin')
    )
  );

-- Key results RLS
CREATE POLICY "Inherited access for key results" ON public.key_results
  FOR ALL USING (
    okr_id IN (
      SELECT id FROM public.okrs 
      WHERE employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
      OR company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin'))
    )
  );
