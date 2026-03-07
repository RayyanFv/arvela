# AICareer — Agent Build Plan
**Panduan tahapan development dari 0 hingga production-ready**
_Berdasarkan DoD v1.0 · Next.js + Supabase · Solo Founder Build_

---

## Cara Membaca Dokumen Ini

Setiap tahap memiliki struktur:
- **Konteks** — kenapa tahap ini penting
- **Output wajib** — apa yang harus jadi sebelum lanjut
- **Task teknis** — langkah konkret yang dikerjakan
- **DoD checklist** — gate sebelum boleh lanjut ke tahap berikutnya
- **⛔ Blocker** — kondisi yang benar-benar menghentikan progress

> **Urutan wajib**: Fase 0 → 1 → 2 → 3 → 4 → 5 (sequential, saling depend)
> **Paralel boleh**: Fase 6 dan 7 bisa mulai setelah Fase 0 selesai
> **Quick Wins**: Dikerjakan setelah pilot Fase 0–5 selesai dan ada validasi user

---

## FASE 0 — Project Setup & Foundation
> Fondasi seluruh aplikasi. Semua modul lain bergantung pada fase ini.
> **Estimasi**: 3–4 jam · **Blocker**: Ya — tidak ada modul yang boleh dimulai sebelum fase ini lulus test

### 0.1 — Inisialisasi Project

- [ ] Buat project Next.js 14 baru dengan App Router
  ```bash
  npx create-next-app@latest aicareer --app --no-typescript --tailwind --eslint
  ```
- [ ] Install dependencies inti
  ```bash
  npm install @supabase/ssr @supabase/supabase-js
  npm install react-hook-form @hookform/resolvers zod
  npm install date-fns lucide-react
  npx shadcn@latest init
  ```
- [ ] Setup Tailwind v4 config dengan `@theme` block
- [ ] Install dan konfigurasi Plus Jakarta Sans via Google Fonts di `globals.css`
- [ ] Terapkan semua CSS variables (warna, sidebar, orange palette) dari `SKILL.md`
- [ ] Install Shadcn components yang diperlukan: Button, Input, Form, Dialog, AlertDialog, Avatar, Badge, Card, Skeleton, Select, Textarea, DropdownMenu, Tabs

### 0.2 — Supabase Setup

- [ ] Buat Supabase project baru
- [ ] Enable Email Auth di Supabase Auth settings
- [ ] Konfigurasi email provider (SMTP atau Supabase built-in)
- [ ] Buat file `lib/supabase/client.js`, `lib/supabase/server.js`, `lib/supabase/admin.js` sesuai SKILL.md
- [ ] Tambahkan environment variables ke `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
- [ ] Verifikasi: `SUPABASE_SERVICE_ROLE_KEY` tidak pernah di-prefix `NEXT_PUBLIC_`

### 0.3 — Database: Tabel Foundation

- [ ] Jalankan migration: buat tabel `companies`
  - Kolom: `id`, `slug` (UNIQUE), `name`, `logo_url`, `industry`, `size`, `website`, `created_at`
- [ ] Jalankan migration: buat tabel `profiles`
  - Kolom: `id` (FK → auth.users), `company_id`, `role`, `full_name`, `email`, `avatar_url`, `is_active`, `created_at`
  - Role enum: `super_admin | hr | hiring_manager | boss | employee`
- [ ] Buat database trigger: `auto-create profiles` saat row baru masuk `auth.users`
- [ ] Enable RLS di kedua tabel
- [ ] Buat RLS policy `companies`: SELECT hanya untuk `company_id` yang sama
- [ ] Buat RLS policy `profiles`: SELECT hanya dalam `company_id` yang sama
- [ ] Buat index pada `profiles.company_id`

### 0.4 — Auth & Routing

- [ ] Buat halaman `/login` dengan form email + password
- [ ] Buat halaman `/register` dengan form email, password, nama perusahaan
- [ ] Buat halaman `/reset-password`
- [ ] Buat `middleware.js` yang memproteksi semua route `/dashboard/**` dan `/portal/**`
  - Redirect ke `/login` jika tidak ada session
- [ ] Buat helper function `getProfile(userId)` yang return profile + role
- [ ] Buat helper function `canManage(role)`, `isEmployee(role)`, dll
- [ ] Setelah register: redirect langsung ke `/dashboard` (bukan error page)
- [ ] Company slug auto-generated dari nama perusahaan (lowercase, hyphenated)

### 0.5 — Layout Dashboard

- [ ] Buat `app/(dashboard)/layout.jsx` dengan Sidebar + Topbar
- [ ] Buat `components/layout/Sidebar.jsx` dengan dark styling dari SKILL.md
- [ ] Buat `components/layout/NavItem.jsx` dengan active state orange indicator
- [ ] Buat `components/layout/Topbar.jsx` dengan user avatar + dropdown logout
- [ ] Buat `components/layout/PageHeader.jsx`
- [ ] Buat `app/(dashboard)/page.jsx` sebagai dashboard overview (bisa kosong untuk sekarang)

### ✅ DoD Gate — Fase 0

```
PRODUCT
  [ ] HR bisa register perusahaan baru dengan email dan nama perusahaan
  [ ] HR bisa login, logout, dan reset password via email
  [ ] Setelah register, HR langsung masuk ke dashboard (bukan error page)
  [ ] HR bisa isi company profile: nama, logo, industri, website
  [ ] Super Admin bisa invite user baru via email dan assign role
  [ ] User yang diundang bisa complete registration via link email
  [ ] Setiap role memiliki akses yang berbeda dan terbatas
  [ ] Data perusahaan A tidak bisa dilihat perusahaan B

TECHNICAL
  [ ] Supabase Auth enabled, email provider configured
  [ ] Tabel companies dan profiles sesuai schema v3
  [ ] DB trigger auto-create profiles aktif
  [ ] RLS aktif di companies dan profiles
  [ ] Middleware memproteksi /dashboard/**
  [ ] Role check helper tersedia dan dipakai
  [ ] Company slug auto-generated
  [ ] .env.local lengkap, service role key tidak di client bundle
```

> ⛔ **BLOCKER KERAS**: Lakukan multi-tenant isolation test secara manual:
> Login dengan 2 akun perusahaan berbeda. Pastikan data tidak bocor antar company.
> **Jangan lanjut ke Fase 1 sebelum test ini lulus.**

---

## FASE 1 — Job Posting & Career Page
> HR bisa membuat lowongan. Kandidat bisa melihat tanpa login via career page publik.
> **Estimasi**: 4–5 jam · **Depends on**: Fase 0 selesai

### 1.1 — Database

- [ ] Buat tabel `jobs` sesuai schema v3
  - Kolom: `id`, `company_id`, `created_by`, `title`, `slug`, `description`, `requirements`, `location`, `work_type`, `employment_type`, `status`, `deadline`, `published_at`, `closed_at`, `created_at`
  - Status enum: `draft | published | closed`
- [ ] Buat index pada `jobs.company_id` dan `jobs.status`
- [ ] Enable RLS:
  - SELECT published: public (anon key, tanpa auth)
  - SELECT all (untuk HR): `company_id` match + role hr/super_admin
  - INSERT/UPDATE/DELETE: role hr/super_admin only

### 1.2 — Dashboard HR (Protected)

- [ ] Buat halaman `app/(dashboard)/jobs/page.jsx` — list semua jobs milik company
  - Filter by status: All / Draft / Published / Closed
  - Action: Buat baru, Edit, Publish, Close
- [ ] Buat halaman `app/(dashboard)/jobs/new/page.jsx` — form buat job baru
  - Field: title (wajib), description, requirements, location, work_type, employment_type (wajib), deadline
  - Tombol: Simpan sebagai Draft / Publish langsung
  - Validasi: title wajib, employment_type wajib
- [ ] Buat halaman `app/(dashboard)/jobs/[id]/page.jsx` — edit job
  - Bisa edit semua field meski job sudah Published
  - Tombol Publish / Close / Kembali ke Draft
- [ ] Job slug auto-generated dari title saat save (SEO-friendly, lowercase, hyphenated)

### 1.3 — Career Page Publik

- [ ] Buat halaman `app/[company-slug]/page.jsx` — public career page
  - Tampilkan semua jobs berstatus `published`
  - Jika tidak ada: tampilkan empty state yang proper
  - **Wajib responsive di mobile**
- [ ] Buat halaman `app/[company-slug]/[job-slug]/page.jsx` — job detail
  - Tampilkan semua detail job
  - Tombol "Apply Now" → arahkan ke form apply (Fase 2)
- [ ] Pastikan route ini tidak membutuhkan auth (tidak masuk dalam middleware guard)
- [ ] Tidak ada N+1 query: career page fetch semua jobs dalam 1 query

### ✅ DoD Gate — Fase 1

```
PRODUCT
  [ ] HR bisa buat job post dalam < 5 menit
  [ ] HR bisa simpan sebagai Draft sebelum publish
  [ ] HR bisa publish dan job langsung muncul di career page
  [ ] HR bisa edit job yang sudah published tanpa unpublish dulu
  [ ] HR bisa tutup lowongan — hilang dari career page
  [ ] Career page bisa diakses via /[company-slug] tanpa login
  [ ] Kandidat bisa klik job untuk lihat detail lengkap
  [ ] Empty state muncul jika tidak ada job published

TECHNICAL
  [ ] Tabel jobs sesuai schema v3 + index
  [ ] RLS: SELECT published = public; CRUD = hr/super_admin only
  [ ] Route /[company-slug] tidak butuh auth
  [ ] Route /dashboard/jobs/** diproteksi middleware
  [ ] Job slug auto-generated, SEO-friendly
  [ ] Form validation: title + employment_type wajib
  [ ] Single query di career page (no N+1)
  [ ] Test: publish job → muncul di career page ✓ / close → hilang ✓
  [ ] Mobile responsive di career page
```

---

## FASE 2 — Kandidat Apply & Pipeline Tracking
> Kandidat apply tanpa akun. HR punya pipeline kanban untuk track semua pelamar.
> **Estimasi**: 4–5 jam · **Depends on**: Fase 1 selesai

### 2.1 — Database

- [ ] Buat tabel `applications` sesuai schema v3
  - Kolom: `id`, `job_id`, `company_id`, `referral_id`, `full_name`, `email`, `phone`, `cv_url`, `cover_letter`, `portfolio_url`, `stage`, `rejection_reason`, `internal_notes`, `created_at`, `updated_at`
  - Stage enum: `applied | screening | assessment | interview | offering | hired | rejected`
  - UNIQUE constraint: `(job_id, email)`
- [ ] Buat tabel `stage_history` sesuai schema v3
  - Kolom: `id`, `application_id`, `from_stage`, `to_stage`, `changed_by`, `message_to_candidate`, `created_at`
- [ ] Buat database trigger: auto-INSERT ke `stage_history` saat `applications.stage` berubah
- [ ] Enable RLS:
  - `applications` INSERT: public (anon key)
  - `applications` SELECT/UPDATE: hr/hiring_manager/boss + company_id match
  - `stage_history` SELECT: hr/hiring_manager/boss + company_id match
  - `stage_history` INSERT: hanya via trigger (aplikasi tidak insert langsung)
- [ ] Setup Supabase Storage: buat bucket `cvs`, policy authenticated read only

### 2.2 — Form Apply Publik

- [ ] Buat halaman `app/[company-slug]/[job-slug]/apply/page.jsx`
  - Field: nama (wajib), email (wajib), phone, upload CV (max 5MB, .pdf/.doc/.docx), cover letter (opsional)
  - CV upload ke bucket `cvs` via signed URL sebelum submit
  - Submit → INSERT ke `applications` dengan anon key
  - Duplicate apply (sama email + job) → error dengan pesan yang jelas
  - Setelah submit: halaman sukses dengan instruksi cek email
  - **Wajib responsive di mobile**

### 2.3 — Pipeline Dashboard HR

- [ ] Buat halaman `app/(dashboard)/candidates/page.jsx` — semua kandidat lintas job
  - Filter: by stage, by job, search nama/email, by tanggal
- [ ] Buat halaman `app/(dashboard)/jobs/[id]/candidates/page.jsx` — pipeline per job
  - Tampilan kanban: kolom per stage
  - Drag-and-drop atau manual pindah stage
  - Fetch semua applicant 1 job dalam 1 query `.eq('job_id', id)`
- [ ] Buat halaman `app/(dashboard)/candidates/[id]/page.jsx` — detail kandidat
  - Info lengkap, CV download, stage history, catatan internal HR
  - Tombol pindah stage dengan optional pesan ke kandidat
- [ ] Buat `components/candidates/CandidateCard.jsx` sesuai SKILL.md
- [ ] Buat `components/candidates/StageBadge.jsx` dengan warna per stage
- [ ] Buat `components/candidates/StageSelect.jsx` untuk pindah stage

### ✅ DoD Gate — Fase 2

```
PRODUCT
  [ ] Kandidat bisa apply via form publik tanpa buat akun
  [ ] Field: nama, email, phone, CV, cover letter (opsional)
  [ ] Kandidat tidak bisa apply dua kali (sama email + job)
  [ ] HR melihat pelamar dalam tampilan list dan kanban
  [ ] HR bisa pindah stage (drag-drop atau manual)
  [ ] HR bisa download CV dari dashboard
  [ ] HR bisa tambah catatan internal
  [ ] HR bisa filter by stage, tanggal, search nama/email
  [ ] Setiap perpindahan stage tersimpan sebagai history

TECHNICAL
  [ ] Tabel applications + stage_history sesuai schema v3
  [ ] RLS applications INSERT = public; SELECT = company only
  [ ] Bucket cvs: authenticated read only
  [ ] UNIQUE constraint (job_id, email) aktif
  [ ] stage_history via DB trigger (bukan manual insert dari app)
  [ ] Kanban fetch 1 job dalam single query
  [ ] File size limit CV: max 5MB, accepted pdf/doc/docx
  [ ] Test: apply → history tercatat ✓ / double apply → error ✓
```

---

## FASE 3 — Notifikasi Status Kandidat
> Kandidat selalu tahu status lamarannya. Email otomatis dikirim setiap perubahan stage.
> **Estimasi**: 3–4 jam · **Depends on**: Fase 2 selesai

### 3.1 — Email Service Setup

- [ ] Pilih dan setup email provider: **Resend** (direkomendasikan, free tier 3000/bulan)
  ```bash
  npm install resend
  ```
- [ ] Tambahkan `RESEND_API_KEY` ke `.env.local`
- [ ] Konfigurasi From email: `noreply@[domain]` dengan Reply-To ke email HR

### 3.2 — Email Templates

- [ ] Buat folder `lib/email/templates/`
- [ ] Buat template per stage (HTML atau React Email):
  - `applied.jsx` — konfirmasi apply berhasil
  - `screening.jsx` — kandidat masuk screening
  - `assessment.jsx` — kandidat diminta kerjakan assessment
  - `interview.jsx` — kandidat diundang interview
  - `offering.jsx` — kandidat menerima penawaran
  - `hired.jsx` — selamat, kandidat diterima
  - `rejected.jsx` — penolakan yang sopan dan profesional
- [ ] Setiap template berisi: nama kandidat, nama posisi, nama perusahaan, status, pesan custom (opsional)

### 3.3 — Email Trigger

- [ ] Buat `app/api/notifications/stage-change/route.js`
  - Dipanggil setelah `stage_history` row baru dibuat
  - Input: `applicationId`, `toStage`, `message` (opsional dari HR)
  - Idempotency check: cek apakah notifikasi untuk stage ini sudah pernah dikirim
  - Kirim email async (tidak blocking response HR)
  - Error handling: jika email gagal → log error, jangan fail operasi stage update
- [ ] Integrasikan trigger email ke flow pindah stage di pipeline dashboard
- [ ] HR bisa tambah pesan custom sebelum kirim notifikasi
- [ ] HR bisa preview email sebelum dikirim

### ✅ DoD Gate — Fase 3

```
PRODUCT
  [ ] Kandidat terima email otomatis setiap stage berubah
  [ ] Email berisi: nama kandidat, posisi, perusahaan, status, pesan jelas
  [ ] HR bisa tambah pesan custom sebelum kirim
  [ ] HR bisa preview email
  [ ] Tidak ada email dobel untuk 1 perubahan stage
  [ ] Template berbeda per stage (terasa berbeda tone-nya)
  [ ] Kandidat reject terima email penolakan yang sopan

TECHNICAL
  [ ] Resend terintegrasi dengan API key di env
  [ ] Template per stage tersimpan di codebase
  [ ] Trigger email setelah stage_history dibuat
  [ ] Idempotency check aktif
  [ ] Email dikirim async
  [ ] Error email tidak gagalkan operasi stage update
  [ ] From: noreply@domain, Reply-To: email HR
  [ ] Test: pindah stage → email masuk < 30 detik ✓
  [ ] Test: pindah stage 2x cepat → tidak ada email dobel ✓
```

---

## FASE 4 — Assessment Builder & Runner
> HR buat assessment kustom. Kandidat kerjakan via link unik tanpa login.
> **Estimasi**: 7–8 jam · **Depends on**: Fase 2 selesai (pipeline kandidat)

### 4.1 — Database

- [ ] Buat tabel `assessments`, `questions`, `assessment_assignments`, `answers` sesuai schema v3
- [ ] CHECK constraint di `assessment_assignments`: `(application_id IS NOT NULL) OR (employee_id IS NOT NULL)`
- [ ] `assessment_assignments.token` = `gen_random_uuid()` saat row dibuat
- [ ] Enable RLS:
  - `assessment_assignments` SELECT: public via token match (no auth)
  - `assessment_assignments` UPDATE (start/submit): public via token
  - `answers` INSERT: public via token
  - HR SELECT all: company_id match

### 4.2 — Assessment Builder (HR)

- [ ] Buat halaman `app/(dashboard)/assessments/page.jsx` — list semua assessment
- [ ] Buat halaman `app/(dashboard)/assessments/new/page.jsx` — buat assessment baru
  - Field: nama, deskripsi, durasi timer (menit)
  - Tambah soal dengan 4 tipe: multiple choice, essay, scale rating, situational scenario
  - Set bobot poin per soal
  - Drag-and-drop urutan soal
- [ ] Buat halaman `app/(dashboard)/assessments/[id]/page.jsx` — edit assessment
- [ ] Buat fitur assign assessment ke kandidat dari pipeline view
  - INSERT `assessment_assignments` dengan token unik
  - Kirim email ke kandidat berisi link `/assessment/[token]`

### 4.3 — Assessment Runner (Publik)

- [ ] Buat halaman `app/assessment/[token]/page.jsx` — public, tanpa auth
  - Fetch `assessment_assignments` via token → validasi expired/completed
  - Landing page: info assessment, durasi, instruksi
  - Tombol Mulai → UPDATE `started_at = now()`
- [ ] Buat halaman `app/assessment/[token]/run/page.jsx` — halaman pengerjaan
  - Timer countdown berbasis `started_at` dari DB (bukan `Date.now()`)
  - Satu soal per layar atau semua soal sekaligus (sesuai UX preference)
  - Tab switching detection via `document.addEventListener('visibilitychange')`
  - Setiap tab switch → POST ke API increment `tab_switch_count`
  - Auto-submit saat timer habis via `useEffect` interval check
  - Kandidat tidak bisa kembali ke soal setelah submit
- [ ] Buat `app/api/assessment/submit/route.js`
  - INSERT semua `answers`
  - Auto-score multiple choice: bandingkan `answer_text` vs `correct_answer`
  - Essay: `is_reviewed = false`
  - UPDATE `assessment_assignments.status = 'completed'`, `submitted_at = now()`
  - Hitung `total_score`

### 4.4 — Hasil Assessment (HR)

- [ ] Buat halaman `app/(dashboard)/assessments/[id]/results/page.jsx`
  - List semua kandidat yang mengerjakan
  - Score per kandidat, tab switch count
  - Bandingkan score antar kandidat dalam 1 job
- [ ] Essay review queue: list jawaban essay yang `is_reviewed = false`
  - HR bisa set score manual dan add reviewer notes

### ✅ DoD Gate — Fase 4

```
PRODUCT
  [ ] HR bisa buat assessment dengan nama, deskripsi, durasi
  [ ] HR bisa tambah 4 tipe soal
  [ ] HR bisa set bobot per soal dan urutan
  [ ] HR bisa assign assessment ke kandidat dari pipeline
  [ ] Kandidat terima email berisi link assessment unik
  [ ] Kandidat bisa kerjakan via link tanpa akun
  [ ] Timer berjalan mundur, auto-submit saat habis
  [ ] Kandidat tidak bisa kembali ke soal setelah submit
  [ ] HR lihat hasil dan score semua kandidat dalam 1 job
  [ ] MC ter-score otomatis, essay masuk review manual
  [ ] HR lihat log tab switching per kandidat

TECHNICAL
  [ ] 4 tabel sesuai schema v3
  [ ] token = gen_random_uuid() saat assignment dibuat
  [ ] Route /assessment/[token] = public, no auth
  [ ] CHECK constraint (application_id OR employee_id) aktif
  [ ] Tab switch via visibilitychange event
  [ ] Timer berbasis started_at dari DB (bukan client time)
  [ ] Auto-submit via useEffect interval
  [ ] expires_at = started_at + duration + 10 menit buffer
  [ ] Test: tab switch → count naik ✓ / timer habis → auto-submit ✓
```

---

## FASE 5 — Interview Scheduling
> HR jadwalkan interview, assign interviewer, semua pihak dapat notifikasi.
> **Estimasi**: 3–4 jam · **Depends on**: Fase 3 (email), Fase 2 (pipeline)

### 5.1 — Database

- [ ] Buat tabel `interviews` dan `interview_interviewers` sesuai schema v3
- [ ] Enable RLS: SELECT hanya hr/hiring_manager/boss dalam company yang sama
- [ ] UPDATE status: hanya hr atau interviewer yang terkait

### 5.2 — Interview Scheduler (HR)

- [ ] Buat halaman `app/(dashboard)/interviews/page.jsx` — list semua jadwal
  - Filter by job, status, tanggal
- [ ] Buat form buat interview baru (di dalam detail kandidat atau halaman tersendiri)
  - Field: tanggal & waktu, durasi, format (online/offline), link meeting / lokasi
  - Assign satu atau lebih interviewer (multi-select dari list profiles)
  - Setelah save: email otomatis ke kandidat DAN semua interviewer
- [ ] Buat tombol update status: Done / Rescheduled / No Show
- [ ] Buat field notes untuk catatan hasil interview
  - Hanya bisa diisi oleh profile_id yang ada di `interview_interviewers`

### 5.3 — Quick Win: Interview Scorecard (5B)

- [ ] Buat tabel `scorecard_templates`, `scorecard_criteria`, `scorecard_results` sesuai schema v3
- [ ] CHECK constraint: `score BETWEEN 1 AND 5`
- [ ] Buat halaman `app/(dashboard)/interviews/scorecards/page.jsx`
  - CRUD template scorecard
  - Tambah kriteria dengan bobot (validasi: total weight harus = 1.0 sebelum save)
- [ ] Buat form isi scorecard (muncul di detail interview saat status = Done)
  - Interviewer isi nilai 1–5 per kriteria + catatan opsional
  - Hitung weighted average: `SUM(score × weight) / SUM(weight)` di frontend
- [ ] Buat view perbandingan scorecard semua kandidat dalam 1 job (side by side)

### ✅ DoD Gate — Fase 5

```
PRODUCT
  [ ] HR bisa buat jadwal interview: tanggal, waktu, durasi, format
  [ ] HR bisa assign satu atau lebih interviewer
  [ ] Kandidat terima email undangan dengan detail + link meeting
  [ ] Interviewer terima notifikasi email saat di-assign
  [ ] HR bisa update status: Done / Rescheduled / No Show
  [ ] Interviewer bisa tambah catatan setelah sesi
  [ ] HR lihat semua jadwal dalam list per job
  [5B] HR bisa buat template scorecard dengan kriteria berbobot
  [5B] Interviewer isi nilai 1–5 per kriteria
  [5B] HR lihat weighted score per kandidat otomatis
  [5B] HR bisa bandingkan scorecard antar kandidat side by side

TECHNICAL
  [ ] Tabel interviews + interview_interviewers sesuai schema v3
  [ ] RLS: hr/hiring_manager/boss SELECT; update status oleh hr/interviewer terkait
  [ ] Email ke kandidat DAN interviewer saat interview dibuat
  [ ] Catatan hanya bisa diisi oleh interviewer terkait
  [5B] 3 tabel scorecard sesuai schema v3
  [5B] CHECK constraint score 1-5 aktif
  [5B] Validasi total weight = 1.0 sebelum save template
  [5B] Test: isi scorecard → weighted score benar ✓
```

---

## 🚀 PILOT CHECKPOINT
> **Setelah Fase 0–5 selesai**, platform siap untuk pilot 15 hari.
> Fase 6, 7, dan Quick Wins bisa didemonstrasikan sebagai "coming soon"
> untuk mengukur interest HR sebelum dibangun lebih lanjut.

**Sebelum pilot, pastikan Global DoD berikut terpenuhi:**

```
DATABASE
  [ ] Semua tabel Fase 0–5 (12 tabel) sesuai schema v3
  [ ] RLS aktif di SEMUA tabel
  [ ] Index pada company_id, job_id, application_id, created_at (tabel volume tinggi)
  [ ] Foreign key constraints aktif
  [ ] Database backup otomatis aktif di Supabase

SECURITY
  [ ] Service Role Key hanya di server-side env variable
  [ ] Rate limiting di public endpoints: /apply, /assessment/[token]
  [ ] File upload validasi tipe + ukuran di server-side
  [ ] HTTPS only

PERFORMANCE
  [ ] Tidak ada N+1 query di semua list view
  [ ] Pagination di list dengan > 20 item potensial
  [ ] Loading state di semua async operation

TESTING MINIMUM
  [ ] Happy path test: setiap alur utama jalan dari awal ke akhir
  [ ] Multi-tenant test: 2 company berbeda tidak bisa lihat data satu sama lain
  [ ] Role test: setiap role hanya akses halaman yang sesuai
  [ ] Mobile test: career page + form apply berfungsi di mobile browser
  [ ] Email test: semua trigger email terkirim ke inbox (bukan spam)
```

---

## FASE 6 — Employee Performance & Monitoring
> Sistem monitoring performa dari hari pertama masuk: probation, aktif, hingga PIP.
> **Estimasi**: 12–14 jam · **Paralel dengan Fase 7** (bisa mulai setelah Fase 0 selesai)

### 6.1 — Database (9 tabel)

- [ ] Buat tabel `employees` sesuai schema v3
- [ ] Buat tabel `work_periods` sesuai schema v3
  - `decision` hanya bisa diset jika `acknowledged_by IS NULL`
  - UPDATE `acknowledged_by`: hanya role boss
- [ ] Buat tabel `okrs` dan `okr_updates` sesuai schema v3
- [ ] Buat tabel `work_logs` dan `acknowledgements` sesuai schema v3
- [ ] Buat tabel `onboarding_templates`, `onboarding_tasks`, `onboarding_progress` sesuai schema v3
- [ ] DB function: auto-populate `onboarding_progress` saat employee di-assign template
- [ ] Enable semua RLS sesuai policy (employee lihat milik sendiri; hr/boss lihat semua)
- [ ] Index pada `employee_id`, `company_id`, `work_period_id`

### 6.2 — HR Dashboard: Onboarding

- [ ] Buat CRUD template checklist onboarding di `app/(dashboard)/employees/onboarding/`
- [ ] Buat fitur assign template ke karyawan baru
- [ ] Buat view completion rate semua karyawan dalam 1 halaman

### 6.3 — HR Dashboard: OKR Management

- [ ] Buat halaman buat/edit OKR per karyawan per periode
- [ ] HR bisa approve atau request revision update OKR
- [ ] Boss bisa lihat OKR semua karyawan di departemennya (filter departemen)

### 6.4 — Employee Portal

- [ ] Buat `app/(portal)/layout.jsx` — layout berbeda dari dashboard HR
- [ ] Buat `app/(portal)/onboarding/page.jsx` — checklist onboarding karyawan
  - UPDATE `onboarding_progress` saat karyawan centang task
- [ ] Buat `app/(portal)/okrs/page.jsx` — OKR yang di-assign
  - Form update progress mingguan + catatan konteks
- [ ] Buat `app/(portal)/logs/page.jsx` — work log karyawan
  - Tambah entry kapan saja: judul, deskripsi, kategori, tanggal
  - Tombol tandai sebagai highlight

### 6.5 — Performance Dashboard

- [ ] Buat `app/(dashboard)/employees/[id]/performance/page.jsx`
  - Tampilkan: overall score, status (On Track/Needs Attention/At Risk), trend OKR, ringkasan work log
  - Formula: `(weighted_okr × 0.6) + (activity_score × 0.4)`
  - Status: ≥70 = On Track | 40–69 = Needs Attention | <40 = At Risk
  - Key Takeaways: rule-based dari pola data (bukan AI)
  - HR bisa export data performa ke CSV
- [ ] Buat `app/(dashboard)/employees/page.jsx` — Team Dashboard
  - Filter by departemen
  - Acknowledgement Boss pada work log entry
- [ ] Buat flow keputusan fase:
  - HR set decision + catatan wajib
  - Boss acknowledge → keputusan final
  - Setelah final: auto-create `work_period` baru untuk fase berikutnya

### ✅ DoD Gate — Fase 6

```
PRODUCT
  [ ] HR bisa buat + assign template onboarding
  [ ] Karyawan login ke portal dan lihat checklist
  [ ] Karyawan bisa centang task progress
  [ ] HR dan Boss lihat completion rate semua karyawan
  [ ] HR bisa buat OKR per karyawan per periode
  [ ] Karyawan update progress OKR mingguan
  [ ] HR/Manager approve atau request revision update OKR
  [ ] Karyawan bisa tambah work log dengan kategori
  [ ] HR/Boss bisa berikan acknowledgement per log
  [ ] Individual Performance Dashboard: score, status, trend, key takeaways
  [ ] HR buat keputusan fase dengan catatan wajib
  [ ] Boss acknowledge keputusan → baru final
  [ ] HR export performa ke CSV

TECHNICAL
  [ ] 9 tabel sesuai schema v3 + index
  [ ] RLS: employee lihat milik sendiri; hr/boss lihat semua company
  [ ] RLS work_periods: decision oleh hr; acknowledged_by hanya boss
  [ ] DB function onboarding_progress auto-populate
  [ ] Formula skor diimplementasi di frontend
  [ ] Keputusan tanpa boss ack harus gagal
  [ ] Test: OKR update → score berubah ✓ / keputusan tanpa ack → error ✓
```

---

## FASE 7 — LMS (Learning Management System)
> Mini LMS terintegrasi. HR buat course dengan video + quiz. Karyawan belajar dalam satu platform.
> **Estimasi**: 8–10 jam · **Paralel dengan Fase 6**

### 7.1 — Database (8 tabel)

- [ ] Buat tabel `lms_courses`, `lms_course_sections`, `lms_course_contents` sesuai schema v3
- [ ] Buat tabel `lms_learning_paths`, `lms_path_courses` sesuai schema v3
- [ ] Buat tabel `lms_course_assignments` sesuai schema v3
  - CHECK constraint: `(course_id IS NOT NULL) OR (learning_path_id IS NOT NULL)`
- [ ] Buat tabel `lms_course_progress`, `lms_content_progress` sesuai schema v3
- [ ] Enable RLS:
  - `lms_content_progress`: employee SELECT/UPDATE hanya milik sendiri
  - `lms_courses`: HR INSERT/UPDATE; semua member SELECT course published

### 7.2 — Course Management (HR)

- [ ] Buat CRUD course di `app/(dashboard)/lms/courses/`
  - Field: judul, deskripsi, thumbnail, kategori
  - Tambah section sebagai bab/topik
  - Per section: tambah konten tipe video (URL eksternal), teks/markdown, atau quiz
- [ ] Video embed: YouTube iframe API atau Vimeo Player SDK (jangan custom player)
- [ ] Quiz di LMS: link ke tabel `assessments` yang sudah ada, `duration_minutes = null`
- [ ] Buat CRUD learning path: kumpulan course berurutan
- [ ] Buat fitur assign course/learning path ke karyawan dengan deadline

### 7.3 — Portal Karyawan: LMS

- [ ] Buat `app/(portal)/courses/page.jsx` — daftar course yang di-assign
- [ ] Buat `app/(portal)/courses/[id]/page.jsx` — halaman belajar
  - Video embed dengan progress tracking
  - POST ke `app/api/lms/progress/route.js` setiap 10 detik saat video diputar
  - `is_completed = true` jika `watch_duration >= duration_mins × 60 × 0.8` (80% threshold)
  - Teks/markdown bisa di-scroll, tandai selesai saat dibuka
  - Quiz terintegrasi via assessment runner yang sudah ada
- [ ] Progress otomatis tersimpan, bisa dilanjutkan kapan saja

### 7.4 — Sertifikat (QW5 terintegrasi)

- [ ] Buat tabel `lms_certificates` sesuai schema v3
- [ ] Trigger: saat `completion_percentage = 100` → INSERT ke `lms_certificates`
- [ ] Generate PDF sertifikat menggunakan `@react-pdf/renderer`
  - Konten: nama karyawan, judul course, tanggal selesai, nama perusahaan, nomor sertifikat
  - Format `certificate_number`: `CERT-[YYYY]-[company 4 char]-[incremental 4 digit]`
- [ ] Simpan PDF ke Supabase Storage bucket `certificates` (public read)
- [ ] Update `lms_certificates.pdf_url` setelah PDF berhasil digenerate
- [ ] Karyawan bisa download sertifikat dari portal

### ✅ DoD Gate — Fase 7

```
PRODUCT
  [ ] HR bisa buat course dengan section dan konten
  [ ] Video YouTube/Vimeo bisa di-embed dan diputar
  [ ] HR bisa buat learning path dari kumpulan course
  [ ] HR bisa assign course/path ke karyawan dengan deadline
  [ ] Karyawan lihat daftar course yang di-assign di portal
  [ ] Progress tersimpan dan bisa dilanjutkan kapan saja
  [ ] Sertifikat otomatis diterbitkan saat 100% selesai
  [ ] Karyawan bisa download sertifikat PDF
  [ ] HR dan Boss lihat completion rate per course

TECHNICAL
  [ ] 8 tabel sesuai schema v3 dengan prefix lms_
  [ ] CHECK constraint lms_course_assignments aktif
  [ ] Video: YouTube/Vimeo iframe SDK (bukan custom player)
  [ ] Watch duration tracking via API setiap 10 detik
  [ ] is_completed = true di 80% durasi
  [ ] Quiz LMS reuse tabel assessments, duration_minutes = null
  [ ] Sertifikat auto-generate saat 100%
  [ ] Test: tonton 80% → is_completed true ✓ / 100% → sertifikat ter-generate ✓
```

---

## FASE QW — Quick Win Features
> Effort kecil, dampak besar. Dibangun setelah pilot dan jadi selling point versi berbayar.
> **Estimasi total**: ~12–14 jam untuk semua 6 QW

### QW1 — Employee Referral Program
_Estimasi: 2–3 jam_

- [ ] Buat tabel `referral_programs` dan `employee_referrals` sesuai schema v3
- [ ] HR aktifkan program referral per job
- [ ] Karyawan generate link referral unik: `/apply/[job-slug]?ref=[referral_token]`
- [ ] Saat kandidat apply dengan ref token → `applications.referral_id` terisi otomatis
- [ ] DB trigger: `employee_referrals.status` auto-update saat kandidat `stage = hired`
- [ ] HR view: siapa yang mereferral, kandidat siapa, status saat ini

**DoD**: apply via link → `referral_id` terisi ✓ / kandidat hired → status referral = hired ✓

---

### QW2 — Offer Letter Generator
_Estimasi: 3–4 jam_

- [ ] Buat tabel `offer_templates` dan `offer_letters` sesuai schema v3
- [ ] HR buat template dengan variabel: `{{candidate_name}}`, `{{position}}`, `{{start_date}}`, `{{salary}}`, `{{company_name}}`, `{{deadline}}`
- [ ] Generate: replace semua variabel → simpan ke `offer_letters.body`
- [ ] `offer_letters.token = gen_random_uuid()` → akses publik via `/offer/[token]`
- [ ] Kandidat buka link tanpa login → Accept atau Decline
- [ ] Expired check real-time: jika `expires_at < now()` → status expired
- [ ] HR lihat status real-time: Draft / Sent / Accepted / Declined / Expired

**DoD**: generate → kirim → accept via link → status = accepted ✓

---

### QW3 — Smart Reminders
_Estimasi: 1–2 jam_

- [ ] Buat tabel `reminders` sesuai schema v3
- [ ] Auto-insert reminder saat `work_period` dibuat: `trigger_date = end_date - 7` (probation ending)
- [ ] Cron job harian (Supabase `pg_cron` atau Vercel Cron):
  - SELECT reminders WHERE `trigger_date = TODAY` AND `is_sent = false`
  - Kirim email ke semua profile_id dalam `notify_profiles` array
  - UPDATE: `is_sent = true, sent_at = now()`
- [ ] Reminder OKR: cron mingguan, insert reminder jika `progress < 50` di hari ke-45 periode

**DoD**: trigger_date = today → cron jalan → email terkirim → is_sent = true ✓

---

### QW4 — Candidate Experience Survey
_Estimasi: 1–2 jam_

- [ ] Buat tabel `candidate_surveys` sesuai schema v3
- [ ] Auto-create survey + kirim email saat stage berubah ke `hired` atau `rejected` (via trigger)
- [ ] `candidate_surveys.token = gen_random_uuid()` → akses via `/survey/[token]` tanpa login
- [ ] Form survey: overall rating, process clarity, communication rating (1–5), feedback teks
- [ ] HR dashboard: aggregate AVG rating per dimensi

**DoD**: reject kandidat → survey email terkirim ✓ / isi survey → data tersimpan ✓

---

### QW5 — LMS Certificate Generator
_(Sudah diintegrasikan di Fase 7, section 7.4)_

---

### QW6 — Bulk Import via CSV
_Estimasi: 2–3 jam_

- [ ] Buat tabel `bulk_imports` sesuai schema v3
- [ ] Sediakan template CSV download di `/templates/employees-template.csv`
- [ ] Upload CSV: parse dengan `papaparse` di server-side API route
- [ ] Validasi per baris: email valid, role valid, department tidak kosong, join_date format benar
- [ ] Baris valid: INSERT ke `profiles` + `employees`; baris invalid: tambah ke `error_log`
  - Format: `[{row: 3, field: "email", reason: "format tidak valid"}, ...]`
- [ ] Status: `processing → completed/failed`
- [ ] Proses async: return `bulk_import.id` langsung, frontend polling status setiap 2 detik

**DoD**: upload 10 baris (8 valid, 2 error) → 8 karyawan masuk, error_log 2 entry ✓

---

## RINGKASAN TIMELINE

| Fase | Fitur | Estimasi | Depends On | Prioritas |
|---|---|---|---|---|
| 0 | Foundation & Auth | 3–4 jam | — | 🔴 Kritikal |
| 1 | Job Posting & Career Page | 4–5 jam | Fase 0 | 🔴 Kritikal |
| 2 | Apply & Pipeline | 4–5 jam | Fase 1 | 🔴 Kritikal |
| 3 | Email Notifikasi | 3–4 jam | Fase 2 | 🔴 Kritikal |
| 4 | Assessment | 7–8 jam | Fase 2 | 🔴 Kritikal |
| 5 | Interview + Scorecard | 3–4 jam | Fase 3 | 🔴 Kritikal |
| — | **🚀 PILOT** | — | Fase 0–5 | ✅ Gate |
| 6 | Employee Performance | 12–14 jam | Fase 0 | 🟡 Post-pilot |
| 7 | LMS | 8–10 jam | Fase 0 | 🟡 Post-pilot |
| QW | 6 Quick Wins | ~12–14 jam | Fase 6–7 | 🟢 Selling point |
| — | **Total** | **~55–65 jam** | — | — |

---

## GLOBAL TECHNICAL DoD
> Berlaku untuk SEMUA fase. Harus terpenuhi sebelum platform dianggap siap.

### Database & Supabase
- [ ] Semua 38 tabel dibuat sesuai schema v3 — tidak ada missing column
- [ ] RLS aktif di SEMUA tabel — tidak ada tabel yang terlewat
- [ ] Index pada: `company_id` (semua tabel), `employee_id`, `application_id`, `job_id`, `created_at` (tabel volume tinggi)
- [ ] Database backup otomatis aktif
- [ ] Semua foreign key constraint aktif dengan ON DELETE behavior yang tepat

### Security
- [ ] Service Role Key HANYA di env server-side, tidak pernah di client bundle
- [ ] Semua public endpoints (apply, assessment token, offer token) ada rate limiting
- [ ] File upload: validasi tipe + ukuran di server-side (bukan hanya client)
- [ ] Input sanitization sebelum masuk database
- [ ] HTTPS only

### Performance
- [ ] Tidak ada N+1 query — semua list view single query dengan JOIN
- [ ] Pagination di semua list dengan > 20 item potensial
- [ ] Loading state di semua async operation (Skeleton, bukan blank screen)
- [ ] Image/file dari Storage menggunakan CDN URL

### Testing Minimum Sebelum Pilot
- [ ] Happy path test per modul: alur utama jalan dari awal ke akhir
- [ ] Multi-tenant test: 2 company tidak bisa lihat data satu sama lain
- [ ] Role test: setiap role hanya akses halaman yang sesuai
- [ ] Mobile test: career page + form apply berfungsi di mobile
- [ ] Email delivery test: semua trigger email masuk inbox (bukan spam)