-- =============================================================
-- Migration Fase 2 — Kandidat Apply & Pipeline Tracking
-- Tabel: applications, stage_history
-- Jalankan setelah: 20260308000100_fase1_jobs.sql
-- =============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. TABEL APPLICATIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           uuid        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  company_id       uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  referral_id      uuid,                     -- diisi otomatis dari ?ref= param (FK ditambah saat QW1)
  full_name        text        NOT NULL,
  email            text        NOT NULL,
  phone            text,
  cv_url           text,                     -- Supabase Storage bucket 'cvs'
  cover_letter     text,
  portfolio_url    text,
  stage            text        NOT NULL DEFAULT 'applied'
                               CHECK (stage IN ('applied','screening','assessment','interview','offering','hired','rejected')),
  rejection_reason text,                     -- internal only, tidak dikirim ke kandidat
  internal_notes   text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz,
  UNIQUE (job_id, email)                     -- cegah double apply
);

CREATE INDEX IF NOT EXISTS applications_company_id_idx ON public.applications(company_id);
CREATE INDEX IF NOT EXISTS applications_job_id_idx     ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS applications_stage_idx      ON public.applications(stage);
CREATE INDEX IF NOT EXISTS applications_email_idx      ON public.applications(email);

-- ──────────────────────────────────────────────────────────────
-- 2. TABEL STAGE_HISTORY
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stage_history (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id       uuid        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  from_stage           text,                 -- null saat pertama kali apply
  to_stage             text        NOT NULL,
  changed_by           uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  message_to_candidate text,                 -- pesan custom yang dikirim ke kandidat via email
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stage_history_application_id_idx ON public.stage_history(application_id);

-- ──────────────────────────────────────────────────────────────
-- 3. TRIGGER: auto-INSERT stage_history saat applications.stage berubah
-- JANGAN insert stage_history manual dari aplikasi — selalu lewat trigger ini
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.stage IS DISTINCT FROM NEW.stage) THEN
    INSERT INTO public.stage_history (application_id, from_stage, to_stage, changed_by)
    VALUES (
      NEW.id,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.stage END,
      NEW.stage,
      auth.uid()
    );
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_stage_change ON public.applications;
CREATE TRIGGER on_stage_change
  AFTER INSERT OR UPDATE OF stage ON public.applications
  FOR EACH ROW EXECUTE PROCEDURE public.handle_stage_change();

-- ──────────────────────────────────────────────────────────────
-- 4. SUPABASE STORAGE: bucket cvs
-- Jalankan manual di Supabase Dashboard > Storage
-- atau via SQL seperti di bawah (butuh superuser/service role)
-- ──────────────────────────────────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('cvs', 'cvs', false)
-- ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 5. ENABLE RLS
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_history ENABLE ROW LEVEL SECURITY;

-- APPLICATIONS: public INSERT (kandidat apply tanpa auth)
CREATE POLICY "Public can insert applications" ON public.applications
  FOR INSERT WITH CHECK (true);

-- APPLICATIONS: HR/hiring_manager/boss baca semua aplikasi milik company
CREATE POLICY "HR can view company applications" ON public.applications
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin','hr','hiring_manager','boss')
    )
  );

-- APPLICATIONS: HR bisa update stage, notes, rejection_reason
CREATE POLICY "HR can update applications" ON public.applications
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin','hr','hiring_manager','boss')
    )
  );

-- APPLICATIONS: HR bisa delete (opsional, hati-hati)
CREATE POLICY "HR can delete applications" ON public.applications
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin','hr')
    )
  );

-- STAGE_HISTORY: HR/hiring_manager/boss SELECT
CREATE POLICY "HR can view stage history" ON public.stage_history
  FOR SELECT USING (
    application_id IN (
      SELECT id FROM public.applications
      WHERE company_id IN (
        SELECT company_id FROM public.profiles
        WHERE id = auth.uid() AND role IN ('super_admin','hr','hiring_manager','boss')
      )
    )
  );

-- STAGE_HISTORY: INSERT hanya via trigger (policy tertutup untuk user manual)
-- Trigger berjalan dengan SECURITY DEFINER sehingga bypass RLS
CREATE POLICY "Deny direct stage_history insert" ON public.stage_history
  FOR INSERT WITH CHECK (false);
