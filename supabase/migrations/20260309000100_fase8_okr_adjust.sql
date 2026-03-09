-- Migration Fase 8.1 — Adjust OKR Progress to Integer
ALTER TABLE public.okrs
  ALTER COLUMN total_progress TYPE integer USING ROUND(total_progress)::integer;
