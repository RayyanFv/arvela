-- ═════════════════════════════════════════════════════════════
-- Arvela Role Revamp Migration
-- Old roles: hr, super_admin, hiring_manager, boss, employee, candidate, user
-- New roles: super_admin, owner, hr_admin, employee, candidate, user
-- ═════════════════════════════════════════════════════════════

-- 1. Migrate existing role values
UPDATE profiles SET role = 'hr_admin' WHERE role = 'hr';
UPDATE profiles SET role = 'owner' WHERE role = 'boss';
UPDATE profiles SET role = 'hr_admin' WHERE role = 'hiring_manager';

-- Also update auth.users metadata to stay in sync
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"hr_admin"')
WHERE raw_user_meta_data->>'role' = 'hr';

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"owner"')
WHERE raw_user_meta_data->>'role' = 'boss';

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"hr_admin"')
WHERE raw_user_meta_data->>'role' = 'hiring_manager';


-- 2. Update the helper function for RLS to use new role names
CREATE OR REPLACE FUNCTION my_company_id() RETURNS uuid AS $$
    SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
CREATE OR REPLACE FUNCTION my_role() RETURNS text AS $$
    SELECT COALESCE(
        (SELECT role FROM profiles WHERE id = auth.uid()),
        'user'
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- 3. Recreate RLS helper: check if user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
    SELECT my_role() IN ('super_admin', 'owner', 'hr_admin')
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- 4. Strengthen RLS policies (replace old role references)

-- ─── PROFILES ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view company profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update company profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admin can view company profiles" ON profiles
    FOR SELECT USING (
        is_admin() AND company_id = my_company_id()
    );

CREATE POLICY "Users can update own non-role fields" ON profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admin can update company profiles" ON profiles
    FOR UPDATE USING (
        is_admin() AND company_id = my_company_id()
    );


-- ─── JOBS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manages jobs" ON jobs;
DROP POLICY IF EXISTS "Anyone can view published jobs" ON jobs;

CREATE POLICY "Admin manages jobs" ON jobs
    FOR ALL USING (
        is_admin() AND company_id = my_company_id()
    );

CREATE POLICY "Anyone can view published jobs" ON jobs
    FOR SELECT USING (status = 'published');


-- ─── APPLICATIONS ─────────────────────────────────────────
DROP POLICY IF EXISTS "Admin view company applications" ON applications;
DROP POLICY IF EXISTS "Admin update company applications" ON applications;
DROP POLICY IF EXISTS "Candidates view own applications" ON applications;
DROP POLICY IF EXISTS "Public can insert applications" ON applications;

CREATE POLICY "Admin view company applications" ON applications
    FOR SELECT USING (
        is_admin() AND company_id = my_company_id()
    );

CREATE POLICY "Admin update company applications" ON applications
    FOR UPDATE USING (
        is_admin() AND company_id = my_company_id()
    );

CREATE POLICY "Candidates view own applications" ON applications
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Public can insert applications" ON applications
    FOR INSERT WITH CHECK (true);


-- ─── EMPLOYEES ────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manages company employees" ON employees;
DROP POLICY IF EXISTS "Employee can view own record" ON employees;

CREATE POLICY "Admin manages company employees" ON employees
    FOR ALL USING (
        is_admin() AND company_id = my_company_id()
    );

CREATE POLICY "Employee can view own record" ON employees
    FOR SELECT USING (profile_id = auth.uid());


-- ─── ASSESSMENTS ──────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manages company assessments" ON assessments;

CREATE POLICY "Admin manages company assessments" ON assessments
    FOR ALL USING (
        is_admin() AND company_id = my_company_id()
    );


-- ─── OKRs ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manages company okrs" ON okrs;
DROP POLICY IF EXISTS "Employee can view own okrs" ON okrs;

CREATE POLICY "Admin manages company okrs" ON okrs
    FOR ALL USING (
        is_admin() AND company_id = my_company_id()
    );

CREATE POLICY "Employee can view own okrs" ON okrs
    FOR SELECT USING (
        employee_id IN (SELECT id FROM employees WHERE profile_id = auth.uid())
    );


-- ─── OVERTIME REQUESTS ────────────────────────────────────
DROP POLICY IF EXISTS "Admin manages overtime" ON overtime_requests;
DROP POLICY IF EXISTS "Employee views own overtime" ON overtime_requests;

CREATE POLICY "Admin manages overtime" ON overtime_requests
    FOR ALL USING (
        is_admin() AND company_id = my_company_id()
    );

CREATE POLICY "Employee views own overtime" ON overtime_requests
    FOR SELECT USING (
        employee_id IN (SELECT id FROM employees WHERE profile_id = auth.uid())
    );

CREATE POLICY "Employee inserts own overtime" ON overtime_requests
    FOR INSERT WITH CHECK (
        employee_id IN (SELECT id FROM employees WHERE profile_id = auth.uid())
    );
