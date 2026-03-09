-- Migration Fase 8.1 — Attendance Master Data (Shifts & Schedules)
-- Fokus: Master data shift dan penugasan jadwal karyawan

-- 1. Master Tabel Shift
CREATE TABLE IF NOT EXISTS public.shifts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name            text        NOT NULL, -- Contoh: 'Shift Pagi', 'Shift Malam', 'Normal'
  clock_in_time   time        NOT NULL, -- Jam masuk
  clock_out_time  time        NOT NULL, -- Jam pulang
  late_threshold  integer     DEFAULT 0, -- Toleransi keterlambatan dalam menit
  is_active       boolean     DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz
);

-- 2. Master Tabel Jadwal Kerja (Shift Assignment)
-- Menghubungkan karyawan dengan shift pada hari tertentu atau rentang tanggal
CREATE TABLE IF NOT EXISTS public.schedules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shift_id        uuid        NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  day_of_week     integer     CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Minggu, 1=Senin, dst.
  specific_date   date,       -- Jika jadwal khusus untuk tanggal tertentu (lembur/shift fleksibel)
  created_at      timestamptz NOT NULL DEFAULT now(),
  
  -- Constraint: Gabungan employee_id dan day_of_week harus unik (satu hari satu shift default)
  -- ATAU employee_id dan specific_date harus unik (jika ada specific_date)
  UNIQUE(employee_id, day_of_week),
  CONSTRAINT exclusive_day_or_date CHECK (
    (day_of_week IS NOT NULL AND specific_date IS NULL) OR
    (day_of_week IS NULL AND specific_date IS NOT NULL)
  )
);

-- 3. Update Tabel Attendances untuk referensi Shift
ALTER TABLE public.attendances 
ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS schedule_id uuid REFERENCES public.schedules(id) ON DELETE SET NULL;

-- 4. RLS (Row Level Security)
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Shifts Policies
CREATE POLICY "Users can view shifts in their company" ON public.shifts
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "HR can manage shifts" ON public.shifts
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin'))
  );

-- Schedules Policies
CREATE POLICY "Employees can view own schedule" ON public.schedules
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
  );

CREATE POLICY "HR can manage schedules" ON public.schedules
  FOR ALL USING (
    employee_id IN (
      SELECT e.id FROM public.employees e
      JOIN public.profiles p ON p.company_id = e.company_id
      WHERE p.id = auth.uid() AND p.role IN ('hr', 'super_admin')
    )
  );

-- Indexing
CREATE INDEX IF NOT EXISTS shifts_company_id_idx ON public.shifts(company_id);
CREATE INDEX IF NOT EXISTS schedules_employee_id_idx ON public.schedules(employee_id);
CREATE INDEX IF NOT EXISTS schedules_day_idx ON public.schedules(day_of_week);
CREATE INDEX IF NOT EXISTS schedules_date_idx ON public.schedules(specific_date);
