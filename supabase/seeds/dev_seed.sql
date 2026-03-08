-- ============================================================
-- SEEDER: Data development untuk Fase 1 & 2
-- Jalankan di Supabase SQL Editor SETELAH:
--   1. repair_missing_profiles.sql (jika ada user lama)
--   2. Pastikan minimal 1 user & 1 company sudah ada
--
-- Script ini IDEMPOTENT — aman dijalankan berkali-kali.
-- Menggunakan ON CONFLICT DO NOTHING di semua INSERT.
-- ============================================================

DO $$
DECLARE
  v_company      RECORD;
  v_profile_id   uuid;
  v_job_fe       uuid;
  v_job_pm       uuid;
  v_job_be       uuid;
  v_job_intern   uuid;
BEGIN

-- ──────────────────────────────────────────────────────────────
-- 1. Loop semua company yang ada (agar semua akun dapat seed data)
-- ──────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM public.companies) THEN
  RAISE EXCEPTION 'Tidak ada company ditemukan. Jalankan repair_missing_profiles.sql terlebih dahulu.';
END IF;

FOR v_company IN SELECT id, name, slug FROM public.companies ORDER BY created_at
LOOP
  RAISE NOTICE '--- Seeding company: % (%) ---', v_company.name, v_company.id;

  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE company_id = v_company.id
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE NOTICE 'Tidak ada profile untuk company %, skip.', v_company.name;
    CONTINUE;
  END IF;

-- ──────────────────────────────────────────────────────────────
-- 2. JOBS — 4 lowongan dengan status berbeda
-- ──────────────────────────────────────────────────────────────

-- Job 1: Published — Frontend Engineer
INSERT INTO public.jobs (
  id, company_id, created_by, title, slug,
  description, requirements,
  location, work_type, employment_type,
  status, published_at, deadline, created_at
) VALUES (
  gen_random_uuid(),
  v_company.id,
  v_profile_id,
  'Frontend Engineer',
  'frontend-engineer',
  'Kami mencari Frontend Engineer yang berpengalaman untuk bergabung bersama tim produk kami. Anda akan membangun antarmuka pengguna yang elegan, cepat, dan responsif menggunakan React dan Next.js.

Tanggung jawab:
- Membangun dan memelihara komponen UI menggunakan React/Next.js
- Berkolaborasi dengan tim desain untuk implementasi Figma ke kode
- Mengoptimalkan performa halaman (Core Web Vitals)
- Menulis unit test untuk komponen kritis',
  'Kualifikasi yang dibutuhkan:
- Minimal 2 tahun pengalaman dengan React.js
- Familiar dengan Next.js, TypeScript, dan Tailwind CSS
- Paham konsep state management (Zustand / Redux / Context)
- Pengalaman dengan REST API dan WebSocket
- Nilai plus: pengalaman dengan Supabase atau Firebase',
  'Jakarta Selatan',
  'hybrid',
  'fulltime',
  'published',
  now() - interval '3 days',
  (current_date + interval '30 days')::date,
  now() - interval '4 days'
) ON CONFLICT (company_id, slug) DO NOTHING
RETURNING id INTO v_job_fe;

IF v_job_fe IS NULL THEN
  SELECT id INTO v_job_fe FROM public.jobs WHERE company_id = v_company.id AND slug = 'frontend-engineer';
END IF;

-- Job 2: Published — Product Manager
INSERT INTO public.jobs (
  id, company_id, created_by, title, slug,
  description, requirements,
  location, work_type, employment_type,
  status, published_at, deadline, created_at
) VALUES (
  gen_random_uuid(),
  v_company.id,
  v_profile_id,
  'Product Manager',
  'product-manager',
  'Bergabunglah sebagai Product Manager dan pimpin pengembangan produk kami dari ideasi hingga launch. Anda akan bekerja langsung dengan stakeholder, desainer, dan engineer untuk menghasilkan produk yang user-centric.

Tanggung jawab:
- Mendefinisikan roadmap produk berdasarkan data dan kebutuhan user
- Menulis Product Requirements Document (PRD) yang jelas
- Memimpin sprint planning dan grooming bersama tim engineering
- Menganalisis metrik produk dan membuat keputusan berbasis data',
  'Kualifikasi yang dibutuhkan:
- Minimal 3 tahun pengalaman sebagai Product Manager atau Product Owner
- Familiar dengan metodologi Agile/Scrum
- Kemampuan analitik yang kuat (SQL dasar, Google Analytics, Mixpanel)
- Komunikasi yang baik dalam Bahasa Indonesia dan Inggris
- Nilai plus: background teknis atau pernah menjadi engineer',
  'Remote',
  'remote',
  'fulltime',
  'published',
  now() - interval '1 day',
  (current_date + interval '21 days')::date,
  now() - interval '2 days'
) ON CONFLICT (company_id, slug) DO NOTHING
RETURNING id INTO v_job_pm;

IF v_job_pm IS NULL THEN
  SELECT id INTO v_job_pm FROM public.jobs WHERE company_id = v_company.id AND slug = 'product-manager';
END IF;

-- Job 3: Draft — Backend Engineer (belum dipublish)
INSERT INTO public.jobs (
  id, company_id, created_by, title, slug,
  description, requirements,
  location, work_type, employment_type,
  status, deadline, created_at
) VALUES (
  gen_random_uuid(),
  v_company.id,
  v_profile_id,
  'Backend Engineer (Node.js)',
  'backend-engineer-nodejs',
  'Kami sedang mengembangkan platform baru dan membutuhkan Backend Engineer yang solid untuk membangun API yang skalabel dan reliable.

Tanggung jawab:
- Merancang dan mengembangkan RESTful API menggunakan Node.js
- Mengelola database PostgreSQL dan query optimization
- Mengimplementasikan autentikasi dan otorisasi
- Kolaborasi dengan tim frontend untuk integrasi API',
  'Kualifikasi:
- Minimal 2 tahun pengalaman dengan Node.js (Express/Fastify/NestJS)
- Solid understanding of PostgreSQL dan SQL
- Pengalaman dengan Docker dan deployment di cloud (AWS/GCP/Vercel)
- Familiar dengan testing (Jest, Supertest)',
  'Bandung',
  'hybrid',
  'fulltime',
  'draft',
  (current_date + interval '45 days')::date,
  now() - interval '6 hours'
) ON CONFLICT (company_id, slug) DO NOTHING
RETURNING id INTO v_job_be;

IF v_job_be IS NULL THEN
  SELECT id INTO v_job_be FROM public.jobs WHERE company_id = v_company.id AND slug = 'backend-engineer-nodejs';
END IF;

-- Job 4: Closed — UI/UX Designer Intern (sudah tutup)
INSERT INTO public.jobs (
  id, company_id, created_by, title, slug,
  description, requirements,
  location, work_type, employment_type,
  status, published_at, closed_at, created_at
) VALUES (
  gen_random_uuid(),
  v_company.id,
  v_profile_id,
  'UI/UX Designer Intern',
  'uiux-designer-intern',
  'Program magang UI/UX selama 3 bulan. Kesempatan bagi mahasiswa untuk belajar langsung bersama tim desain profesional.

Yang akan Anda pelajari:
- Design thinking dan user research
- Prototyping dengan Figma
- Usability testing
- Design system dan komponen UI',
  'Persyaratan:
- Mahasiswa aktif semester 5 ke atas (Desain, Teknik Informatika, atau bidang terkait)
- Familiar dengan Figma atau Adobe XD
- Portfolio desain (walaupun sederhana)
- Bisa komitmen 3 bulan penuh (minimal 4 hari/minggu)',
  'Jakarta',
  'onsite',
  'internship',
  'closed',
  now() - interval '30 days',
  now() - interval '2 days',
  now() - interval '35 days'
) ON CONFLICT (company_id, slug) DO NOTHING
RETURNING id INTO v_job_intern;

IF v_job_intern IS NULL THEN
  SELECT id INTO v_job_intern FROM public.jobs WHERE company_id = v_company.id AND slug = 'uiux-designer-intern';
END IF;

RAISE NOTICE 'Jobs seeded. IDs: FE=%, PM=%, BE=%, Intern=%', v_job_fe, v_job_pm, v_job_be, v_job_intern;

-- ──────────────────────────────────────────────────────────────
-- 3. APPLICATIONS — kandidat sample untuk Fase 2 testing
--    Hanya diinsert jika tabel applications sudah ada
-- ──────────────────────────────────────────────────────────────

-- Cek apakah tabel applications ada
IF EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'applications'
) AND v_job_fe IS NOT NULL THEN


  -- Kandidat 1: Applied (baru daftar)
  INSERT INTO public.applications (
    job_id, company_id, full_name, email, phone,
    cover_letter, stage, created_at
  ) VALUES (
    v_job_fe, v_company.id,
    'Budi Santoso', 'budi.santoso@gmail.com', '081234567890',
    'Saya sangat tertarik dengan posisi ini karena sesuai dengan pengalaman saya di bidang React.js selama 3 tahun. Saya percaya saya bisa memberikan kontribusi signifikan bagi tim.',
    'applied', now() - interval '2 days'
  ) ON CONFLICT (job_id, email) DO NOTHING;

  -- Kandidat 2: Screening
  INSERT INTO public.applications (
    job_id, company_id, full_name, email, phone,
    cover_letter, stage, created_at
  ) VALUES (
    v_job_fe, v_company.id,
    'Dewi Lestari', 'dewi.lestari@yahoo.com', '085678901234',
    'Lulus S1 Teknik Informatika 2022, sudah berpengalaman 2 tahun sebagai Frontend Developer di startup fintech. Saya sangat excited dengan visi produk perusahaan Anda.',
    'screening', now() - interval '3 days'
  ) ON CONFLICT (job_id, email) DO NOTHING;

  -- Kandidat 3: Assessment
  INSERT INTO public.applications (
    job_id, company_id, full_name, email, phone,
    stage, internal_notes, created_at
  ) VALUES (
    v_job_fe, v_company.id,
    'Ahmad Fauzi', 'ahmad.fauzi@outlook.com', '087890123456',
    'assessment',
    'Kandidat ini sangat promising. CV kuat, portfolio bagus. Perlu lihat hasil technical test-nya.',
    now() - interval '5 days'
  ) ON CONFLICT (job_id, email) DO NOTHING;

  -- Kandidat 4: Interview
  INSERT INTO public.applications (
    job_id, company_id, full_name, email, phone,
    stage, internal_notes, created_at
  ) VALUES (
    v_job_fe, v_company.id,
    'Sari Indah Permata', 'sari.indah@gmail.com', '089012345678',
    'interview',
    'Hasil assessment sangat baik (90/100). Lanjut ke interview teknikal dengan Tech Lead.',
    now() - interval '7 days'
  ) ON CONFLICT (job_id, email) DO NOTHING;

  -- Kandidat 5: Rejected
  INSERT INTO public.applications (
    job_id, company_id, full_name, email, phone,
    stage, rejection_reason, created_at
  ) VALUES (
    v_job_fe, v_company.id,
    'Rizki Pratama', 'rizki.pratama@gmail.com', '081122334455',
    'rejected',
    'Pengalaman kurang dari 2 tahun, belum familiar dengan TypeScript. Mungkin cocok untuk junior role di masa depan.',
    now() - interval '4 days'
  ) ON CONFLICT (job_id, email) DO NOTHING;

  -- Kandidat untuk PM job
  INSERT INTO public.applications (
    job_id, company_id, full_name, email, phone,
    cover_letter, stage, created_at
  ) VALUES (
    v_job_pm, v_company.id,
    'Maya Putri Rahardjo', 'maya.rahardjo@gmail.com', '082233445566',
    'Saya memiliki 4 tahun pengalaman sebagai PM di perusahaan e-commerce. Saya familiar dengan OKR framework dan sangat data-driven dalam pengambilan keputusan.',
    'screening', now() - interval '1 day'
  ) ON CONFLICT (job_id, email) DO NOTHING;

  RAISE NOTICE 'Applications seeded successfully.';
ELSE
  RAISE NOTICE 'Tabel applications belum ada — skipping applications seed. Jalankan migration fase2 terlebih dahulu.';
END IF;

-- ──────────────────────────────────────────────────────────────
-- 4. Akhir loop + verifikasi per company
-- ──────────────────────────────────────────────────────────────
  RAISE NOTICE 'Done seeding company: % — jobs inserted: %',
    v_company.name,
    (SELECT COUNT(*) FROM public.jobs WHERE company_id = v_company.id);

END LOOP; -- akhir FOR v_company

RAISE NOTICE '=== SEEDING SELESAI ===';

END;
$$;

-- Tampilkan ringkasan hasil seeding
SELECT
  j.title,
  j.status,
  j.work_type,
  j.employment_type,
  j.location,
  j.deadline,
  CASE
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications')
    THEN (SELECT COUNT(*)::text FROM public.applications WHERE job_id = j.id)
    ELSE 'n/a'
  END AS total_applicants
FROM public.jobs j
JOIN public.companies c ON c.id = j.company_id
ORDER BY j.created_at DESC;

-- --- INITIATIVES SCHEMA (Added by Antigravity) ---
CREATE TABLE IF NOT EXISTS public.initiatives (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id         uuid        NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  delivery_window text,
  status         text        DEFAULT 'Not started' CHECK (status IN ('Not started', 'In progress', 'Done', 'Unconfirmed')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz
);

ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inherited access for initiatives" ON public.initiatives
  FOR ALL USING (
    okr_id IN (
      SELECT id FROM public.okrs 
      WHERE employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
      OR company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('hr', 'super_admin'))
    )
  );

