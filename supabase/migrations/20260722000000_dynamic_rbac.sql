-- Migration: Dynamic RBAC (Roles & Permissions)
-- Date: 2026-07-22

-- 1. Create Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    code        text        UNIQUE NOT NULL,
    name        text        NOT NULL,
    module      text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Create Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  uuid        REFERENCES public.companies(id) ON DELETE CASCADE,
    name        text        NOT NULL,
    description text,
    is_system   boolean     DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- Unique index to prevent duplicate role names per company or globally
CREATE UNIQUE INDEX IF NOT EXISTS roles_company_name_idx ON public.roles(company_id, name) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS roles_global_name_idx ON public.roles(name) WHERE company_id IS NULL;

-- 3. Create Role Permissions Bridge Table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id       uuid        REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id uuid        REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Create Profile Roles Assignment Table
CREATE TABLE IF NOT EXISTS public.profile_roles (
    profile_id  uuid        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id     uuid        REFERENCES public.roles(id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow select on permissions to all authenticated users" ON public.permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow select on roles to company users" ON public.roles
    FOR SELECT TO authenticated USING (
        company_id IS NULL OR 
        company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Allow select on role_permissions to company users" ON public.role_permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow select on profile_roles to company users" ON public.profile_roles
    FOR SELECT TO authenticated USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
        )
    );

-- Admin management policies for roles
CREATE POLICY "Admins can manage roles in company" ON public.roles
    FOR ALL TO authenticated USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('super_admin', 'owner', 'hr_admin')
        )
    );

CREATE POLICY "Admins can manage role_permissions in company" ON public.role_permissions
    FOR ALL TO authenticated USING (
        role_id IN (
            SELECT id FROM public.roles 
            WHERE company_id IN (
                SELECT company_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('super_admin', 'owner', 'hr_admin')
            )
        )
    );

CREATE POLICY "Admins can assign profile roles in company" ON public.profile_roles
    FOR ALL TO authenticated USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE company_id IN (
                SELECT company_id FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('super_admin', 'owner', 'hr_admin')
            )
        )
    );

-- 5. Seed Default Permissions
INSERT INTO public.permissions (code, name, module) VALUES
    ('attendance.view', 'View Attendance', 'attendance'),
    ('attendance.clock', 'Clock In/Out', 'attendance'),
    ('attendance.approve', 'Approve Manual/Correction Attendance', 'attendance'),
    ('leave.request', 'Submit Leave/Permission Request', 'attendance'),
    ('leave.approve', 'Approve Cuti/Izin/Sakit Requests', 'attendance'),
    ('employee.view', 'View Employees', 'organization'),
    ('employee.manage', 'Manage Employee Directory', 'organization'),
    ('jobs.view', 'View Job Openings', 'hiring'),
    ('jobs.manage', 'Manage Job Posts & Candidates', 'hiring'),
    ('okr.manage', 'Manage Team & Company OKRs', 'performance')
ON CONFLICT (code) DO NOTHING;

-- 6. Seed Global System Roles
INSERT INTO public.roles (name, description, is_system) VALUES
    ('super_admin', 'SaaS Platform Administrator with global access', true),
    ('owner', 'Company Owner / President Director', true),
    ('hr_admin', 'HR Manager and Recruitment Administrator', true),
    ('employee', 'Standard Company Employee', true),
    ('candidate', 'Applicant / Job Candidate portal access', true),
    ('user', 'Default registered profile', true)
ON CONFLICT DO NOTHING;

-- 7. Map Default Permissions to Global Roles
DO $$
DECLARE
    v_role_super_admin uuid;
    v_role_owner uuid;
    v_role_hr_admin uuid;
    v_role_employee uuid;
    v_role_candidate uuid;
    v_role_user uuid;
    v_perm_record record;
BEGIN
    SELECT id INTO v_role_super_admin FROM public.roles WHERE company_id IS NULL AND name = 'super_admin';
    SELECT id INTO v_role_owner FROM public.roles WHERE company_id IS NULL AND name = 'owner';
    SELECT id INTO v_role_hr_admin FROM public.roles WHERE company_id IS NULL AND name = 'hr_admin';
    SELECT id INTO v_role_employee FROM public.roles WHERE company_id IS NULL AND name = 'employee';
    SELECT id INTO v_role_candidate FROM public.roles WHERE company_id IS NULL AND name = 'candidate';
    SELECT id INTO v_role_user FROM public.roles WHERE company_id IS NULL AND name = 'user';

    -- Map all permissions to Super Admin and Owner
    FOR v_perm_record IN SELECT id FROM public.permissions LOOP
        INSERT INTO public.role_permissions (role_id, permission_id) VALUES
            (v_role_super_admin, v_perm_record.id),
            (v_role_owner, v_perm_record.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Map HR Admin permissions
    FOR v_perm_record IN SELECT id FROM public.permissions WHERE code IN (
        'attendance.view', 'attendance.approve', 'leave.request', 'leave.approve', 
        'employee.view', 'employee.manage', 'jobs.view', 'jobs.manage', 'okr.manage'
    ) LOOP
        INSERT INTO public.role_permissions (role_id, permission_id) VALUES
            (v_role_hr_admin, v_perm_record.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Map Employee permissions
    FOR v_perm_record IN SELECT id FROM public.permissions WHERE code IN (
        'attendance.view', 'attendance.clock', 'leave.request', 'employee.view'
    ) LOOP
        INSERT INTO public.role_permissions (role_id, permission_id) VALUES
            (v_role_employee, v_perm_record.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Map Candidate permissions
    FOR v_perm_record IN SELECT id FROM public.permissions WHERE code IN ('jobs.view') LOOP
        INSERT INTO public.role_permissions (role_id, permission_id) VALUES
            (v_role_candidate, v_perm_record.id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- 8. Migrate existing profiles to profile_roles
INSERT INTO public.profile_roles (profile_id, role_id)
SELECT p.id, r.id FROM public.profiles p
JOIN public.roles r ON r.company_id IS NULL AND r.name = COALESCE(p.role, 'user')
ON CONFLICT (profile_id) DO NOTHING;

-- 9. Dynamic Permission Check Helper Function
CREATE OR REPLACE FUNCTION public.has_permission(required_perm text) 
RETURNS boolean AS $$
DECLARE
    v_has_perm boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.profile_roles pr
        JOIN public.role_permissions rp ON pr.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE pr.profile_id = auth.uid() AND p.code = required_perm
    ) INTO v_has_perm;
    
    RETURN v_has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
