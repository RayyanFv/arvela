-- Migration Fase 9 — Time, Attendance & Complex Leave Management

-- Drop the restrictive CHECK constraint on attendances status to allow new statuses like 'holiday_present', 'sick', 'leave', etc.
ALTER TABLE public.attendances DROP CONSTRAINT IF EXISTS attendances_status_check;

-- Optional: Re-add it with more statuses or just leave it open for backend business logic.
-- Let's leave it open since enums can change rapidly in HR ops. (But I will add a comment)
-- Expected statuses: 'present', 'late', 'absent', 'excused', 'early_leave', 'holiday_present', 'sick', 'annual_leave', 'unpaid_leave', etc.

--------------------------------------------------------------------------------
-- 1. Company Holidays (Hari Libur Nasional & Perusahaan)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_holidays (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    date date NOT NULL,
    name text NOT NULL,
    is_national boolean DEFAULT false, -- Jika turunan dari kalender libur nasional
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, date)
);

CREATE POLICY "Users can view holidays in their company" ON public.company_holidays
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

--------------------------------------------------------------------------------
-- 2. Leave Types (Master data untuk tipe cuti & izin)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leave_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,             -- e.g., 'Cuti Tahunan', 'Sakit', 'Melahirkan'
    code text NOT NULL,             -- e.g., 'ANNUAL', 'SICK', 'MATERNITY', 'UNPAID'
    is_paid boolean DEFAULT true,
    requires_attachment boolean DEFAULT false,
    deducts_annual_leave boolean DEFAULT false,
    max_days_per_year integer,      -- NULL = unlimited (e.g. sick if unconstrained)
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, code)
);

CREATE POLICY "Users can view leave types in their company" ON public.leave_types
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

--------------------------------------------------------------------------------
-- 3. Leave Balances (Saldo Cuti per Karyawan per Tahun)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leave_balances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
    year integer NOT NULL,
    balance integer NOT NULL DEFAULT 0, -- Sisa Kuota
    used integer NOT NULL DEFAULT 0,    -- Yang sudah terpakai
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(employee_id, leave_type_id, year)
);

CREATE POLICY "Employees can view own balances" ON public.leave_balances
    FOR SELECT USING (
        employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()) OR
        company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'owner'))
    );

--------------------------------------------------------------------------------
-- 4. Attendance Requests (Pengajuan Cuti, Izin, Sakit, Pulang Cepat, Lupa Absen)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    type text NOT NULL,                 -- 'LEAVE', 'SICK', 'PERMISSION', 'CORRECTION', 'EARLY_LEAVE'
    leave_type_id uuid REFERENCES public.leave_types(id) ON DELETE SET NULL, -- Required if type == 'LEAVE' or deducts logic
    start_date date NOT NULL,
    end_date date NOT NULL,
    time_in timestamptz,                -- Used for 'CORRECTION'
    time_out timestamptz,               -- Used for 'CORRECTION' / 'EARLY_LEAVE'
    reason text NOT NULL,
    attachment_url text,
    status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    approved_by uuid REFERENCES public.employees(id) ON DELETE SET NULL, -- Line manager/HR yang approve
    approved_at timestamptz,
    rejection_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE POLICY "Employees can view/manage own requests" ON public.attendance_requests
    FOR ALL USING (
        employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
    );

CREATE POLICY "Approvers/HR can manage requests" ON public.attendance_requests
    FOR ALL USING (
        company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'owner', 'manager'))
    );

-- Enable RLS
ALTER TABLE public.company_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_requests ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
-- (Using the exisiting public.handle_attendance() trigger function which just updates 'updated_at')
CREATE TRIGGER on_leave_balances_update 
    BEFORE UPDATE ON public.leave_balances 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_attendance();

CREATE TRIGGER on_attendance_requests_update 
    BEFORE UPDATE ON public.attendance_requests 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_attendance();
