-- Migration: Assessment System v2.1 Enhancements

-- 1. Extend Assessment Table
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS 
  assessment_type TEXT DEFAULT 'custom' 
  CHECK (assessment_type IN ('custom', 'cognitive', 'personality', 'culture_fit', 'sjt', 'game_based'));

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS
  dimension_config JSONB DEFAULT NULL;

-- 2. Extend question_type ENUM
-- Note: Postgres doesn't easily allow adding to ENUM in a transaction sometimes, 
-- but Supabase usually handles it. If it fails, I'll use text for now.
-- For safety in migrations, we check if they exist or use a DO block.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'multiple_select') THEN
        ALTER TYPE question_type ADD VALUE 'multiple_select';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'ranking') THEN
        ALTER TYPE question_type ADD VALUE 'ranking';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'numeric_input') THEN
        ALTER TYPE question_type ADD VALUE 'numeric_input';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'matrix') THEN
        ALTER TYPE question_type ADD VALUE 'matrix';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'question_type' AND e.enumlabel = 'game_task') THEN
        ALTER TYPE question_type ADD VALUE 'game_task';
    END IF;
END $$;

-- 3. Interpretation Tables
CREATE TABLE IF NOT EXISTS assessment_dimension_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_assignment_id UUID NOT NULL REFERENCES assessment_assignments(id) ON DELETE CASCADE,
  dimension_name TEXT NOT NULL,
  raw_score NUMERIC(5,2) NOT NULL,
  normalized_score NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_assignment_id, dimension_name)
);

CREATE TABLE IF NOT EXISTS assessment_interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_assignment_id UUID NOT NULL UNIQUE REFERENCES assessment_assignments(id) ON DELETE CASCADE,
  dominant_type TEXT,
  type_label TEXT,
  type_description TEXT,
  dimension_insights JSONB,
  overall_score NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS for new tables
ALTER TABLE assessment_dimension_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_interpretations ENABLE ROW LEVEL SECURITY;

-- HR side access (anyone in the same company)
CREATE POLICY "Dimension scores HR access" ON assessment_dimension_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assessment_assignments a
            JOIN assessments ast ON ast.id = a.assessment_id
            WHERE a.id = assessment_dimension_scores.assessment_assignment_id 
            AND ast.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Interpretations HR access" ON assessment_interpretations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assessment_assignments a
            JOIN assessments ast ON ast.id = a.assessment_id
            WHERE a.id = assessment_interpretations.assessment_assignment_id 
            AND ast.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
        )
    );

-- Public access (candidate via token check in app logic, but for SELECT we can allow if linked to their email via applications)
CREATE POLICY "Dimension scores Public access" ON assessment_dimension_scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assessment_assignments a
            JOIN applications app ON app.id = a.application_id
            WHERE a.id = assessment_dimension_scores.assessment_assignment_id 
            AND app.email = auth.jwt()->>'email'
        )
    );

CREATE POLICY "Interpretations Public access" ON assessment_interpretations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assessment_assignments a
            JOIN applications app ON app.id = a.application_id
            WHERE a.id = assessment_interpretations.assessment_assignment_id 
            AND app.email = auth.jwt()->>'email'
        )
    );

-- 5. Fix show_score column in assessments if not there
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS show_score BOOLEAN DEFAULT false;
ALTER TABLE assessment_assignments ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;
