-- Migration 0.3 - Foundation
-- Buat table companies
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  logo_url text,
  industry text,
  size text,
  website text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Buat table profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  department text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS profiles_company_id_idx ON public.profiles(company_id);

-- Trigger auto-create profiles
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
  -- If new user has company_id (i.e. invited), use it
  IF new.raw_user_meta_data->>'company_id' IS NOT NULL THEN
    v_company_id := (new.raw_user_meta_data->>'company_id')::uuid;
  -- If new user has company_name (i.e. self-register), create company
  ELSIF new.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    v_company_name := new.raw_user_meta_data->>'company_name';
    v_base_slug := lower(regexp_replace(v_company_name, '\W+', '-', 'g'));
    -- Trim trailing and leading dashes
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
  END IF;

  -- Create profile
  INSERT INTO public.profiles (
    id,
    company_id,
    full_name,
    email,
    role
  ) VALUES (
    new.id,
    v_company_id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'hr')
  );

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policy companies: SELECT hanya untuk company_id yang sama
CREATE POLICY "Users can view their own company" ON public.companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Super admins can insert companies" ON public.companies
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Super admins can update companies" ON public.companies
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- RLS policy profiles: SELECT hanya dalam company_id yang sama
CREATE POLICY "Users can view profiles in their company" ON public.profiles
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );
