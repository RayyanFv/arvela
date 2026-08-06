-- =============================================================
-- Migration: Dashboard Revamp v2
-- Adds date_of_birth to profiles, and extends dashboard RPCs with
-- leave balance summary + "who's off this week" data.
-- =============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;

-- ──────────────────────────────────────────────────────────────
-- Extend HR Admin dashboard stats: leave balance summary + who's off
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_hr_dashboard_stats(p_company_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'active_jobs', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', j.id,
        'title', j.title,
        'work_type', j.work_type,
        'location', j.location
      ) ORDER BY j.created_at DESC), '[]'::json)
      FROM jobs j
      WHERE j.company_id = p_company_id AND j.status = 'published'
    ),

    'total_employees', (
      SELECT COUNT(*)::int FROM employees WHERE company_id = p_company_id
    ),

    'stage_counts', (
      SELECT COALESCE(json_object_agg(stage, cnt), '{}'::json)
      FROM (
        SELECT stage, COUNT(*)::int AS cnt
        FROM applications
        WHERE company_id = p_company_id
        GROUP BY stage
      ) t
    ),

    'weekly_apps', (
      SELECT COALESCE(json_agg(json_build_object(
        'date', d::text,
        'count', COALESCE(cnt, 0)
      ) ORDER BY d), '[]'::json)
      FROM generate_series(
        (CURRENT_DATE - INTERVAL '6 days')::date,
        CURRENT_DATE::date,
        '1 day'::interval
      ) AS d
      LEFT JOIN (
        SELECT created_at::date AS app_date, COUNT(*)::int AS cnt
        FROM applications
        WHERE company_id = p_company_id
          AND created_at >= (CURRENT_DATE - INTERVAL '6 days')
        GROUP BY created_at::date
      ) app ON app.app_date = d::date
    ),

    'job_applicant_counts', (
      SELECT COALESCE(json_object_agg(job_id, cnt), '{}'::json)
      FROM (
        SELECT job_id, COUNT(*)::int AS cnt
        FROM applications
        WHERE company_id = p_company_id
        GROUP BY job_id
      ) t
    ),

    'recent_apps', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json)
      FROM (
        SELECT a.id, a.job_id, a.stage, a.created_at, a.full_name,
               json_build_object('id', j.id, 'title', j.title) AS jobs
        FROM applications a
        LEFT JOIN jobs j ON j.id = a.job_id
        WHERE a.company_id = p_company_id
        ORDER BY a.created_at DESC
        LIMIT 6
      ) t
    ),

    'total_applicants', (
      SELECT COUNT(*)::int FROM applications WHERE company_id = p_company_id
    ),

    'total_hired', (
      SELECT COUNT(*)::int FROM applications
      WHERE company_id = p_company_id AND stage = 'hired'
    ),

    'okr_stats', (
      SELECT json_build_object(
        'total', COUNT(*)::int,
        'avg_progress', COALESCE(ROUND(AVG(total_progress)::numeric), 0)::int
      )
      FROM okrs WHERE company_id = p_company_id
    ),

    'lms_stats', (
      SELECT json_build_object(
        'courses', COUNT(*)::int,
        'published', COUNT(*) FILTER (WHERE status = 'published')::int
      )
      FROM lms_courses WHERE company_id = p_company_id
    ),

    'attendance_today', (
      SELECT COALESCE(json_object_agg(status, cnt), '{}'::json)
      FROM (
        SELECT status, COUNT(*)::int AS cnt
        FROM attendances
        WHERE company_id = p_company_id AND date = CURRENT_DATE
        GROUP BY status
      ) t
    ),

    'overtime_stats', (
      SELECT json_build_object(
        'pending', COUNT(*) FILTER (WHERE status = 'pending')::int,
        'approved', COUNT(*) FILTER (WHERE status = 'approved')::int,
        'total_hours', COALESCE(
          ROUND(SUM(total_hours) FILTER (WHERE status = 'approved')::numeric, 1), 0
        )
      )
      FROM overtime_requests WHERE company_id = p_company_id
    ),

    -- NEW: who's off this week (approved LEAVE/SICK/PERMISSION requests overlapping current week)
    'whos_off', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.start_date), '[]'::json)
      FROM (
        SELECT
          ar.id,
          ar.start_date,
          ar.end_date,
          ar.type,
          p.full_name AS employee_name,
          p.avatar_url,
          COALESCE(lt.name, ar.type) AS reason_label
        FROM attendance_requests ar
        JOIN employees e ON e.id = ar.employee_id
        JOIN profiles p ON p.id = e.profile_id
        LEFT JOIN leave_types lt ON lt.id = ar.leave_type_id
        WHERE ar.company_id = p_company_id
          AND ar.status = 'APPROVED'
          AND ar.type IN ('LEAVE', 'SICK', 'PERMISSION')
          AND ar.start_date <= (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::date
          AND ar.end_date >= date_trunc('week', CURRENT_DATE)::date
        ORDER BY ar.start_date
        LIMIT 10
      ) t
    ),

    -- NEW: birthdays in the next 14 days
    'upcoming_birthdays', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT p.full_name AS employee_name, p.avatar_url, p.date_of_birth
        FROM profiles p
        JOIN employees e ON e.profile_id = p.id
        WHERE e.company_id = p_company_id
          AND p.date_of_birth IS NOT NULL
          AND (
            to_char(p.date_of_birth, 'MM-DD') BETWEEN to_char(CURRENT_DATE, 'MM-DD') AND to_char(CURRENT_DATE + INTERVAL '14 days', 'MM-DD')
            OR (
              -- year-wrap case (e.g. Dec 28 -> Jan 5)
              to_char(CURRENT_DATE, 'MM-DD') > to_char(CURRENT_DATE + INTERVAL '14 days', 'MM-DD')
              AND (to_char(p.date_of_birth, 'MM-DD') >= to_char(CURRENT_DATE, 'MM-DD') OR to_char(p.date_of_birth, 'MM-DD') <= to_char(CURRENT_DATE + INTERVAL '14 days', 'MM-DD'))
            )
          )
        LIMIT 10
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;
