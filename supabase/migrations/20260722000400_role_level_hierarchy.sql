-- Migration: Role Hierarchy Levels
-- Date: 2026-07-22
-- Lower number = higher authority

ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 10;

-- Global system roles
UPDATE public.roles SET level = 1 WHERE name = 'super_admin' AND company_id IS NULL;
UPDATE public.roles SET level = 2 WHERE name = 'owner' AND company_id IS NULL;
UPDATE public.roles SET level = 3 WHERE name = 'hr_admin' AND company_id IS NULL;
UPDATE public.roles SET level = 4 WHERE name = 'employee' AND company_id IS NULL;
UPDATE public.roles SET level = 5 WHERE name = 'candidate' AND company_id IS NULL;
UPDATE public.roles SET level = 6 WHERE name = 'user' AND company_id IS NULL;

-- Company-scoped clones
UPDATE public.roles SET level = 2 WHERE name = 'owner' AND company_id IS NOT NULL;
UPDATE public.roles SET level = 3 WHERE name = 'hr_admin' AND company_id IS NOT NULL;
UPDATE public.roles SET level = 4 WHERE name = 'employee' AND company_id IS NOT NULL;
UPDATE public.roles SET level = 5 WHERE name = 'candidate' AND company_id IS NOT NULL;
UPDATE public.roles SET level = 6 WHERE name = 'user' AND company_id IS NOT NULL;

-- Helper: current user's level
CREATE OR REPLACE FUNCTION public.my_role_level()
RETURNS integer AS $$
    SELECT COALESCE(
        (
            SELECT r.level FROM public.profile_roles pr
            JOIN public.roles r ON pr.role_id = r.id
            WHERE pr.profile_id = auth.uid()
            LIMIT 1
        ),
        99
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: can current user manage a target user?
CREATE OR REPLACE FUNCTION public.can_manage_user(target_profile_id uuid)
RETURNS boolean AS $$
DECLARE
    my_level integer;
    target_level integer;
BEGIN
    SELECT public.my_role_level() INTO my_level;
    SELECT COALESCE(
        (SELECT r.level FROM public.profile_roles pr JOIN public.roles r ON pr.role_id = r.id WHERE pr.profile_id = target_profile_id LIMIT 1),
        (SELECT CASE p.role WHEN 'super_admin' THEN 1 WHEN 'owner' THEN 2 WHEN 'hr_admin' THEN 3 WHEN 'employee' THEN 4 WHEN 'candidate' THEN 5 ELSE 6 END FROM public.profiles p WHERE p.id = target_profile_id)
    ) INTO target_level;
    RETURN target_level > my_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
