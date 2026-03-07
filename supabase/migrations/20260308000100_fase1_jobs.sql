-- =============================================================
-- Migration Fase 1 — Job Posting
-- Tabel: jobs
-- Jalankan setelah: 20260308000000_foundation.sql
-- =============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. TABEL JOBS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  title           text        NOT NULL,
  slug            text        NOT NULL,
  description     text,
  requirements    text,
  location        text,
  work_type       text        CHECK (work_type IN ('remote','hybrid','onsite')),
  employment_type text        CHECK (employment_type IN ('fulltime','parttime','contract','internship')),
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','published','closed')),
  deadline        date,
  published_at    timestamptz,
  closed_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);

-- ──────────────────────────────────────────────────────────────
-- 2. INDEX
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS jobs_company_id_idx ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx     ON public.jobs(status);
CREATE INDEX IF NOT EXISTS jobs_company_status_idx ON public.jobs(company_id, status);

-- ──────────────────────────────────────────────────────────────
-- 3. HELPER FUNCTION: auto slug dari title
-- Dipanggil dari server action sebelum INSERT/UPDATE
-- Contoh penggunaan di JS: lihat queries.md
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_job_slug(title text, company_id uuid)
RETURNS text
LANGUAGE plpgsql
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

-- ──────────────────────────────────────────────────────────────
-- 4. ENABLE RLS
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- PUBLIC: siapapun bisa baca job yang published (tanpa auth)
CREATE POLICY "Public can view published jobs" ON public.jobs
  FOR SELECT USING (status = 'published');

-- HR/super_admin: baca semua job milik company sendiri
CREATE POLICY "HR can view all company jobs" ON public.jobs
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin','hr','hiring_manager','boss')
    )
  );

-- HR/super_admin: INSERT
CREATE POLICY "HR can insert jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin','hr')
    )
  );

-- HR/super_admin: UPDATE
CREATE POLICY "HR can update jobs" ON public.jobs
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin','hr')
    )
  );

-- HR/super_admin: DELETE (hanya yang masih draft)
CREATE POLICY "HR can delete draft jobs" ON public.jobs
  FOR DELETE USING (
    status = 'draft' AND
    company_id IN (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin','hr')
    )
  );
