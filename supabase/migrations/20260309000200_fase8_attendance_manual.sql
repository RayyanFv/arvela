-- Migration Fase 8.2 — Manual Attendance & Geofencing Support
ALTER TABLE public.attendances 
  ADD COLUMN is_manual boolean DEFAULT false,
  ADD COLUMN manual_reason text,
  ADD COLUMN approval_status text DEFAULT 'approved';

ALTER TABLE public.companies
  ADD COLUMN office_lat numeric(10, 8),
  ADD COLUMN office_lng numeric(11, 8),
  ADD COLUMN office_radius_meters integer DEFAULT 100;
