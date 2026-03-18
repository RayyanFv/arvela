-- Migration v0.1: Training & Performance Correlation

-- =============================================================
-- 5. Training & Performance Correlation
-- =============================================================

CREATE TABLE IF NOT EXISTS public.trainings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    provider text,
    start_date date,
    end_date date,
    cost numeric DEFAULT 0,
    status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    certificate_url text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- KPI/Performance Logs
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    metric_name text NOT NULL, -- e.g. Sales, Code Quality, Task Completion
    value numeric NOT NULL,
    period date NOT NULL, -- The date represent the month/quarter e.g. 2024-03-01
    notes text,
    created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Polcies for Trainings
DROP POLICY IF EXISTS "HR can manage training logs" ON public.trainings;
CREATE POLICY "HR can manage training logs" ON public.trainings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
            AND company_id = trainings.company_id
        )
    );

DROP POLICY IF EXISTS "Employees can view own training" ON public.trainings;
CREATE POLICY "Employees can view own training" ON public.trainings
    FOR SELECT USING (employee_id = auth.uid());

-- Policies for Performance Metrics
DROP POLICY IF EXISTS "HR can manage performance metrics" ON public.performance_metrics;
CREATE POLICY "HR can manage performance metrics" ON public.performance_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
            AND company_id = performance_metrics.company_id
        )
    );

DROP POLICY IF EXISTS "Employees can view own metrics" ON public.performance_metrics;
CREATE POLICY "Employees can view own metrics" ON public.performance_metrics
    FOR SELECT USING (employee_id = auth.uid());

-- Indexing for performance queries
CREATE INDEX IF NOT EXISTS idx_perf_employee_period ON public.performance_metrics(employee_id, period);
CREATE INDEX IF NOT EXISTS idx_train_employee_dates ON public.trainings(employee_id, start_date);
