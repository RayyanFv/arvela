ALTER TABLE public.interview_templates ADD COLUMN IF NOT EXISTS scorecard_criteria jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS session_scorecard jsonb DEFAULT '{}'::jsonb;
