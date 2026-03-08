-- ============================================================
-- HOTFIX: RLS Permission Denied for 'users'
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================================

-- Drop existing bad policies that queried auth.users directly
DROP POLICY IF EXISTS "Candidates can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Candidates can view applied company" ON public.companies;
DROP POLICY IF EXISTS "Candidates can view applied jobs" ON public.jobs;

-- Recreate policies safely using auth.jwt()->>'email'
CREATE POLICY "Candidates can view own applications" ON public.applications
  FOR SELECT USING (
    email = (auth.jwt()->>'email')::text
  );

CREATE POLICY "Candidates can view applied company" ON public.companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM public.applications WHERE email = (auth.jwt()->>'email')::text)
  );

CREATE POLICY "Candidates can view applied jobs" ON public.jobs
  FOR SELECT USING (
    id IN (SELECT job_id FROM public.applications WHERE email = (auth.jwt()->>'email')::text)
  );

SELECT 'Hotfix auth.users applied successfully' as status;
