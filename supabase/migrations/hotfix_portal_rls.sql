-- ============================================================
-- HOTFIX: Candidate Portal RLS
-- Allows candidates to view their own application data
-- ============================================================

-- 1. applications
DROP POLICY IF EXISTS "Candidates can view their own applications" ON public.applications;
CREATE POLICY "Candidates can view their own applications" ON public.applications
  FOR SELECT USING (email = (auth.jwt() ->> 'email'));

-- 2. companies (allow candidates to see company name/logo for their applied jobs)
DROP POLICY IF EXISTS "Candidates can view companies they applied to" ON public.companies;
CREATE POLICY "Candidates can view companies they applied to" ON public.companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM public.applications 
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- 3. jobs (allow candidates to see job details for their application)
DROP POLICY IF EXISTS "Candidates can view jobs they applied to" ON public.jobs;
CREATE POLICY "Candidates can view jobs they applied to" ON public.jobs
  FOR SELECT USING (
    id IN (
      SELECT job_id FROM public.applications 
      WHERE email = (auth.jwt() ->> 'email')
    )
  );

SELECT 'Candidate Portal RLS Fixed!' as status;
