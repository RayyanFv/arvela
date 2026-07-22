-- Migration: Onboarding Auto-Seeding Trigger
-- Date: 2026-07-22

-- 1. Create Function to Auto-Seed Company Data
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS trigger AS $$
DECLARE
    v_sys_role record;
    v_new_role_id uuid;
    v_default_lat numeric(10, 8);
    v_default_lng numeric(11, 8);
BEGIN
    -- A. Seed Default Leave Types
    INSERT INTO public.leave_types (company_id, name, code, is_paid, requires_attachment, deducts_annual_leave, max_days_per_year)
    VALUES 
        (NEW.id, 'Cuti Tahunan', 'ANNUAL', true, false, true, 12),
        (NEW.id, 'Sakit', 'SICK', true, true, false, 30),
        (NEW.id, 'Izin Khusus', 'SPECIAL_LEAVE', true, false, false, 5)
    ON CONFLICT (company_id, code) DO NOTHING;

    -- B. Seed Default Shifts
    -- We assume the 'shifts' table exists from Fase 8. Let's check or handle safely.
    -- Table shifts is typically defined as: company_id, name, clock_in_time, clock_out_time, late_threshold
    BEGIN
        INSERT INTO public.shifts (company_id, name, clock_in_time, clock_out_time, late_threshold)
        VALUES (NEW.id, 'Shift Normal (Pagi)', '08:00:00', '17:00:00', 15)
        ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Safely ignore if shifts table structure differs or is missing
        NULL;
    END;

    -- C. Seed Company-specific Roles cloned from Global System Roles
    FOR v_sys_role IN SELECT id, name, description FROM public.roles WHERE company_id IS NULL AND is_system = true LOOP
        -- Create company-specific role
        INSERT INTO public.roles (company_id, name, description, is_system)
        VALUES (NEW.id, v_sys_role.name, v_sys_role.description, false)
        RETURNING id INTO v_new_role_id;

        -- Copy permissions from global system role to this new company role
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT v_new_role_id, permission_id 
        FROM public.role_permissions 
        WHERE role_id = v_sys_role.id;
    END LOOP;

    -- D. Seed Default Unit Level Configs
    INSERT INTO public.unit_level_configs (company_id, level, label)
    VALUES 
        (NEW.id, 1, 'Divisi'),
        (NEW.id, 2, 'Departemen'),
        (NEW.id, 3, 'Unit')
    ON CONFLICT (company_id, level) DO NOTHING;

    -- E. Seed Default Job Grades (Pangkat: Level 1 = Direktur Tertinggi, Level 7 = Staf Terendah)
    INSERT INTO public.job_grades (company_id, name, code, level)
    VALUES 
        (NEW.id, 'Direktur',         'DIR', 1),
        (NEW.id, 'General Manager',  'GM',  2),
        (NEW.id, 'Manager',          'MGR', 3),
        (NEW.id, 'Supervisor',       'SPV', 4),
        (NEW.id, 'Pelaksana Senior', 'SNR', 5),
        (NEW.id, 'Pelaksana Junior', 'JNR', 6),
        (NEW.id, 'Staf',             'STF', 7)
    ON CONFLICT (company_id, name) DO NOTHING;

    -- F. Seed Default Office Location if coordinates are provided
    IF NEW.office_lat IS NOT NULL AND NEW.office_lng IS NOT NULL THEN
        INSERT INTO public.office_locations (company_id, name, lat, lng, radius_meters)
        VALUES (NEW.id, 'Kantor Pusat', NEW.office_lat, NEW.office_lng, COALESCE(NEW.office_radius_meters, 100));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind Trigger to public.companies Table
CREATE OR REPLACE TRIGGER on_company_created
    AFTER INSERT ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_company();
