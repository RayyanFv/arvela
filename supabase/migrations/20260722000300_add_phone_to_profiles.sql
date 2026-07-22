-- Migration: Add phone field to profiles
-- Date: 2026-07-22
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
