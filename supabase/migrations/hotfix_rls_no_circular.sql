-- ============================================================
-- HOTFIX: Fix circular RLS dependency on profiles & companies
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================================

-- Drop existing circular policies
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;

-- Fix profiles SELECT: langsung pakai auth.uid(), bukan subquery ke dirinya sendiri
-- Setiap user hanya boleh baca profile dalam company mereka sendiri
-- Gunakan security definer function untuk menghindari circular dependency

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- RLS profiles: pakai fungsi helper (security definer bypass circular dep)
CREATE POLICY "Users can view profiles in their company" ON public.profiles
  FOR SELECT USING (
    company_id = public.get_my_company_id()
    OR id = auth.uid()  -- selalu bisa baca profil sendiri
  );

-- RLS companies: pakai fungsi helper juga
CREATE POLICY "Users can view their own company" ON public.companies
  FOR SELECT USING (
    id = public.get_my_company_id()
  );

-- Verifikasi
SELECT 'RLS Hotfix applied successfully' as status;
