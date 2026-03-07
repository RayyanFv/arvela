-- Mengizinkan kandidat untuk melihat lamaran mereka sendiri (berdasarkan email)
CREATE POLICY "Candidates can view own applications" ON public.applications
  FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Mengizinkan kandidat untuk melihat file company dan job mereka
CREATE POLICY "Candidates can view applied company" ON public.companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM public.applications WHERE email = current_setting('request.jwt.claims', true)::json->>'email' OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Candidates can view applied jobs" ON public.jobs
  FOR SELECT USING (
    id IN (SELECT job_id FROM public.applications WHERE email = current_setting('request.jwt.claims', true)::json->>'email' OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Karena kandidat juga akan dibuatkan profile jika pertama kali login OTP (lewat trigger handle_new_user yang kita buat), kita harus pastikan handle_new_user tidak error jika company_id dan company_name tidak ada!
-- Mari kita update handle_new_user agar jika tidak ada company, maka dibuatkan profiles dengan role 'candidate'

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_company_name text;
  v_slug text;
  v_base_slug text;
  v_counter integer;
BEGIN
  -- If new user has company_id (i.e. invited HR), use it
  IF new.raw_user_meta_data->>'company_id' IS NOT NULL THEN
    v_company_id := (new.raw_user_meta_data->>'company_id')::uuid;
    
    INSERT INTO public.profiles (id, company_id, full_name, email, role)
    VALUES (
      new.id,
      v_company_id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'MEMBER HR'),
      new.email,
      COALESCE(new.raw_user_meta_data->>'role', 'hr')
    );

  -- If new user has company_name (i.e. self-register via /register HR), create company
  ELSIF new.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    v_company_name := new.raw_user_meta_data->>'company_name';
    v_base_slug := lower(regexp_replace(v_company_name, '\W+', '-', 'g'));
    v_base_slug := trim(both '-' from v_base_slug);
    IF v_base_slug = '' THEN
      v_base_slug := 'company';
    END IF;
    v_slug := v_base_slug;
    v_counter := 1;
    
    WHILE EXISTS(SELECT 1 FROM public.companies WHERE slug = v_slug) LOOP
      v_slug := v_base_slug || '-' || v_counter;
      v_counter := v_counter + 1;
    END LOOP;

    INSERT INTO public.companies (name, slug)
    VALUES (v_company_name, v_slug)
    RETURNING id INTO v_company_id;

    INSERT INTO public.profiles (id, company_id, full_name, email, role)
    VALUES (
      new.id,
      v_company_id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'ADMIN HR'),
      new.email,
      'super_admin'
    );
    
  ELSE
    -- JIKA TIDAK ADA METADATA COMPANY (berarti ini login public candidate via Magic Link OTP)
    INSERT INTO public.profiles (id, company_id, full_name, email, role)
    VALUES (
      new.id,
      NULL,
      COALESCE(new.raw_user_meta_data->>'full_name', new.email),
      new.email,
      'candidate'
    );
  END IF;

  RETURN NEW;
END;
$$;
