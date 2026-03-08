-- Migration Fase 6.1 — Initiatives for OKRs
CREATE TABLE IF NOT EXISTS public.initiatives (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id         uuid        NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  delivery_window text,      
  status         text        DEFAULT 'Not started' CHECK (status IN ('Not started', 'In progress', 'Done', 'Unconfirmed')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz
);

ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inherited access for initiatives" ON public.initiatives
  FOR ALL USING (
    okr_id IN (
      SELECT id FROM public.okrs 
      WHERE employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
      OR company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin'))
    )
  );
