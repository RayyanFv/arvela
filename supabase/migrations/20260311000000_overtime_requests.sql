-- =============================================
-- Reset Data Lama (Hanya untuk Development)
-- =============================================
DROP TABLE IF EXISTS overtime_requests CASCADE;

-- =============================================
-- OVERTIME (LEMBUR) REQUESTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS overtime_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Overtime details
    overtime_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours NUMERIC(4,2) GENERATED ALWAYS AS (
        CASE 
            WHEN end_time < start_time THEN (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0) + 24.0
            ELSE EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0
        END
    ) STORED,
    reason TEXT NOT NULL,
    tasks_completed TEXT NOT NULL,


    -- Approval workflow
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_note TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_overtime_employee ON overtime_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_company ON overtime_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_overtime_status ON overtime_requests(status);
CREATE INDEX IF NOT EXISTS idx_overtime_date ON overtime_requests(overtime_date);

-- RLS Policies
ALTER TABLE overtime_requests ENABLE ROW LEVEL SECURITY;

-- Employees can view their own overtime requests
CREATE POLICY "employees_view_own_overtime"
    ON overtime_requests FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM employees WHERE profile_id = auth.uid()
        )
    );

-- Employees can insert their own overtime requests
CREATE POLICY "employees_insert_own_overtime"
    ON overtime_requests FOR INSERT
    WITH CHECK (
        employee_id IN (
            SELECT id FROM employees WHERE profile_id = auth.uid()
        )
    );

-- Employees can update their own PENDING overtime requests (e.g. cancel)
CREATE POLICY "employees_update_own_pending_overtime"
    ON overtime_requests FOR UPDATE
    USING (
        employee_id IN (
            SELECT id FROM employees WHERE profile_id = auth.uid()
        )
        AND status = 'pending'
    );

-- HR / Admin can view all overtime requests in their company
CREATE POLICY "admin_view_company_overtime"
    ON overtime_requests FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM profiles
            WHERE id = auth.uid()
            AND role IN ('hr', 'super_admin', 'hiring_manager', 'boss')
        )
    );

-- HR / Admin can update (approve/reject) overtime requests
CREATE POLICY "admin_update_company_overtime"
    ON overtime_requests FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM profiles
            WHERE id = auth.uid()
            AND role IN ('hr', 'super_admin', 'hiring_manager', 'boss')
        )
    );

-- HR / Admin can insert overtime on behalf of employees
CREATE POLICY "admin_insert_company_overtime"
    ON overtime_requests FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles
            WHERE id = auth.uid()
            AND role IN ('hr', 'super_admin', 'hiring_manager', 'boss')
        )
    );

-- HR / Admin can delete overtime requests
CREATE POLICY "admin_delete_company_overtime"
    ON overtime_requests FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM profiles
            WHERE id = auth.uid()
            AND role IN ('hr', 'super_admin', 'hiring_manager', 'boss')
        )
    );
