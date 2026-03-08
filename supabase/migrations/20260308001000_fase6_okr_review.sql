-- Migration Fase 6.2 — OKR Quarterly Review / Final Score
-- Menambahkan kolom review kuartal ke tabel okrs

ALTER TABLE public.okrs
  ADD COLUMN IF NOT EXISTS final_score    numeric   CHECK (final_score >= 0 AND final_score <= 100),
  ADD COLUMN IF NOT EXISTS hr_notes       text,
  ADD COLUMN IF NOT EXISTS rating         text      DEFAULT NULL CHECK (rating IN ('Exceeds', 'Meets', 'Below', 'Poor') OR rating IS NULL),
  ADD COLUMN IF NOT EXISTS reviewed_at    timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by    uuid      REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Employee dapat melihat review miliknya
CREATE POLICY IF NOT EXISTS "Employees can view own OKR reviews" ON public.okrs
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
  );
