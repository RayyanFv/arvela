-- ============================================================
-- DEMO DATA SEEDER (Arvela)
-- File ini bisa dieksekusi langsung di Supabase SQL Editor.
-- Password untuk semua akun fiktif: Password123!
-- Menggunakan ON CONFLICT DO NOTHING (Aman dijalankan berulang).
-- ============================================================

-- Ekstensi wajib untuk Hash Password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_company_id uuid := 'b3f5450e-7cbf-478c-8f9f-000000000001';
  v_superadmin_id uuid := 'b3f5450e-7cbf-478c-8f9f-100000000001';
  v_owner_id uuid := 'b3f5450e-7cbf-478c-8f9f-100000000002';
  v_hradmin_id uuid := 'b3f5450e-7cbf-478c-8f9f-100000000003';
  v_emp1_id uuid := 'b3f5450e-7cbf-478c-8f9f-100000000004';
  v_emp2_id uuid := 'b3f5450e-7cbf-478c-8f9f-100000000005';
  
  v_job_1 uuid := 'b3f5450e-7cbf-478c-8f9f-200000000001';
  v_job_2 uuid := 'b3f5450e-7cbf-478c-8f9f-200000000002';
BEGIN

-- ──────────────────────────────────────────────────────────────
-- 0. Hapus Data Dummy Sebelumnya (Cleanup)
-- ──────────────────────────────────────────────────────────────
-- Hapus semua users demo
DELETE FROM auth.users WHERE email LIKE '%arvelademo.local' OR email LIKE '%gmail.example.com';
-- Hapus companies demo (akan cascade ke profiles, jobs, applications, dll jika ada relasi CASCADE)
DELETE FROM public.companies WHERE name LIKE '%(Demo)%' OR slug LIKE '%inovasi-nusantara-demo%';

-- ──────────────────────────────────────────────────────────────
-- 1. Buat Perusahaan (Tenant)
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.companies (id, name, slug, website, created_at)
VALUES (
  v_company_id,
  'PT Inovasi Teknologi Nusantara (Demo)',
  'inovasi-nusantara-demo-1',
  'https://inovasi.arvela.demo',
  now()
) ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 2. Buat Pengguna (Auth Users) 
-- ──────────────────────────────────────────────────────────────
-- Super Admin
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (v_superadmin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'superadmin@arvelademo.local', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"super_admin","full_name":"Budi Harjo"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Owner
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (v_owner_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@arvelademo.local', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"owner","full_name":"Ibu Kartini"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- HR Admin
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (v_hradmin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hr@arvelademo.local', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"hr_admin","full_name":"Indah Pramesti"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Karyawan 1 & 2
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
  (v_emp1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'karyawan1@arvelademo.local', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"employee","full_name":"Tatang R."}', now(), now()),
  (v_emp2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'karyawan2@arvelademo.local', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"employee","full_name":"Citra Kirana"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Identitas Auth (Supabase Auth butuh identity untuk login email/password)
INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES 
  (v_superadmin_id, v_superadmin_id, v_superadmin_id, format('{"sub":"%s","email":"%s"}', v_superadmin_id::text, 'superadmin@arvelademo.local')::jsonb, 'email', now(), now(), now()),
  (v_owner_id, v_owner_id, v_owner_id, format('{"sub":"%s","email":"%s"}', v_owner_id::text, 'owner@arvelademo.local')::jsonb, 'email', now(), now(), now()),
  (v_hradmin_id, v_hradmin_id, v_hradmin_id, format('{"sub":"%s","email":"%s"}', v_hradmin_id::text, 'hr@arvelademo.local')::jsonb, 'email', now(), now(), now()),
  (v_emp1_id, v_emp1_id, v_emp1_id, format('{"sub":"%s","email":"%s"}', v_emp1_id::text, 'karyawan1@arvelademo.local')::jsonb, 'email', now(), now(), now()),
  (v_emp2_id, v_emp2_id, v_emp2_id, format('{"sub":"%s","email":"%s"}', v_emp2_id::text, 'karyawan2@arvelademo.local')::jsonb, 'email', now(), now(), now())
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 3. Injeksi Profil Pengguna
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, email, full_name, role, company_id, department)
VALUES
  (v_superadmin_id, 'superadmin@arvelademo.local', 'Super Admin', 'super_admin', v_company_id, 'Management'),
  (v_owner_id, 'owner@arvelademo.local', 'Ibu Nania Owner', 'owner', v_company_id, 'Board of Directors'),
  (v_hradmin_id, 'hr@arvelademo.local', 'Qiqi HR Admin', 'hr_admin', v_company_id, 'Human Resources'),
  (v_emp1_id, 'karyawan1@arvelademo.local', 'Tatang R.', 'employee', v_company_id, 'Engineering'),
  (v_emp2_id, 'karyawan2@arvelademo.local', 'Citra Kirana', 'employee', v_company_id, 'Design')
ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, company_id = EXCLUDED.company_id;

-- ──────────────────────────────────────────────────────────────
-- 4. Karyawan (Employees)
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.employees (profile_id, company_id, job_title, department, status)
VALUES
  (v_emp1_id, v_company_id, 'Backend Engineer', 'Engineering', 'active'),
  (v_emp2_id, v_company_id, 'UI/UX Designer', 'Design', 'active')
ON CONFLICT (profile_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 5. Buat Lowongan (Jobs) & Pelamar (Applications)
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.jobs (id, company_id, created_by, title, slug, status, location, work_type, employment_type, description)
VALUES 
  (v_job_1, v_company_id, v_hradmin_id, 'Senior Product Manager', 'spm-demo-1', 'published', 'Jakarta', 'hybrid', 'fulltime', 'Memimpin pengembangan produk.'),
  (v_job_2, v_company_id, v_hradmin_id, 'Data Scientist Intern', 'data-intern-1', 'published', 'Bandung', 'remote', 'internship', 'Menganalisis big data dengan Python.')
ON CONFLICT (id) DO NOTHING;

-- Aplikasi ke Job 1
INSERT INTO public.applications (company_id, job_id, full_name, email, phone, stage)
VALUES 
  (v_company_id, v_job_1, 'Aditya Pratama', 'aditya.pratama@gmail.com', '081234567890', 'applied'),
  (v_company_id, v_job_1, 'Rina Sulviana', 'rina.sulvia@yahoo.com', '085678901234', 'screening'),
  (v_company_id, v_job_1, 'Jonathan Setiawan', 'jonathan.setiawan@outlook.com', '087890123456', 'interview')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 6. Kehadiran (Attendances)
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.attendances (company_id, employee_id, date, status, clock_in, clock_out)
SELECT v_company_id, id, current_date, 'present', now() - interval '9 hours', now()
FROM public.employees WHERE company_id = v_company_id
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 7. Lembur (Overtime)
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.overtime_requests (company_id, employee_id, overtime_date, status, start_time, end_time, reason, tasks_completed)
SELECT v_company_id, id, current_date, 'pending', '17:00', '20:00', 'Mengejar deadline project', 'Menyelesaikan modul laporan'
FROM public.employees WHERE company_id = v_company_id
LIMIT 1
ON CONFLICT (id) DO NOTHING;

END;
$$;
