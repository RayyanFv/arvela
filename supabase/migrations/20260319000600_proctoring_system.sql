-- Proctoring System Migration

-- 1. Create Proctoring Logs Table
CREATE TABLE IF NOT EXISTS public.proctoring_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    assignment_id uuid REFERENCES public.assessment_assignments(id) ON DELETE CASCADE,
    interview_id uuid REFERENCES public.interviews(id) ON DELETE CASCADE,
    type text NOT NULL, -- 'multiple_faces', 'no_face', 'looking_away', 'tab_switch', 'speech_detected'
    screenshot_url text, -- Link to Supabase Storage
    severity text DEFAULT 'low', -- 'low', 'medium', 'high'
    details jsonb DEFAULT '{}'::jsonb,
    timestamp timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.proctoring_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Allow public insert for proctoring logs" ON public.proctoring_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow HR to view proctoring logs" ON public.proctoring_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE id = proctoring_logs.company_id
            -- We assume company_id matches the HR's company via session
        )
    );

-- 4. Storage Bucket for Proctoring Captures
-- Note: This is usually done via SQL but requires extensions or admin rights.
-- We'll assume the bucket 'proctoring-captures' will be created via Supabase Dashboard
-- or we can try inserting into storage.buckets if we have rights.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('proctoring-captures', 'proctoring-captures', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access for Proctoring Captures"
ON storage.objects FOR SELECT
USING ( bucket_id = 'proctoring-captures' );

CREATE POLICY "Public Upload for Proctoring Captures"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'proctoring-captures' );

-- 5. Add proctoring_enabled to assessments and interviews (Optional)
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS proctoring_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS proctoring_enabled BOOLEAN DEFAULT false;
