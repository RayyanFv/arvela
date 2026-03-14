-- ============================================================
-- PHOTOJO COMPANY SEEDER
-- HR: photojo@demo.com / PhotoJo123!
-- 3 Dummy Employees included.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_company_id uuid := 'b3f5450e-7cbf-478c-8f9f-000000000002';
  v_hr_id      uuid := 'b3f5450e-7cbf-478c-8f9f-200000000001';
  v_emp1_id    uuid := 'b3f5450e-7cbf-478c-8f9f-200000000002';
  v_emp2_id    uuid := 'b3f5450e-7cbf-478c-8f9f-200000000003';
  v_emp3_id    uuid := 'b3f5450e-7cbf-478c-8f9f-200000000004';
  
  v_hr_pub_id  uuid;
  v_emp1_pub_id uuid;
  v_emp2_pub_id uuid;
  v_emp3_pub_id uuid;

  v_onboard_tpl_id uuid := 'b3f5450e-7cbf-478c-8f9f-300000000001';
  v_task1_id uuid := 'b3f5450e-7cbf-478c-8f9f-300000000002';
  v_task2_id uuid := 'b3f5450e-7cbf-478c-8f9f-300000000003';
  
  v_course_id uuid := 'b3f5450e-7cbf-478c-8f9f-400000000001';
  v_section_id uuid := 'b3f5450e-7cbf-478c-8f9f-400000000002';
  v_content_id uuid := 'b3f5450e-7cbf-478c-8f9f-400000000003';
  v_video_content_id uuid := 'b3f5450e-7cbf-478c-8f9f-400000000004';

  v_leave_annual_id uuid;
BEGIN

-- 1. Create Company
INSERT INTO public.companies (id, name, slug, website, created_at)
VALUES (v_company_id, 'PhotoJo', 'photojo', 'https://photojo.arvela.demo', now())
ON CONFLICT (id) DO NOTHING;

-- 2. Create Auth Users
-- HR
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (v_hr_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'photojo@demo.com', crypt('PhotoJo123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', format('{"role":"hr_admin","full_name":"HR PhotoJo","company_id":"%s"}', v_company_id)::jsonb, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Employees
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
  (v_emp1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'karyawan1_photojo@demo.com', crypt('PhotoJo123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', format('{"role":"employee","full_name":"Budi Photo","company_id":"%s"}', v_company_id)::jsonb, now(), now()),
  (v_emp2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'karyawan2_photojo@demo.com', crypt('PhotoJo123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', format('{"role":"employee","full_name":"Siti Jo","company_id":"%s"}', v_company_id)::jsonb, now(), now()),
  (v_emp3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'karyawan3_photojo@demo.com', crypt('PhotoJo123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', format('{"role":"employee","full_name":"Andi Lens","company_id":"%s"}', v_company_id)::jsonb, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Auth Identities
INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES 
  (v_hr_id, v_hr_id, v_hr_id, format('{"sub":"%s","email":"%s"}', v_hr_id::text, 'photojo@demo.com')::jsonb, 'email', now(), now(), now()),
  (v_emp1_id, v_emp1_id, v_emp1_id, format('{"sub":"%s","email":"%s"}', v_emp1_id::text, 'karyawan1_photojo@demo.com')::jsonb, 'email', now(), now(), now()),
  (v_emp2_id, v_emp2_id, v_emp2_id, format('{"sub":"%s","email":"%s"}', v_emp2_id::text, 'karyawan2_photojo@demo.com')::jsonb, 'email', now(), now(), now()),
  (v_emp3_id, v_emp3_id, v_emp3_id, format('{"sub":"%s","email":"%s"}', v_emp3_id::text, 'karyawan3_photojo@demo.com')::jsonb, 'email', now(), now(), now())
ON CONFLICT DO NOTHING;

-- 3. Profiles
INSERT INTO public.profiles (id, email, full_name, role, company_id, department)
VALUES
  (v_hr_id, 'photojo@demo.com', 'HR PhotoJo', 'hr_admin', v_company_id, 'HR'),
  (v_emp1_id, 'karyawan1_photojo@demo.com', 'Budi Photo', 'employee', v_company_id, 'Creative'),
  (v_emp2_id, 'karyawan2_photojo@demo.com', 'Siti Jo', 'employee', v_company_id, 'Creative'),
  (v_emp3_id, 'karyawan3_photojo@demo.com', 'Andi Lens', 'employee', v_company_id, 'Operations')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, company_id = EXCLUDED.company_id;

-- 4. Employees
INSERT INTO public.employees (profile_id, company_id, job_title, department, status)
VALUES
  (v_hr_id, v_company_id, 'HR Manager', 'HR', 'active'),
  (v_emp1_id, v_company_id, 'Photographer', 'Creative', 'active'),
  (v_emp2_id, v_company_id, 'Video Editor', 'Creative', 'active'),
  (v_emp3_id, v_company_id, 'Studio Assistant', 'Operations', 'active')
ON CONFLICT (profile_id) DO NOTHING;

-- Get public.employees ID for further seeding
SELECT id INTO v_hr_pub_id FROM public.employees WHERE profile_id = v_hr_id;
SELECT id INTO v_emp1_pub_id FROM public.employees WHERE profile_id = v_emp1_id;
SELECT id INTO v_emp2_pub_id FROM public.employees WHERE profile_id = v_emp2_id;
SELECT id INTO v_emp3_pub_id FROM public.employees WHERE profile_id = v_emp3_id;

-- 5. Onboarding Data
INSERT INTO public.onboarding_templates (id, company_id, name, description)
VALUES (v_onboard_tpl_id, v_company_id, 'Onboarding PhotoJo Standard', 'Prosedur onboarding untuk tim kreatif.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.onboarding_tasks (id, template_id, title, description, order_index)
VALUES 
  (v_task1_id, v_onboard_tpl_id, 'Siapkan Gear Kamera', 'Mengecek kelengkapan kamera dan lensa.', 1),
  (v_task2_id, v_onboard_tpl_id, 'Akses Server Portofolio', 'Meminta hak akses ke server foto.', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.onboarding_progress (employee_id, task_id, is_completed)
VALUES 
  (v_emp1_pub_id, v_task1_id, true),
  (v_emp1_pub_id, v_task2_id, false),
  (v_emp2_pub_id, v_task1_id, true),
  (v_emp2_pub_id, v_task2_id, true),
  (v_emp3_pub_id, v_task1_id, false)
ON CONFLICT DO NOTHING;

-- 6. LMS Data
INSERT INTO public.lms_courses (id, company_id, title, description, status, level, created_by)
VALUES (v_course_id, v_company_id, 'Teknik Pencahayaan Studio', 'Kursus dasar pencahayaan untuk studio foto.', 'published', 'beginner', v_hr_id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lms_course_sections (id, course_id, title, order_index)
VALUES (v_section_id, v_course_id, 'Dasar-dasar Flash', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lms_course_contents (id, section_id, title, type, content_type, content_body, order_index)
VALUES (v_content_id, v_section_id, 'Pengenalan Softbox', 'text', 'text', 'Softbox digunakan untuk melembutkan cahaya...', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lms_course_contents (id, section_id, title, type, content_type, content_url, order_index)
VALUES (v_video_content_id, v_section_id, 'Tutorial Lighting Dasar (Video)', 'video', 'video', 'https://youtu.be/QQhJ3vHdQ3g?si=RVAPLYm4WpkhW3m1', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lms_course_progress (course_id, employee_id, completion_percentage, is_completed)
VALUES 
  (v_course_id, v_emp1_pub_id, 100, true),
  (v_course_id, v_emp2_pub_id, 50, false),
  (v_course_id, v_emp3_pub_id, 0, false)
ON CONFLICT DO NOTHING;

-- LMS Assignments
INSERT INTO public.lms_course_assignments (course_id, employee_id, company_id, status)
VALUES 
  (v_course_id, v_emp1_pub_id, v_company_id, 'completed'),
  (v_course_id, v_emp2_pub_id, v_company_id, 'enrolled'),
  (v_course_id, v_emp3_pub_id, v_company_id, 'enrolled')
ON CONFLICT DO NOTHING;

-- 7. Performance (OKRs & Key Results)
INSERT INTO public.okrs (id, employee_id, company_id, title, period, status)
VALUES 
  ('b3f5450e-7cbf-478c-8f9f-500000000001', v_emp1_pub_id, v_company_id, 'Meningkatkan Kualitas Foto Portofolio', 'Q1 2026', 'active'),
  ('b3f5450e-7cbf-478c-8f9f-500000000002', v_emp2_pub_id, v_company_id, 'Produksi Video Batch A', 'Q1 2026', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.key_results (okr_id, title, target_value, current_value, unit)
VALUES 
  ('b3f5450e-7cbf-478c-8f9f-500000000001', 'Upload 50 foto ke Adobe Stock', 50, 25, 'foto'),
  ('b3f5450e-7cbf-478c-8f9f-500000000002', 'Edit 10 video komersial', 10, 4, 'video')
ON CONFLICT DO NOTHING;

-- 8. Overtime Data (Lembur)
INSERT INTO public.overtime_requests (company_id, employee_id, overtime_date, start_time, end_time, reason, status)
VALUES 
  (v_company_id, v_emp1_pub_id, current_date, '18:00', '21:00', 'Photoshoot Wedding Client', 'APPROVED'),
  (v_company_id, v_emp2_pub_id, current_date, '18:00', '20:00', 'Editing video urgent', 'PENDING')
ON CONFLICT DO NOTHING;

-- 9. Leave & Exceptions (Izin/Eksepsi)
INSERT INTO public.leave_types (company_id, name, code, is_paid)
VALUES (v_company_id, 'Cuti Tahunan', 'ANNUAL', true)
ON CONFLICT (company_id, code) DO NOTHING;

SELECT id INTO v_leave_annual_id FROM public.leave_types WHERE company_id = v_company_id AND code = 'ANNUAL';

INSERT INTO public.attendance_requests (company_id, employee_id, type, leave_type_id, start_date, end_date, reason, status)
VALUES 
  (v_company_id, v_emp3_pub_id, 'LEAVE', v_leave_annual_id, current_date + 1, current_date + 2, 'Kebutuhan keluarga', 'PENDING'),
  (v_company_id, v_emp1_pub_id, 'PERMISSION', NULL, current_date, current_date, 'Izin ke bank sebentar', 'APPROVED')
ON CONFLICT DO NOTHING;

-- 10. Attendance (Kehadiran)
INSERT INTO public.attendances (company_id, employee_id, date, status, clock_in, clock_out)
VALUES 
  (v_company_id, v_emp1_pub_id, current_date, 'present', now() - interval '8 hours', now()),
  (v_company_id, v_emp2_pub_id, current_date, 'present', now() - interval '8 hours', now())
ON CONFLICT DO NOTHING;

END;
$$;
