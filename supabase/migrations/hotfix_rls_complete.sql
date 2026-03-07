-- ============================================================
-- HOTFIX COMPLETE: Fix semua RLS + generate_job_slug function
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================================

-- STEP 1: Drop SEMUA policy lama (nama lengkap dari semua migration)
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Super admins can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Super admins can update companies" ON public.companies;
DROP POLICY IF EXISTS "companies_select" ON public.companies;
DROP POLICY IF EXISTS "companies_insert" ON public.companies;
DROP POLICY IF EXISTS "companies_update" ON public.companies;

DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

DROP POLICY IF EXISTS "Public can view published jobs" ON public.jobs;
DROP POLICY IF EXISTS "HR can view all company jobs" ON public.jobs;
DROP POLICY IF EXISTS "HR can view company jobs" ON public.jobs;
DROP POLICY IF EXISTS "HR can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "HR can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "HR can delete draft jobs" ON public.jobs;
DROP POLICY IF EXISTS "HR can delete jobs" ON public.jobs;

-- STEP 2: Helper functions SECURITY DEFINER (tidak kena RLS)
CREATE OR REPLACE FUNCTION public.my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Fix generate_job_slug agar bisa bypass RLS di tabel jobs
CREATE OR REPLACE FUNCTION public.generate_job_slug(title text, company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_slug text;
  v_slug      text;
  v_counter   int := 1;
BEGIN
  v_base_slug := lower(regexp_replace(trim(title), '\W+', '-', 'g'));
  v_base_slug := trim(both '-' from v_base_slug);
  IF v_base_slug = '' THEN v_base_slug := 'lowongan'; END IF;

  v_slug := v_base_slug;
  WHILE EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.company_id = generate_job_slug.company_id AND j.slug = v_slug
  ) LOOP
    v_slug := v_base_slug || '-' || v_counter;
    v_counter := v_counter + 1;
  END LOOP;

  RETURN v_slug;
END;
$$;

-- STEP 3: Buat ulang policies bersih

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR company_id = public.my_company_id()
  );

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- COMPANIES
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (id = public.my_company_id());

CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT WITH CHECK (public.my_role() = 'super_admin');

CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE USING (id = public.my_company_id() AND public.my_role() = 'super_admin');

-- JOBS
CREATE POLICY "jobs_public_select" ON public.jobs
  FOR SELECT USING (status = 'published');

CREATE POLICY "jobs_hr_select" ON public.jobs
  FOR SELECT USING (company_id = public.my_company_id());

CREATE POLICY "jobs_hr_insert" ON public.jobs
  FOR INSERT WITH CHECK (
    company_id = public.my_company_id()
    AND public.my_role() IN ('super_admin', 'hr')
  );

CREATE POLICY "jobs_hr_update" ON public.jobs
  FOR UPDATE USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('super_admin', 'hr')
  );

CREATE POLICY "jobs_hr_delete" ON public.jobs
  FOR DELETE USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('super_admin', 'hr')
  );

SELECT 'ALL DONE! RLS bersih + generate_job_slug fixed.' AS status;
