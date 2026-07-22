-- Migration: Relational Master Data (Departments, Job Positions, Office Locations)
-- Date: 2026-07-22

-- 1. Create Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name        text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(company_id, name)
);

-- 2. Create Job Positions Table
CREATE TABLE IF NOT EXISTS public.job_positions (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name        text        NOT NULL,
    grade       integer     DEFAULT 1,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(company_id, name)
);

-- 3. Create Office Locations Table
CREATE TABLE IF NOT EXISTS public.office_locations (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name          text        NOT NULL,
    lat           numeric(10, 8) NOT NULL,
    lng           numeric(11, 8) NOT NULL,
    radius_meters integer     NOT NULL DEFAULT 100,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- 4. Modify Employees Table
ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS job_position_id uuid REFERENCES public.job_positions(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow select on departments to company users" ON public.departments
    FOR SELECT TO authenticated USING (
        company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Allow select on job_positions to company users" ON public.job_positions
    FOR SELECT TO authenticated USING (
        company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Allow select on office_locations to company users" ON public.office_locations
    FOR SELECT TO authenticated USING (
        company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    );

-- Admin policies
CREATE POLICY "Admins can manage departments in company" ON public.departments
    FOR ALL TO authenticated USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('super_admin', 'owner', 'hr_admin')
        )
    );

CREATE POLICY "Admins can manage job_positions in company" ON public.job_positions
    FOR ALL TO authenticated USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('super_admin', 'owner', 'hr_admin')
        )
    );

CREATE POLICY "Admins can manage office_locations in company" ON public.office_locations
    FOR ALL TO authenticated USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('super_admin', 'owner', 'hr_admin')
        )
    );

-- 5. Data Migration script for existing records
DO $$
DECLARE
    v_emp_record record;
    v_comp_record record;
    v_dept_id uuid;
    v_pos_id uuid;
BEGIN
    -- A. Migrate Employees department and job titles to new tables
    FOR v_emp_record IN SELECT id, company_id, department, job_title FROM public.employees LOOP
        v_dept_id := NULL;
        v_pos_id := NULL;

        -- Migrate department
        IF v_emp_record.department IS NOT NULL AND v_emp_record.department <> '' THEN
            INSERT INTO public.departments (company_id, name)
            VALUES (v_emp_record.company_id, v_emp_record.department)
            ON CONFLICT (company_id, name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id INTO v_dept_id;

            UPDATE public.employees SET department_id = v_dept_id WHERE id = v_emp_record.id;
        END IF;

        -- Migrate job title
        IF v_emp_record.job_title IS NOT NULL AND v_emp_record.job_title <> '' THEN
            INSERT INTO public.job_positions (company_id, name)
            VALUES (v_emp_record.company_id, v_emp_record.job_title)
            ON CONFLICT (company_id, name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id INTO v_pos_id;

            UPDATE public.employees SET job_position_id = v_pos_id WHERE id = v_emp_record.id;
        END IF;
    END LOOP;

    -- B. Migrate Companies office locations to office_locations table
    FOR v_comp_record IN SELECT id, name, office_lat, office_lng, office_radius_meters FROM public.companies LOOP
        IF v_comp_record.office_lat IS NOT NULL AND v_comp_record.office_lng IS NOT NULL THEN
            INSERT INTO public.office_locations (company_id, name, lat, lng, radius_meters)
            VALUES (
                v_comp_record.id, 
                'Kantor Pusat (' || v_comp_record.name || ')', 
                v_comp_record.office_lat, 
                v_comp_record.office_lng, 
                COALESCE(v_comp_record.office_radius_meters, 100)
            );
        END IF;
    END LOOP;
END $$;
