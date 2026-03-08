-- ─── Fix RLS Policies for Staff Access ───

-- 1. Give Employees SELECT access to Onboarding Tasks
-- They need this to see the title/description of the tasks in their progress tracker
DROP POLICY IF EXISTS "employee_view_own_assigned_tasks" ON public.onboarding_tasks;
CREATE POLICY "employee_view_own_assigned_tasks" ON public.onboarding_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.onboarding_progress p
            JOIN public.employees e ON e.id = p.employee_id
            WHERE p.task_id = onboarding_tasks.id AND e.profile_id = auth.uid()
        )
    );

-- 2. Give Employees SELECT access to LMS Courses
-- They need this to see course details they are enrolled in
DROP POLICY IF EXISTS "employee_view_enrolled_courses" ON public.lms_courses;
CREATE POLICY "employee_view_enrolled_courses" ON public.lms_courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.lms_course_assignments a
            JOIN public.employees e ON e.id = a.employee_id
            WHERE a.course_id = lms_courses.id AND e.profile_id = auth.uid()
        )
    );

-- 3. Strictly defined Onboarding Progress policies
DROP POLICY IF EXISTS "employee_manage_own_progress" ON public.onboarding_progress;
CREATE POLICY "employee_manage_own_progress" ON public.onboarding_progress
    FOR ALL 
    USING ( employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()) )
    WITH CHECK ( employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()) );

DROP POLICY IF EXISTS "hr_manage_company_progress" ON public.onboarding_progress;
CREATE POLICY "hr_manage_company_progress" ON public.onboarding_progress
    FOR ALL 
    USING (
        employee_id IN (
            SELECT e.id FROM public.employees e
            JOIN public.profiles p ON p.company_id = e.company_id
            WHERE p.id = auth.uid() AND p.role IN ('hr', 'super_admin')
        )
    )
    WITH CHECK (
        employee_id IN (
            SELECT e.id FROM public.employees e
            JOIN public.profiles p ON p.company_id = e.company_id
            WHERE p.id = auth.uid() AND p.role IN ('hr', 'super_admin')
        )
    );

-- 4. Strictly defined LMS Course Assignments policies
DROP POLICY IF EXISTS "Employees can see own assignments" ON public.lms_course_assignments;
CREATE POLICY "Employees can see own assignments" ON public.lms_course_assignments
    FOR ALL 
    USING (
        employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
    )
    WITH CHECK (
        employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
    );

DROP POLICY IF EXISTS "HR manage assignments" ON public.lms_course_assignments;
CREATE POLICY "HR manage assignments" ON public.lms_course_assignments
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.employees e ON e.company_id = p.company_id
            WHERE e.id = lms_course_assignments.employee_id AND p.id = auth.uid() AND p.role IN ('hr', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.employees e ON e.company_id = p.company_id
            WHERE e.id = lms_course_assignments.employee_id AND p.id = auth.uid() AND p.role IN ('hr', 'super_admin')
        )
    );
