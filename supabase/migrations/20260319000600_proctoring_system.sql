-- Proctoring System Migration (Robust Version)

-- 1. Ensure columns exist in proctoring_logs (Handling cases where table already existed)
ALTER TABLE public.proctoring_logs ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.proctoring_logs ADD COLUMN IF NOT EXISTS assignment_id uuid REFERENCES public.assessment_assignments(id) ON DELETE CASCADE;
ALTER TABLE public.proctoring_logs ADD COLUMN IF NOT EXISTS interview_id uuid REFERENCES public.interviews(id) ON DELETE CASCADE;
ALTER TABLE public.proctoring_logs ADD COLUMN IF NOT EXISTS type text; -- Renaming handled below if log_type exists
ALTER TABLE public.proctoring_logs ADD COLUMN IF NOT EXISTS screenshot_url text;
ALTER TABLE public.proctoring_logs ADD COLUMN IF NOT EXISTS severity text DEFAULT 'low';
ALTER TABLE public.proctoring_logs ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.proctoring_logs ADD COLUMN IF NOT EXISTS timestamp timestamptz DEFAULT now();

-- 2. Handle log_type to type migration if needed (If table was created by older v0.1_update)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='proctoring_logs' AND column_name='log_type') THEN
        ALTER TABLE public.proctoring_logs RENAME COLUMN log_type TO type;
    END IF;
END $$;

-- 3. Ensure RLS is active
ALTER TABLE public.proctoring_logs ENABLE ROW LEVEL SECURITY;

-- 4. Re-setup RLS Policies (Drop first to avoid "already exists" error)
DROP POLICY IF EXISTS "Allow public insert for proctoring logs" ON public.proctoring_logs;
DROP POLICY IF EXISTS "Allow HR to view proctoring logs" ON public.proctoring_logs;
DROP POLICY IF EXISTS "HR can view proctoring logs" ON public.proctoring_logs;
DROP POLICY IF EXISTS "Public cand insert proctoring logs" ON public.proctoring_logs;

CREATE POLICY "Allow public insert for proctoring logs" ON public.proctoring_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow HR to view proctoring logs" ON public.proctoring_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE id = proctoring_logs.company_id
        ) OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- 5. Storage Bucket for Proctoring Captures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('proctoring-captures', 'proctoring-captures', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access for Proctoring Captures" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload for Proctoring Captures" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

CREATE POLICY "Public Access for Proctoring Captures"
ON storage.objects FOR SELECT
USING ( bucket_id = 'proctoring-captures' );

CREATE POLICY "Public Upload for Proctoring Captures"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'proctoring-captures' );

-- 6. Add proctoring_enabled toggles to core tables
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS proctoring_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS proctoring_enabled BOOLEAN DEFAULT false;
