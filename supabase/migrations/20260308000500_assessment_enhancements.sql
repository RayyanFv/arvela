-- 1. Add show_score to assessments
ALTER TABLE assessments ADD COLUMN show_score BOOLEAN DEFAULT false;

-- 2. Add function to update answer points (for HR manual review)
CREATE OR REPLACE FUNCTION update_answer_score(p_answer_id UUID, p_points INTEGER, p_notes TEXT)
RETURNS VOID AS 
BEGIN
    UPDATE answers 
    SET points_earned = p_points, reviewer_notes = p_notes, is_reviewed = true
    WHERE id = p_answer_id;

    -- Recalculate and sync total_score in assignment
    UPDATE assessment_assignments
    SET total_score = (
        SELECT sum(points_earned) 
        FROM answers 
        WHERE assignment_id = assessment_assignments.id
    )
    WHERE id = (
        SELECT assignment_id FROM answers WHERE id = p_answer_id
    );
END;
 LANGUAGE plpgsql SECURITY DEFINER;
