-- Migration Phase 4: Assessment System

-- 1. Assessment Table
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Questions Table
CREATE TYPE question_type AS ENUM ('multiple_choice', 'essay', 'scale', 'situational');

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    type question_type NOT NULL DEFAULT 'multiple_choice',
    prompt TEXT NOT NULL,
    options JSONB, -- For multiple choice: ["A", "B", ...], for scale: {min: 1, max: 5}
    correct_answer TEXT, -- Optional, used for auto-scoring MC
    points INTEGER DEFAULT 10,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Assessment Assignments Table
CREATE TYPE assignment_status AS ENUM ('sent', 'started', 'completed', 'expired');

CREATE TABLE assessment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    status assignment_status NOT NULL DEFAULT 'sent',
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    total_score INTEGER DEFAULT 0,
    tab_switch_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure either application or employee is assigned
    CONSTRAINT assignment_target_check CHECK (
        (application_id IS NOT NULL) OR (employee_id IS NOT NULL)
    )
);

-- 4. Answers Table
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assessment_assignments(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    points_earned INTEGER DEFAULT 0,
    is_reviewed BOOLEAN DEFAULT true, -- false for essay until HR reviews
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- 1. Assessments
CREATE POLICY "Assessments access" ON assessments
    FOR ALL USING (company_id = my_company_id());

-- 2. Questions
CREATE POLICY "Questions access" ON questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assessments 
            WHERE assessments.id = questions.assessment_id 
            AND assessments.company_id = my_company_id()
        )
    );

-- 3. Assignments (HR side)
CREATE POLICY "Assignments HR access" ON assessment_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assessments 
            WHERE assessments.id = assessment_assignments.assessment_id 
            AND assessments.company_id = my_company_id()
        )
    );

-- 4. Assignments (Public side via Token)
CREATE POLICY "Assignments Public access" ON assessment_assignments
    FOR SELECT USING (true); -- We will filter by token in application logic

CREATE POLICY "Assignments Public update" ON assessment_assignments
    FOR UPDATE USING (true); -- We will filter by token in application logic

-- 5. Answers
CREATE POLICY "Answers HR access" ON answers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assessment_assignments a
            JOIN assessments ast ON ast.id = a.assessment_id
            WHERE a.id = answers.assignment_id 
            AND ast.company_id = my_company_id()
        )
    );

CREATE POLICY "Answers Public insert" ON answers
    FOR INSERT WITH CHECK (true); -- Filter by token in application logic

-- Indexes
CREATE INDEX idx_assessments_company ON assessments(company_id);
CREATE INDEX idx_questions_assessment ON questions(assessment_id);
CREATE INDEX idx_assignments_token ON assessment_assignments(token);
CREATE INDEX idx_assignments_app ON assessment_assignments(application_id);
CREATE INDEX idx_answers_assignment ON answers(assignment_id);
