-- Migration: Add Salary Fields to Jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_min numeric;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_max numeric;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_currency text DEFAULT 'IDR';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS show_salary boolean DEFAULT false;
