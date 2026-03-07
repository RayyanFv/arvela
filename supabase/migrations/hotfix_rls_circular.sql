-- ============================================================
-- HOTFIX 3: Fix Infinite Recursion in Profiles RLS Perfectly
--
-- Masalah: PostgREST mengevaluasi semua rule menggunakan OR.
-- Rule lama kita tidak pernah di-DROP sehingga meski ditambah
-- rule sederhana, engine database tetap crash karena query
-- internalnya memicu infinite loop.
--
-- Solusi: Kita buat fungsi SECURITY DEFINER yang berlari sebagai
-- admin secara internal hanya untuk ngintip `company_id` si user,
-- lalu DROP semua rule yang bikin muter-muter.
--
-- JALANKAN INI DI SUPABASE SQL EDITOR
-- ============================================================

-- 1. Buat helper function internal yang bypass RLS
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. HAPUS SEMUA policy lama yang bermasalah di tabel profiles
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own exact profile" ON public.profiles;

-- 3. Ganti dengan policy baru yang AMAN dan bebas recursion loop
CREATE POLICY "Users can view profiles in their company" ON public.profiles
  FOR SELECT USING (
    company_id = public.get_my_company_id()
  );

-- Lakukan hal yang sama untuk tabel companies agar sinkron
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company" ON public.companies
  FOR SELECT USING (
    id = public.get_my_company_id() OR
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) -- sekadar fallback
  );
