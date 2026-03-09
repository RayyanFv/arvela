-- Migration Fase 8.2 — Shift Days
-- Menambahkan kolom hari ke tabel shift

ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS days_of_week integer[] DEFAULT '{1,2,3,4,5}'; -- Default Senin-Jumat
