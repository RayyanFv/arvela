-- ============================================================
-- REPAIR SCRIPT: Buat ulang profile untuk user yang sudah ada
-- Jalankan di Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Cek user mana yang belum punya profile
SELECT 
  u.id, 
  u.email, 
  u.raw_user_meta_data,
  p.id AS profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 2. Jalankan trigger secara manual untuk user yang belum punya profile
-- Ganti: script ini akan re-insert profile berdasarkan user_metadata yang ada

DO $$
DECLARE
  u RECORD;
  v_company_id uuid;
  v_company_name text;
  v_slug text;
  v_base_slug text;
  v_counter integer;
BEGIN
  FOR u IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    v_company_id := NULL;
    v_company_name := NULL;

    -- Cek apakah ada company_id di metadata (invited user)
    IF u.raw_user_meta_data->>'company_id' IS NOT NULL THEN
      v_company_id := (u.raw_user_meta_data->>'company_id')::uuid;

    -- Cek apakah ada company_name (self-register)
    ELSIF u.raw_user_meta_data->>'company_name' IS NOT NULL THEN
      v_company_name := u.raw_user_meta_data->>'company_name';
      v_base_slug    := lower(regexp_replace(v_company_name, '\W+', '-', 'g'));
      v_base_slug    := trim(both '-' from v_base_slug);
      IF v_base_slug = '' THEN v_base_slug := 'company'; END IF;

      v_slug    := v_base_slug;
      v_counter := 1;

      WHILE EXISTS(SELECT 1 FROM public.companies WHERE slug = v_slug) LOOP
        v_slug    := v_base_slug || '-' || v_counter;
        v_counter := v_counter + 1;
      END LOOP;

      INSERT INTO public.companies (name, slug)
      VALUES (v_company_name, v_slug)
      RETURNING id INTO v_company_id;

      RAISE NOTICE 'Created company: % (slug: %, id: %)', v_company_name, v_slug, v_company_id;
    END IF;

    -- Insert profile
    INSERT INTO public.profiles (id, company_id, full_name, email, role)
    VALUES (
      u.id,
      v_company_id,
      COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
      u.email,
      COALESCE(u.raw_user_meta_data->>'role', 'hr')
    );

    RAISE NOTICE 'Created profile for: %', u.email;
  END LOOP;
END;
$$;

-- 3. Verifikasi hasilnya
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.company_id,
  c.name  AS company_name,
  c.slug  AS company_slug
FROM public.profiles p
LEFT JOIN public.companies c ON c.id = p.company_id;
