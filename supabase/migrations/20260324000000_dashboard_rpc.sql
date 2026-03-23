-- =============================================================
-- Migration: Dashboard RPC Functions
-- Offload heavy dashboard aggregations to the database
-- to eliminate client-side data processing bottlenecks
-- =============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. HR ADMIN DASHBOARD STATS
-- Combines 7 separate queries into 1 RPC call
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
    -- Active jobs (published)
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

    -- Total employees count
    'total_employees', (
      SELECT COUNT(*)::int FROM employees WHERE company_id = p_company_id
    ),

    -- Stage counts (aggregated in DB, not client-side)
    'stage_counts', (
      SELECT COALESCE(json_object_agg(stage, cnt), '{}'::json)
      FROM (
        SELECT stage, COUNT(*)::int AS cnt
        FROM applications
        WHERE company_id = p_company_id
        GROUP BY stage
      ) t
    ),

    -- Weekly applications (last 7 days, aggregated by date)
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

    -- Applicants per job (aggregated in DB)
    'job_applicant_counts', (
      SELECT COALESCE(json_object_agg(job_id, cnt), '{}'::json)
      FROM (
        SELECT job_id, COUNT(*)::int AS cnt
        FROM applications
        WHERE company_id = p_company_id
        GROUP BY job_id
      ) t
    ),

    -- Recent applications (only 6, with job title via join)
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

    -- Total applicants count
    'total_applicants', (
      SELECT COUNT(*)::int FROM applications WHERE company_id = p_company_id
    ),

    -- Total hired count
    'total_hired', (
      SELECT COUNT(*)::int FROM applications
      WHERE company_id = p_company_id AND stage = 'hired'
    ),

    -- OKR stats (avg progress, total count)
    'okr_stats', (
      SELECT json_build_object(
        'total', COUNT(*)::int,
        'avg_progress', COALESCE(ROUND(AVG(total_progress)::numeric), 0)::int
      )
      FROM okrs WHERE company_id = p_company_id
    ),

    -- LMS stats
    'lms_stats', (
      SELECT json_build_object(
        'courses', COUNT(*)::int,
        'published', COUNT(*) FILTER (WHERE status = 'published')::int
      )
      FROM lms_courses WHERE company_id = p_company_id
    ),

    -- Attendance today (aggregated by status)
    'attendance_today', (
      SELECT COALESCE(json_object_agg(status, cnt), '{}'::json)
      FROM (
        SELECT status, COUNT(*)::int AS cnt
        FROM attendances
        WHERE company_id = p_company_id AND date = CURRENT_DATE
        GROUP BY status
      ) t
    ),

    -- Overtime stats (aggregated)
    'overtime_stats', (
      SELECT json_build_object(
        'pending', COUNT(*) FILTER (WHERE status = 'pending')::int,
        'approved', COUNT(*) FILTER (WHERE status = 'approved')::int,
        'total_hours', COALESCE(
          ROUND(SUM(total_hours) FILTER (WHERE status = 'approved')::numeric, 1), 0
        )
      )
      FROM overtime_requests WHERE company_id = p_company_id
    )
  ) INTO result;

  RETURN result;
END;
$$;


-- ──────────────────────────────────────────────────────────────
-- 2. OWNER DASHBOARD STATS
-- Combines employee, OKR, and attendance queries
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_owner_dashboard_stats(p_company_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    -- Employee count + department breakdown
    'total_employees', (
      SELECT COUNT(*)::int FROM employees WHERE company_id = p_company_id
    ),
    'by_department', (
      SELECT COALESCE(json_agg(json_build_object(
        'name', COALESCE(department, 'General'),
        'value', cnt
      )), '[]'::json)
      FROM (
        SELECT COALESCE(department, 'General') AS department, COUNT(*)::int AS cnt
        FROM employees
        WHERE company_id = p_company_id
        GROUP BY COALESCE(department, 'General')
      ) t
    ),

    -- OKR average progress
    'okr_avg', (
      SELECT COALESCE(ROUND(AVG(total_progress)::numeric), 0)::int
      FROM okrs WHERE company_id = p_company_id
    ),

    -- Top performers (top 5 employees by OKR progress)
    'top_employees', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          p.full_name AS name,
          e.department AS dept,
          ROUND(AVG(o.total_progress)::numeric)::int AS avg
        FROM okrs o
        JOIN employees e ON e.id = o.employee_id
        JOIN profiles p ON p.id = e.profile_id
        WHERE o.company_id = p_company_id
        GROUP BY o.employee_id, p.full_name, e.department
        ORDER BY AVG(o.total_progress) DESC
        LIMIT 5
      ) t
    ),

    -- Attendance today
    'attendance_today', (
      SELECT json_build_object(
        'present', COUNT(*) FILTER (WHERE status IN ('present', 'early_leave', 'holiday_present'))::int,
        'absent', COUNT(*) FILTER (WHERE status NOT IN ('present', 'early_leave', 'holiday_present'))::int
      )
      FROM attendances
      WHERE company_id = p_company_id AND date = CURRENT_DATE
    )
  ) INTO result;

  RETURN result;
END;
$$;


-- ──────────────────────────────────────────────────────────────
-- 3. SUPER ADMIN DASHBOARD STATS
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats(p_company_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    -- Total profiles
    'total_profiles', (
      SELECT COUNT(*)::int FROM profiles WHERE company_id = p_company_id
    ),

    -- Total employees
    'total_employees', (
      SELECT COUNT(*)::int FROM employees WHERE company_id = p_company_id
    ),

    -- Role breakdown
    'roles', (
      SELECT COALESCE(json_object_agg(role, cnt), '{}'::json)
      FROM (
        SELECT COALESCE(role, 'user') AS role, COUNT(*)::int AS cnt
        FROM profiles
        WHERE company_id = p_company_id
        GROUP BY COALESCE(role, 'user')
      ) t
    ),

    -- Recent users (last 8)
    'recent_users', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT id, full_name, email, role, created_at
        FROM profiles
        WHERE company_id = p_company_id
        ORDER BY created_at DESC
        LIMIT 8
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;
