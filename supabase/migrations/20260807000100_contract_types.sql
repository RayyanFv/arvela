-- Migration: Contract Types (PKWT/PKWTT master data)
-- Date: 2026-08-07

CREATE TABLE IF NOT EXISTS public.contract_types (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name        text        NOT NULL,
    code        text,
    description text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(company_id, name)
);

ALTER TABLE public.contract_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company users can view contract_types" ON public.contract_types
    FOR SELECT TO authenticated USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can manage contract_types" ON public.contract_types
    FOR ALL TO authenticated USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin','owner','hr_admin')));

INSERT INTO public.contract_types (company_id, name, code) SELECT id, 'PKWT (Kontrak)', 'PKWT' FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.contract_types (company_id, name, code) SELECT id, 'PKWTT (Tetap)',  'PKWTT' FROM public.companies ON CONFLICT DO NOTHING;

-- Link employees to contract type
ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS contract_type_id uuid REFERENCES public.contract_types(id) ON DELETE SET NULL;
