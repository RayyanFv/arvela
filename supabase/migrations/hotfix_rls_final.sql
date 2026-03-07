-- ============================================================
-- HOTFIX FINAL: Simplified RLS - no circular dependency
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================================

-- ---- STEP 1: Drop SEMUA policy yang ada ----

-- Drop companies policies
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Super admins can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Super admins can update companies" ON public.companies;

-- Drop profiles policies  
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Drop jobs policies (jika ada yang bermasalah)
DROP POLICY IF EXISTS "HR can view company jobs" ON public.jobs;
DROP POLICY IF EXISTS "HR can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "HR can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "HR can delete jobs" ON public.jobs;
DROP POLICY IF EXISTS "Public can view published jobs" ON public.jobs;

-- ---- STEP 2: Buat helper function SECURITY DEFINER ----
-- Function ini berjalan sebagai superuser, bypass RLS, tidak circular

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

-- ---- STEP 3: Buat ulang policies ----

-- PROFILES: user bisa baca profil sendiri + profil sesama company
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR company_id = public.my_company_id()
  );

-- PROFILES: user bisa update profil sendiri
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- COMPANIES: user hanya bisa baca company mereka sendiri
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (
    id = public.my_company_id()
  );

-- COMPANIES: super_admin bisa insert/update
CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT WITH CHECK (
    public.my_role() = 'super_admin'
  );

CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE USING (
    id = public.my_company_id() AND public.my_role() = 'super_admin'
  );

-- JOBS: HR bisa baca jobs milik company mereka
CREATE POLICY "HR can view company jobs" ON public.jobs
  FOR SELECT USING (
    company_id = public.my_company_id()
    OR status = 'published'  -- publik bisa baca published jobs
  );

-- JOBS: HR bisa insert
CREATE POLICY "HR can insert jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    company_id = public.my_company_id()
    AND public.my_role() IN ('super_admin', 'hr')
  );

-- JOBS: HR bisa update jobs milik company mereka
CREATE POLICY "HR can update jobs" ON public.jobs
  FOR UPDATE USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('super_admin', 'hr')
  );

-- JOBS: HR/super_admin bisa delete
CREATE POLICY "HR can delete jobs" ON public.jobs
  FOR DELETE USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('super_admin', 'hr')
  );

SELECT 'RLS Final Hotfix applied successfully!' as status;
