-- ──────────────────────────────────────────────────
-- Migration : Interview Scorecard, LMS Certificate, & Template-based Onboarding
-- File      : supabase/migrations/20260308001200_scorecard_certificate.sql
-- ──────────────────────────────────────────────────

-- ─── 1. Interview Scorecard ───────────────────────
CREATE TABLE IF NOT EXISTS interview_scorecards (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    created_by      uuid REFERENCES profiles(id),
    score_communication   int CHECK (score_communication BETWEEN 1 AND 5),
    score_technical       int CHECK (score_technical BETWEEN 1 AND 5),
    score_problem_solving int CHECK (score_problem_solving BETWEEN 1 AND 5),
    score_culture_fit     int CHECK (score_culture_fit BETWEEN 1 AND 5),
    score_leadership      int CHECK (score_leadership BETWEEN 1 AND 5),
    total_score     numeric GENERATED ALWAYS AS (
        (COALESCE(score_communication,0) + COALESCE(score_technical,0) +
         COALESCE(score_problem_solving,0) + COALESCE(score_culture_fit,0) +
         COALESCE(score_leadership,0))::numeric / 5
    ) STORED,
    recommendation  text CHECK (recommendation IN ('Strong Yes', 'Yes', 'Maybe', 'No')),
    notes           text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

ALTER TABLE interview_scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_manage_scorecards" ON interview_scorecards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN applications a ON a.id = application_id
            JOIN jobs j ON j.id = a.job_id
            WHERE p.id = auth.uid()
            AND p.role IN ('hr', 'super_admin')
            AND j.company_id = p.company_id
        )
    );

-- ─── 2. LMS Certificate ───────────────────────────
CREATE TABLE IF NOT EXISTS lms_certificates (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    course_id       uuid NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
    issued_at       timestamptz DEFAULT now(),
    certificate_no  text UNIQUE DEFAULT 'ARVELA-' || upper(substring(gen_random_uuid()::text, 1, 8)),
    UNIQUE (employee_id, course_id)
);

ALTER TABLE lms_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_view_own_certs" ON lms_certificates
    FOR SELECT USING (
        EXISTS ( SELECT 1 FROM employees e WHERE e.id = employee_id AND e.profile_id = auth.uid() )
    );

CREATE POLICY "hr_view_company_certs" ON lms_certificates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN employees e ON e.id = employee_id
            WHERE p.id = auth.uid() AND p.role IN ('hr', 'super_admin') AND e.company_id = p.company_id
        )
    );

CREATE POLICY "employee_insert_own_cert" ON lms_certificates
    FOR INSERT WITH CHECK (
        EXISTS ( SELECT 1 FROM employees e WHERE e.id = employee_id AND e.profile_id = auth.uid() )
    );

-- ─── 3. Template-based Onboarding ──────────────────

-- a) Drop old flat table if exists to avoid conflict
DROP TABLE IF EXISTS onboarding_tasks CASCADE;

-- b) Onboarding Templates
CREATE TABLE IF NOT EXISTS onboarding_templates (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name            text NOT NULL,
    created_by      uuid REFERENCES profiles(id),
    created_at      timestamptz DEFAULT now()
);

-- c) Onboarding Tasks (Template Definitions)
CREATE TABLE IF NOT EXISTS onboarding_tasks (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     uuid NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
    title           text NOT NULL,
    description     text,
    due_days        int,
    order_index     int DEFAULT 0,
    created_at      timestamptz DEFAULT now()
);

-- d) Onboarding Progress (Employee Instances)
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    task_id         uuid NOT NULL REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
    is_completed    boolean DEFAULT false,
    completed_at    timestamptz,
    created_at      timestamptz DEFAULT now(),
    UNIQUE (employee_id, task_id)
);

-- e) RLS for Onboarding
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Templates: HR/Admin can do anything within company
CREATE POLICY "hr_manage_templates" ON onboarding_templates
    FOR ALL 
    USING (
        EXISTS ( SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('hr', 'super_admin') AND p.company_id = onboarding_templates.company_id )
    )
    WITH CHECK (
        EXISTS ( SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('hr', 'super_admin') AND p.company_id = onboarding_templates.company_id )
    );

-- Tasks: Inherit template access
CREATE POLICY "hr_manage_template_tasks" ON onboarding_tasks
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM onboarding_templates t
            JOIN profiles p ON p.company_id = t.company_id
            WHERE t.id = onboarding_tasks.template_id AND p.id = auth.uid() AND p.role IN ('hr', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM onboarding_templates t
            JOIN profiles p ON p.company_id = t.company_id
            WHERE t.id = onboarding_tasks.template_id AND p.id = auth.uid() AND p.role IN ('hr', 'super_admin')
        )
    );

-- Progress: Employee view/update own, HR manage all in company
CREATE POLICY "employee_manage_own_progress" ON onboarding_progress
    FOR ALL USING (
        EXISTS ( SELECT 1 FROM employees e WHERE e.id = employee_id AND e.profile_id = auth.uid() )
    );

CREATE POLICY "hr_manage_company_progress" ON onboarding_progress
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN employees e ON e.company_id = p.company_id
            WHERE e.id = onboarding_progress.employee_id AND p.id = auth.uid() AND p.role IN ('hr', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN employees e ON e.company_id = p.company_id
            WHERE e.id = onboarding_progress.employee_id AND p.id = auth.uid() AND p.role IN ('hr', 'super_admin')
        )
    );

-- ─── 4. Digital Offer Letter ──────────────────────
CREATE TABLE IF NOT EXISTS offer_letters (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    salary          numeric NOT NULL,
    start_date      date NOT NULL,
    expiry_date     date,
    content         text, -- HTML/Markdown content for the letter body
    signed_at       timestamptz,
    status          text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'expired')),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    UNIQUE (application_id)
);

ALTER TABLE offer_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_manage_offer_letters" ON offer_letters
    FOR ALL USING (
        EXISTS ( SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('hr', 'super_admin') AND p.company_id = offer_letters.company_id )
    )
    WITH CHECK (
        EXISTS ( SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('hr', 'super_admin') AND p.company_id = offer_letters.company_id )
    );

CREATE POLICY "candidate_view_own_offer" ON offer_letters
    FOR SELECT USING (
        EXISTS ( SELECT 1 FROM applications a WHERE a.id = application_id AND a.email IN (SELECT email FROM profiles WHERE id = auth.uid()) )
    );



