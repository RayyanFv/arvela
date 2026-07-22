-- Migration: Org Units (upgrade departments) + Job Grades (Pangkat)
-- Date: 2026-07-22

-- 1. Upgrade departments table
ALTER TABLE public.departments
    ADD COLUMN IF NOT EXISTS parent_id    uuid    REFERENCES public.departments(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS code         text,
    ADD COLUMN IF NOT EXISTS description  text,
    ADD COLUMN IF NOT EXISTS level        integer NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS head_id      uuid    REFERENCES public.employees(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at   timestamptz NOT NULL DEFAULT now();

-- 2. unit_level_configs (label per level per company)
CREATE TABLE IF NOT EXISTS public.unit_level_configs (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    level       integer     NOT NULL,
    label       text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(company_id, level)
);

INSERT INTO public.unit_level_configs (company_id, level, label)
SELECT id, 1, 'Divisi' FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.unit_level_configs (company_id, level, label)
SELECT id, 2, 'Departemen' FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.unit_level_configs (company_id, level, label)
SELECT id, 3, 'Unit' FROM public.companies ON CONFLICT DO NOTHING;

ALTER TABLE public.unit_level_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company users can view unit_level_configs" ON public.unit_level_configs
    FOR SELECT TO authenticated USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can manage unit_level_configs" ON public.unit_level_configs
    FOR ALL TO authenticated USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin','owner','hr_admin')));

-- 3. job_grades (pangkat/golongan struktural)
-- Convention: Level 1 = Direktur (Tertinggi), Level 7 = Staf (Terendah)
CREATE TABLE IF NOT EXISTS public.job_grades (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name        text        NOT NULL,
    code        text,
    level       integer     NOT NULL DEFAULT 1,
    description text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(company_id, name)
);

ALTER TABLE public.job_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company users can view job_grades" ON public.job_grades
    FOR SELECT TO authenticated USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can manage job_grades" ON public.job_grades
    FOR ALL TO authenticated USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin','owner','hr_admin')));

INSERT INTO public.job_grades (company_id, name, code, level) SELECT id, 'Direktur',         'DIR', 1 FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.job_grades (company_id, name, code, level) SELECT id, 'General Manager',  'GM',  2 FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.job_grades (company_id, name, code, level) SELECT id, 'Manager',          'MGR', 3 FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.job_grades (company_id, name, code, level) SELECT id, 'Supervisor',       'SPV', 4 FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.job_grades (company_id, name, code, level) SELECT id, 'Pelaksana Senior', 'SNR', 5 FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.job_grades (company_id, name, code, level) SELECT id, 'Pelaksana Junior', 'JNR', 6 FROM public.companies ON CONFLICT DO NOTHING;
INSERT INTO public.job_grades (company_id, name, code, level) SELECT id, 'Staf',             'STF', 7 FROM public.companies ON CONFLICT DO NOTHING;

-- 4. Link employees to units and grade
ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS home_unit_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS work_unit_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS job_grade_id uuid REFERENCES public.job_grades(id)  ON DELETE SET NULL;
