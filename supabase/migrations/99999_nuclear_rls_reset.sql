-- ════════════════════════════════════════════════════════════════════════
-- FINAL NUCLEAR RLS RESET v3
-- Uses DO block to dynamically drop ALL policies regardless of name
-- ════════════════════════════════════════════════════════════════════════

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │ STEP 1: Add missing columns                                        │
-- └──────────────────────────────────────────────────────────────────────┘
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS office_lat double precision;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS office_lng double precision;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS office_radius_meters integer;

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │ STEP 2: SECURITY DEFINER helper functions                          │
-- └──────────────────────────────────────────────────────────────────────┘
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.my_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COALESCE(
        (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1),
        'user'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT public.my_role() IN ('super_admin', 'owner', 'hr_admin');
$$;

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │ STEP 3: DROP *ALL* POLICIES on every table (dynamic, no guessing)  │
-- └──────────────────────────────────────────────────────────────────────┘
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
            'profiles', 'companies', 'jobs', 'applications',
            'employees', 'assessments', 'okrs', 'key_results', 'initiatives',
            'overtime_requests', 'attendances', 'leave_types', 'leave_balances', 'attendance_requests',
            'lms_courses', 'lms_course_assignments', 'course_modules',
            'interviews', 'interview_scorecards', 'assessment_submissions',
            'onboarding_templates', 'onboarding_tasks', 'onboarding_progress',
            'shifts', 'shift_days', 'employee_shifts', 'schedules',
            'company_holidays', 'offer_letters', 'lms_certificates'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END
$$;

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │ STEP 4: Create fresh policies (all using SECURITY DEFINER funcs)   │
-- └──────────────────────────────────────────────────────────────────────┘

-- ═══ PROFILES ═══
CREATE POLICY "p_select" ON public.profiles
FOR SELECT USING (company_id = public.get_my_company_id());

CREATE POLICY "p_update" ON public.profiles
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "p_insert" ON public.profiles
FOR INSERT WITH CHECK (public.is_admin());

-- ═══ COMPANIES ═══
CREATE POLICY "c_select" ON public.companies
FOR SELECT USING (id = public.get_my_company_id());

CREATE POLICY "c_update" ON public.companies
FOR UPDATE USING (id = public.get_my_company_id() AND public.is_admin());

CREATE POLICY "c_insert" ON public.companies
FOR INSERT WITH CHECK (public.is_admin());

-- ═══ JOBS ═══
CREATE POLICY "j_public" ON public.jobs
FOR SELECT USING (status = 'published');

CREATE POLICY "j_admin_s" ON public.jobs
FOR SELECT USING (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "j_admin_i" ON public.jobs
FOR INSERT WITH CHECK (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "j_admin_u" ON public.jobs
FOR UPDATE USING (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "j_admin_d" ON public.jobs
FOR DELETE USING (public.is_admin() AND company_id = public.get_my_company_id());

-- ═══ APPLICATIONS ═══
CREATE POLICY "a_admin_s" ON public.applications
FOR SELECT USING (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "a_admin_u" ON public.applications
FOR UPDATE USING (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "a_cand_s" ON public.applications
FOR SELECT USING (email = (auth.jwt() ->> 'email'));

CREATE POLICY "a_pub_i" ON public.applications
FOR INSERT WITH CHECK (true);

-- ═══ EMPLOYEES ═══
CREATE POLICY "e_admin" ON public.employees
FOR ALL USING (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "e_self" ON public.employees
FOR SELECT USING (profile_id = auth.uid());

-- ═══ ASSESSMENTS ═══
CREATE POLICY "as_admin" ON public.assessments
FOR ALL USING (public.is_admin() AND company_id = public.get_my_company_id());

-- ═══ OKRs ═══
CREATE POLICY "o_admin" ON public.okrs
FOR ALL USING (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "o_emp" ON public.okrs
FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);

-- ═══ OVERTIME ═══
CREATE POLICY "ot_admin" ON public.overtime_requests
FOR ALL USING (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "ot_emp_s" ON public.overtime_requests
FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);

CREATE POLICY "ot_emp_i" ON public.overtime_requests
FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);

-- ═══ ATTENDANCES ═══
CREATE POLICY "att_admin" ON public.attendances
FOR ALL USING (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "att_emp_s" ON public.attendances
FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);

CREATE POLICY "att_emp_i" ON public.attendances
FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);

CREATE POLICY "att_emp_u" ON public.attendances
FOR UPDATE USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);

-- ═══ INTERVIEWS ═══
CREATE POLICY "int_admin_all" ON public.interviews
FOR ALL 
USING (public.is_admin() AND company_id = public.get_my_company_id())
WITH CHECK (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "int_cand_s" ON public.interviews
FOR SELECT USING (
    application_id IN (
        SELECT id FROM public.applications WHERE email = (auth.jwt() ->> 'email')
    )
);

-- ═══ INTERVIEW SCORECARDS ═══
CREATE POLICY "isc_admin_all" ON public.interview_scorecards
FOR ALL 
USING (
    public.is_admin() AND 
    application_id IN (SELECT id FROM public.applications WHERE company_id = public.get_my_company_id())
)
WITH CHECK (
    public.is_admin() AND 
    application_id IN (SELECT id FROM public.applications WHERE company_id = public.get_my_company_id())
);

CREATE POLICY "isc_cand_s" ON public.interview_scorecards
FOR SELECT USING (
    application_id IN (SELECT id FROM public.applications WHERE email = (auth.jwt() ->> 'email'))
);

-- ═══ LMS COURSES ═══
CREATE POLICY "lms_admin_all" ON public.lms_courses
FOR ALL USING (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "lms_emp_s" ON public.lms_courses
FOR SELECT USING (
    id IN (SELECT course_id FROM public.lms_course_assignments WHERE employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()))
);

CREATE POLICY "lms_pub_s" ON public.lms_courses
FOR SELECT USING (status = 'published');

-- ═══ LMS COURSE ASSIGNMENTS ═══
CREATE POLICY "lms_asn_admin" ON public.lms_course_assignments
FOR ALL USING (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "lms_asn_emp" ON public.lms_course_assignments
FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);

-- ═══ KEY RESULTS (OKRs) ═══
CREATE POLICY "kr_admin" ON public.key_results
FOR ALL 
USING (public.is_admin() AND okr_id IN (SELECT id FROM public.okrs WHERE company_id = public.get_my_company_id()))
WITH CHECK (public.is_admin() AND okr_id IN (SELECT id FROM public.okrs WHERE company_id = public.get_my_company_id()));

CREATE POLICY "kr_emp" ON public.key_results
FOR SELECT USING (
    okr_id IN (
        SELECT id FROM public.okrs 
        WHERE employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
    )
);

CREATE POLICY "kr_emp_u" ON public.key_results
FOR UPDATE USING (
    okr_id IN (
        SELECT id FROM public.okrs 
        WHERE employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
    )
);

-- ═══ SHIFTS ═══
CREATE POLICY "sh_admin" ON public.shifts
FOR ALL 
USING (public.is_admin() AND company_id = public.get_my_company_id())
WITH CHECK (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "sh_select" ON public.shifts
FOR SELECT USING (company_id = public.get_my_company_id());

-- ═══ SCHEDULES ═══
CREATE POLICY "sc_admin" ON public.schedules
FOR ALL 
USING (
    public.is_admin() AND 
    shift_id IN (SELECT id FROM public.shifts WHERE company_id = public.get_my_company_id())
)
WITH CHECK (
    public.is_admin() AND 
    shift_id IN (SELECT id FROM public.shifts WHERE company_id = public.get_my_company_id())
);

CREATE POLICY "sc_emp" ON public.schedules
FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);

-- ═══ ONBOARDING TEMPLATES ═══
CREATE POLICY "otm_admin" ON public.onboarding_templates
FOR ALL 
USING (public.is_admin() AND company_id = public.get_my_company_id())
WITH CHECK (public.is_admin() AND company_id = public.get_my_company_id());

-- ═══ ONBOARDING TASKS ═══
CREATE POLICY "ots_admin" ON public.onboarding_tasks
FOR ALL 
USING (
    public.is_admin() AND 
    template_id IN (SELECT id FROM public.onboarding_templates WHERE company_id = public.get_my_company_id())
)
WITH CHECK (
    public.is_admin() AND 
    template_id IN (SELECT id FROM public.onboarding_templates WHERE company_id = public.get_my_company_id())
);

-- ═══ ONBOARDING PROGRESS ═══
CREATE POLICY "op_admin" ON public.onboarding_progress
FOR ALL 
USING (
    public.is_admin() AND 
    employee_id IN (SELECT id FROM public.employees WHERE company_id = public.get_my_company_id())
)
WITH CHECK (
    public.is_admin() AND 
    employee_id IN (SELECT id FROM public.employees WHERE company_id = public.get_my_company_id())
);

CREATE POLICY "op_emp" ON public.onboarding_progress
FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);

CREATE POLICY "op_emp_u" ON public.onboarding_progress
FOR UPDATE USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);

-- ═══ INITIATIVES ═══
CREATE POLICY "init_admin" ON public.initiatives
FOR ALL 
USING (public.is_admin() AND okr_id IN (SELECT id FROM public.okrs WHERE company_id = public.get_my_company_id()))
WITH CHECK (public.is_admin() AND okr_id IN (SELECT id FROM public.okrs WHERE company_id = public.get_my_company_id()));

CREATE POLICY "init_select" ON public.initiatives
FOR SELECT USING (okr_id IN (SELECT id FROM public.okrs WHERE company_id = public.get_my_company_id()));

-- ═══ LEAVE TYPES ═══
CREATE POLICY "lt_admin" ON public.leave_types
FOR ALL 
USING (public.is_admin() AND company_id = public.get_my_company_id())
WITH CHECK (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "lt_select" ON public.leave_types
FOR SELECT USING (company_id = public.get_my_company_id());

-- ═══ LEAVE BALANCES ═══
CREATE POLICY "lb_admin" ON public.leave_balances
FOR ALL 
USING (public.is_admin() AND company_id = public.get_my_company_id())
WITH CHECK (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "lb_emp" ON public.leave_balances
FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);

-- ═══ ATTENDANCE REQUESTS (Leave, Sick, etc) ═══
CREATE POLICY "ar_admin" ON public.attendance_requests
FOR ALL 
USING (public.is_admin() AND company_id = public.get_my_company_id())
WITH CHECK (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "ar_emp" ON public.attendance_requests
FOR ALL 
USING (employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()))
WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()));

-- ═══ COMPANY HOLIDAYS ═══
CREATE POLICY "hol_admin" ON public.company_holidays
FOR ALL 
USING (public.is_admin() AND company_id = public.get_my_company_id())
WITH CHECK (public.is_admin() AND company_id = public.get_my_company_id());

CREATE POLICY "hol_select" ON public.company_holidays
FOR SELECT USING (company_id = public.get_my_company_id());

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │ STEP 5: Explicitly GRANT baseline permissions                      │
-- │ Ensures that PostgreSQL doesn't block queries before RLS evaluates │
-- └──────────────────────────────────────────────────────────────────────┘
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ┌──────────────────────────────────────────────────────────────────────┐
-- │ STEP 6: Reload schema cache                                        │
-- └──────────────────────────────────────────────────────────────────────┘
NOTIFY pgrst, 'reload schema';
