-- Migration Fase 8 — Attendance & Daily Reports
-- Fokus: Presensi berbasis lokasi, waktu, dan foto (absensi)

CREATE TABLE IF NOT EXISTS public.attendances (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  company_id      uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  clock_in        timestamptz,
  clock_out       timestamptz,
  date            date        NOT NULL DEFAULT current_date,
  
  -- Location
  lat_in          numeric,
  lng_in          numeric,
  lat_out         numeric,
  lng_out         numeric,
  
  -- Face / Photo
  photo_in_url    text,
  photo_out_url   text,
  
  -- Reports
  daily_report    text,
  status          text        DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent', 'excused', 'early_leave')),
  
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,
  
  UNIQUE(employee_id, date)
);

-- Index
CREATE INDEX IF NOT EXISTS attendances_employee_date_idx ON public.attendances(employee_id, date);
CREATE INDEX IF NOT EXISTS attendances_company_date_idx ON public.attendances(company_id, date);

-- RLS
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can manage own attendance" ON public.attendances
  FOR ALL USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
  );

CREATE POLICY "HR can view all attendance in company" ON public.attendances
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'boss')
    )
  );

-- Function for clock in/out safely
CREATE OR REPLACE FUNCTION public.handle_attendance()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_attendance_update
  BEFORE UPDATE ON public.attendances
  FOR EACH ROW EXECUTE PROCEDURE public.handle_attendance();
