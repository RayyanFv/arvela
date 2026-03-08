-- Migration Fase 5B — Interviews Scheduling
CREATE TABLE IF NOT EXISTS public.interviews (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   uuid        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  company_id       uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scheduled_date   date        NOT NULL,
  scheduled_time   time        NOT NULL,
  duration_mins    integer     DEFAULT 60,
  format           text        DEFAULT 'online' CHECK (format IN ('online', 'offline')),
  location_link    text,
  status           text        DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'done', 'rescheduled', 'no_show', 'cancelled')),
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz
);

CREATE TABLE IF NOT EXISTS public.interview_interviewers (
  interview_id     uuid        NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  profile_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (interview_id, profile_id)
);

CREATE INDEX IF NOT EXISTS interviews_app_idx ON public.interviews(application_id);
CREATE INDEX IF NOT EXISTS interviews_comp_idx ON public.interviews(company_id);

-- Enable RLS
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_interviewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR/Admin can manage interviews" ON public.interviews
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'boss')
    )
  );

CREATE POLICY "HR/Admin can manage interviewers" ON public.interview_interviewers
  FOR ALL USING (
    interview_id IN (
      SELECT id FROM public.interviews
      WHERE company_id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('hr', 'super_admin', 'boss')
      )
    )
  );
