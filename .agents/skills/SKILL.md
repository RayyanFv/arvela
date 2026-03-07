---
name: Arvela
description: >
  Master skill untuk proyek Arvela — HR SaaS platform. WAJIB dibaca sebelum membuat komponen,
  halaman, query, atau fitur apapun. Gunakan skill ini kapanpun ada permintaan terkait Arvela:
  halaman dashboard, pipeline kandidat, form apply, assessment, LMS, performa karyawan, atau
  komponen UI apapun. Berisi design system, konvensi Supabase JS, navigasi schema 38 tabel,
  dan task brief template. Jangan pernah build Arvela tanpa membaca ini dulu.
---

# Arvela — Master Development Skill

**Stack**: Next.js 14 App Router · Supabase JS v2 · Shadcn/UI · Tailwind CSS v4 · JavaScript (bukan TypeScript)
**DB**: PostgreSQL via Supabase · 38 tabel · Multi-tenant (`company_id` di setiap tabel)

---

## NAVIGASI — Baca File yang Relevan

| Situasi | File yang dibaca |
|---|---|
| Build halaman / komponen UI | File ini cukup |
| Butuh kolom detail suatu tabel | `references/schema.md` |
| Butuh tahu RLS / siapa bisa akses apa | `references/rls.md` |
| Butuh komponen UI siap pakai | `references/components.md` |
| Butuh tahu data flow suatu fitur | `references/flows.md` |
| Butuh contoh query Fase 1-2 (jobs, applications) | `queries.md` |

---

## BAGIAN 1 — TASK BRIEF TEMPLATE

> Setiap kali membangun fitur baru, AI harus mengisi template ini sebelum mulai coding.

```
TASK: [nama halaman/komponen]
MODULE: [nomor modul: 0/1/2/4/5/5B/6/7/QW]

WHAT TO BUILD:
  [deskripsi singkat 1-2 kalimat]

TABLES USED:
  - [tabel]: READ / WRITE / BOTH

USER FLOW:
  1. [langkah 1]
  2. [langkah 2]

ACCESS CONTROL:
  Route type: PUBLIC atau PROTECTED
  Roles: [super_admin | hr | hiring_manager | boss | employee | anonymous]

BUSINESS RULES:
  - [constraint penting]
  - [validasi wajib]
```

---

## BAGIAN 2 — ATURAN WAJIB (NEVER VIOLATE)

### Multi-tenancy
1. **Setiap query WAJIB filter `company_id`** — RLS adalah safety net, bukan pengganti filter.
2. **Setiap INSERT WAJIB menyertakan `company_id`** dari session user, bukan dari input user.
3. **Validasi `company_id`** di semua server actions sebelum UPDATE/DELETE.

### Keamanan
4. **`SUPABASE_SERVICE_ROLE_KEY`** hanya di `/app/api/**` dan server actions. TIDAK PERNAH di client.
5. **Akses publik tanpa auth** hanya via `token` UUID — untuk: assessment, offer, survey, referral, career page.
6. **CV storage** — bucket `cvs`, authenticated read only. Upload via signed URL.

### Data Integrity
7. **`stage_history`** — TIDAK diinsert manual. Selalu via database trigger saat `applications.stage` berubah.
8. **Assessment timer** — berbasis `started_at` dari DB server, bukan `Date.now()` di browser.
9. **Scorecard weight** — validasi `SUM(weight) === 1.0` di frontend sebelum simpan template.
10. **Double apply** — unique constraint `(job_id, email)` sudah di DB; handle Postgres error code `23505`.
11. **`work_periods` decision** — hanya final setelah `acknowledged_by` diisi Boss. HR tidak bisa bypass.

### Frontend
12. Semua form → `react-hook-form` + `zod`
13. Loading state → Shadcn `Skeleton`
14. Destructive action → Shadcn `AlertDialog`
15. Mobile responsive wajib untuk career page + form apply
16. Tidak ada N+1 query — fetch relasi dalam satu query: `.select('*, jobs(title)')`
17. **DILARANG KERAS menggunakan emoji** di seluruh kode (JSX, teks UI, komentar, placeholder) tanpa terkecuali. Gunakan ikon `lucide-react` sebagai gantinya.

---

## BAGIAN 3 — DESIGN SYSTEM

> **ATURAN**: Semua warna WAJIB menggunakan Tailwind class token dari `globals.css`.
> DILARANG menulis `bg-[hsl(...)]`, `text-[hsl(...)]`, `bg-[#...]`, atau nilai warna apapun secara hardcode.

### Typography — Plus Jakarta Sans

Font di-load via `next/font/google` dan dikonfigurasi di `layout.js`. Cukup gunakan class Tailwind.

| Usage | Class |
|---|---|
| Page title (H1) | `text-3xl font-bold` |
| Section title (H2) | `text-2xl font-semibold` |
| Card title (H3) | `text-lg font-semibold` |
| Body default | `text-sm font-normal` |
| Label / caption | `text-xs font-medium` |

---

### Color Tokens — Tailwind Classes

Semua token berikut sudah ter-declare di `src/app/globals.css` dalam `@theme`. Gunakan langsung sebagai class Tailwind.

#### Shadcn / UI Semantic (Gunakan ini untuk komponen)

| Intent | Background | Text | Border |
|---|---|---|---|
| Default page | `bg-background` | `text-foreground` | `border-border` |
| Card / surface | `bg-card` | `text-card-foreground` | — |
| Primary action | `bg-primary` | `text-primary-foreground` | — |
| Primary hover | `hover:bg-brand-600` | — | — |
| Muted / subtle | `bg-muted` | `text-muted-foreground` | — |
| Accent / highlight | `bg-accent` | `text-accent-foreground` | — |
| Destructive / error | `bg-destructive` | `text-destructive-foreground` | — |
| Input field | `bg-input` | — | `border-input` |
| Ring / focus | — | — | `ring-ring` |

#### Sidebar Tokens

| Intent | Class |
|---|---|
| Sidebar background | `bg-sidebar-bg` |
| Sidebar text (aktif/putih) | `text-sidebar-text` |
| Sidebar teks redup | `text-sidebar-muted` |
| Sidebar garis pemisah | `border-sidebar-border` |
| Nav item aktif | `bg-sidebar-active` |

#### Brand Orange Tokens

| Token | Class | Kegunaan umum |
|---|---|---|
| Brand lightest | `bg-brand-50` | Background ikon, tag ringan |
| Brand light | `bg-brand-100` | Hover bg button ghost |
| Brand medium | `text-brand-400` / `bg-brand-400` | Ikon accent |
| Brand primary | `bg-primary` / `text-primary` | Tombol utama, link aktif |
| Brand hover | `hover:bg-brand-600` | Hover state tombol primary |
| Brand dark | `text-brand-700` | Teks di atas bg brand-100 |

---

### Stage Badge Config

```js
// lib/constants/stages.js — gunakan token Tailwind, bukan hsl manual
export const STAGE_CONFIG = {
  applied:    { label: 'Applied',     bg: 'bg-muted',       text: 'text-muted-foreground' },
  screening:  { label: 'Screening',   bg: 'bg-blue-50',     text: 'text-blue-700' },
  assessment: { label: 'Assessment',  bg: 'bg-brand-100',   text: 'text-brand-700' },
  interview:  { label: 'Interview',   bg: 'bg-purple-50',   text: 'text-purple-700' },
  offering:   { label: 'Offering',    bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  hired:      { label: 'Hired',       bg: 'bg-green-100',   text: 'text-green-700' },
  rejected:   { label: 'Rejected',    bg: 'bg-destructive/10', text: 'text-destructive' },
}
```

---

### Contoh Penggunaan yang BENAR vs SALAH

```jsx
// SALAH — hardcode nilai warna
<div className="bg-[hsl(25,95%,53%)] text-[hsl(222,47%,11%)]">

// BENAR — gunakan token
<div className="bg-primary text-primary-foreground">

// SALAH
<p className="text-[hsl(215,20%,65%)]">

// BENAR
<p className="text-muted-foreground">

// SALAH — sidebar hardcode
<aside className="bg-[hsl(222,47%,11%)]">

// BENAR
<aside className="bg-sidebar-bg">
```

---

## BAGIAN 4 — SUPABASE CONVENTIONS

### Client Files

```js
// lib/supabase/client.js  ← browser (client components)
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// lib/supabase/server.js  ← server components, server actions
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
}

// lib/supabase/admin.js  ← SERVICE ROLE, HANYA /app/api/** dan server actions
import { createClient } from '@supabase/supabase-js'
export const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
```

### Query Patterns

```js
// READ — selalu filter company_id
const { data, error } = await supabase
  .from('applications')
  .select('id, full_name, email, stage, created_at, jobs(title)')
  .eq('company_id', companyId)   // ← WAJIB
  .eq('job_id', jobId)
  .order('created_at', { ascending: false })

// INSERT — company_id dari session
const { data, error } = await supabase
  .from('jobs')
  .insert({ company_id: profile.company_id, title, status: 'draft' })
  .select().single()

// UPDATE — filter company_id
const { error } = await supabase
  .from('applications')
  .update({ stage: newStage })
  .eq('id', applicationId)
  .eq('company_id', companyId)  // ← WAJIB

// Error handling
if (error) {
  console.error('[module:action]', error.message)
  return { error: 'Pesan error user-friendly' }
}
```

### Get Session (Server)

```js
const supabase = await createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')

const { data: profile } = await supabase
  .from('profiles')
  .select('id, role, company_id, full_name, avatar_url')
  .eq('id', user.id).single()
```

---

## BAGIAN 5 — SCHEMA RINGKAS (38 TABEL)

> Kolom detail lengkap → baca `references/schema.md`

### Mod 0 — Foundation
- `companies`: `id`, `slug` (UNIQUE), `name`, `logo_url`, `industry`, `size`, `website`
- `profiles`: `id=auth.user.id`, `company_id`, `role` (super_admin|hr|hiring_manager|boss|employee), `full_name`, `email`, `avatar_url`, `is_active`

### Mod 1 — Jobs
- `jobs`: `company_id`, `created_by`, `title`, `slug`, `description`, `requirements`, `location`, `work_type` (remote|hybrid|onsite), `employment_type` (fulltime|parttime|contract|internship), `status` (draft|published|closed), `deadline`, `published_at`

### Mod 2 — Applications
- `applications`: `job_id`, `company_id`, `referral_id?`, `full_name`, `email`, `phone`, `cv_url`, `cover_letter`, `portfolio_url`, `stage` (applied|screening|assessment|interview|offering|hired|rejected), `internal_notes`
  - UNIQUE: `(job_id, email)`
- `stage_history`: `application_id`, `from_stage`, `to_stage`, `changed_by`, `message_to_candidate`
  - ⚠️ Auto-insert via DB trigger — jangan insert manual

### Mod 4 — Assessment
- `assessments`: `company_id`, `created_by`, `title`, `description`, `duration_minutes`, `is_template`
- `questions`: `assessment_id`, `order_index`, `type` (multiple_choice|essay|scale|scenario), `question_text`, `options` (jsonb), `correct_answer`, `points`
- `assessment_assignments`: `assessment_id`, `application_id?`, `employee_id?`, `token` (UNIQUE uuid), `status` (pending|in_progress|completed|expired), `started_at`, `expires_at`, `tab_switch_count`, `total_score`
  - CHECK: `(application_id IS NOT NULL) OR (employee_id IS NOT NULL)`
- `answers`: `assignment_id`, `question_id`, `answer_text`, `score`, `is_reviewed`, `reviewer_notes`

### Mod 5 — Interview
- `interviews`: `application_id`, `company_id`, `scheduled_at`, `duration_minutes`, `format` (online|offline), `meeting_link`, `status` (scheduled|done|rescheduled|no_show), `notes`, `created_by`
- `interview_interviewers`: `interview_id`, `profile_id`
- `scorecard_templates`: `company_id`, `title`, `created_by`
- `scorecard_criteria`: `template_id`, `title`, `description`, `weight` (0.0-1.0), `order_index`
  - ⚠️ SUM(weight) per template HARUS = 1.0
- `scorecard_results`: `interview_id`, `criteria_id`, `interviewer_id`, `score` (CHECK 1-5), `notes`

### Mod 6 — Employee Performance
- `employees`: `profile_id` (UNIQUE), `company_id`, `application_id?`, `employee_id` (text internal), `position`, `department`, `manager_id`, `join_date`, `work_phase` (probation|active|pip)
- `work_periods`: `employee_id`, `company_id`, `phase`, `start_date`, `end_date`, `decision` (passed|extended|pip|terminated), `decision_notes`, `decided_by`, `acknowledged_by`, `acknowledged_at`
- `okrs`: `employee_id`, `work_period_id`, `company_id`, `title`, `weight`, `target_value`, `unit`, `current_progress` (0-100), `status` (active|completed|cancelled), `created_by`
- `okr_updates`: `okr_id`, `employee_id`, `progress`, `notes`, `review_status` (pending|approved|revision_requested), `reviewed_by`, `review_notes`
- `work_logs`: `employee_id`, `company_id`, `title`, `description`, `category` (initiative|collaboration|learning|problem_solving|leadership|other), `impact`, `attachment_url`, `is_highlight`, `log_date`
- `acknowledgements`: `work_log_id`, `profile_id`, `reaction` (noted|impressive)
- `onboarding_templates`: `company_id`, `name`, `created_by`
- `onboarding_tasks`: `template_id`, `title`, `description`, `order_index`, `due_days`
- `onboarding_progress`: `employee_id`, `task_id`, `is_completed`, `completed_at`

**Skor formula:**
```
overall_score  = (weighted_okr_progress × 0.6) + (activity_score × 0.4)
activity_score = min(entries_30d / target_entries, 1) × 100
status: ≥70 = On Track | 40-69 = Needs Attention | <40 = At Risk
```

### Mod 7 — LMS
- `lms_courses`: `company_id`, `created_by`, `title`, `description`, `thumbnail_url`, `category` (onboarding|compliance|technical|soft_skill|other), `status` (draft|published|archived), `order_index`
- `lms_course_sections`: `course_id`, `title`, `description`, `order_index`
- `lms_course_contents`: `section_id`, `title`, `type` (video|text|document|quiz), `video_url`, `video_platform` (youtube|vimeo|gdrive|other), `body`, `document_url`, `quiz_id?`, `duration_mins`, `order_index`, `is_required`
- `lms_learning_paths`: `company_id`, `name`, `description`, `created_by`
- `lms_path_courses`: `learning_path_id`, `course_id`, `order_index`, `is_required`
- `lms_course_assignments`: `company_id`, `employee_id`, `course_id?`, `learning_path_id?`, `assigned_by`, `due_date`, `status` (assigned|in_progress|completed|overdue)
  - CHECK: `(course_id IS NOT NULL) OR (learning_path_id IS NOT NULL)`
- `lms_course_progress`: `employee_id`, `course_id`, `status` (not_started|in_progress|completed), `completion_percentage` (0-100), `started_at`, `completed_at`, `last_accessed_at`
- `lms_content_progress`: `employee_id`, `content_id`, `is_completed`, `watch_duration` (seconds), `completed_at`
  - Completion: `watch_duration ≥ duration_mins × 60 × 0.8`

### Quick Wins
- `referral_programs`: `company_id`, `job_id`, `is_active`, `reward_description`, `created_by`
- `employee_referrals`: `program_id`, `referrer_id`, `referral_token` (UNIQUE uuid), `candidate_name`, `candidate_email`, `status` (pending|applied|hired|rejected), `application_id?`
- `offer_templates`: `company_id`, `name`, `body` (html + variabel `{{candidate_name}}` dll), `created_by`
- `offer_letters`: `application_id`, `company_id`, `template_id?`, `body`, `status` (draft|sent|accepted|declined|expired), `token` (UNIQUE uuid), `sent_at`, `accepted_at`, `declined_at`, `expires_at`, `created_by`
- `reminders`: `company_id`, `type` (probation_ending|work_anniversary|task_overdue|okr_low_progress|course_overdue), `reference_id`, `reference_type`, `notify_profiles` (jsonb array uuid[]), `trigger_date`, `is_sent`, `sent_at`
- `candidate_surveys`: `application_id`, `company_id`, `token` (UNIQUE uuid), `status` (pending|completed), `overall_rating` (1-5), `process_clarity` (1-5), `communication_rating` (1-5), `feedback_text`, `sent_at`, `completed_at`
- `lms_certificates`: `employee_id`, `course_id`, `company_id`, `certificate_number` (UNIQUE, format: `CERT-YYYY-00001`), `issued_at`, `pdf_url`
- `bulk_imports`: `company_id`, `type` (employees|candidates), `status` (processing|completed|failed), `total_rows`, `success_count`, `error_count`, `error_log` (jsonb `[{row, reason}]`), `file_url`, `created_by`, `completed_at`

---

## BAGIAN 6 — ROUTE MAP

### Protected (wajib auth + middleware)
```
/dashboard                     → overview HR
/dashboard/jobs                → list + CRUD lowongan
/dashboard/jobs/[id]           → detail job + applicants
/dashboard/candidates          → semua kandidat lintas job
/dashboard/candidates/[id]     → detail kandidat + history
/dashboard/assessments         → assessment builder
/dashboard/interviews          → jadwal + scorecard
/dashboard/employees           → list karyawan
/dashboard/employees/[id]      → profil + performa
/dashboard/lms                 → course management
/dashboard/settings            → company settings

/portal                        → employee self-service
/portal/onboarding             → checklist karyawan baru
/portal/okrs                   → OKR karyawan sendiri
/portal/logs                   → work log karyawan
/portal/courses                → LMS karyawan
```

### Public (tanpa auth)
```
/[company-slug]                → career page
/[company-slug]/[job-slug]     → job detail + form apply
/assessment/[token]            → assessment runner
/offer/[token]                 → offer letter
/survey/[token]                → candidate survey
/verify/[certificate-number]   → verifikasi sertifikat LMS
```

---

## BAGIAN 7 — FOLDER STRUCTURE

```
/app
  /(auth)/                     ← login, register, reset-password
  /(dashboard)/
    layout.jsx                 ← sidebar + topbar wrapper
    page.jsx                   ← overview
    jobs/, candidates/, assessments/, interviews/
    employees/, performance/, lms/, settings/
  /(portal)/
    layout.jsx                 ← employee portal layout
    onboarding/, okrs/, logs/, courses/
  /[company-slug]/             ← career page public
  /assessment/[token]/         ← assessment public
  /offer/[token]/              ← offer letter public
  /survey/[token]/             ← survey public
  /api/                        ← routes pakai adminClient

/components
  /ui/                         ← shadcn (jangan edit)
  /layout/                     ← Sidebar, Topbar, PageHeader, EmptyState
  /jobs/                       ← JobCard, JobForm, JobStatusBadge
  /candidates/                 ← CandidateCard, PipelineBoard, StageBadge, StageSelect
  /assessments/                ← AssessmentBuilder, QuestionEditor, AssessmentRunner, TimerBar
  /interviews/                 ← InterviewCard, ScorecardForm, InterviewerSelect
  /employees/                  ← EmployeeCard, PerformanceDashboard, OkrProgress
  /lms/                        ← CourseCard, VideoPlayer, ProgressRing, CertificateCard
  /common/                     ← ConfirmDialog, LoadingSkeleton, StatusBadge

/lib
  /supabase/                   ← client.js, server.js, admin.js
  /utils/                      ← cn.js, format.js, slugify.js
  /validations/                ← zod schemas per modul
  /constants/                  ← stages.js, roles.js, categories.js

/hooks/                        ← useProfile, useCompany, useApplications, dll

/middleware.js                 ← proteksi /dashboard/** dan /portal/**
```

---

## BAGIAN 8 — ANCHOR COMMENT

Pasang di baris pertama setiap file baru:

```js
// ──────────────────────────────────────────────────
// MODULE  : [e.g. "Pipeline Kandidat (Mod 2)"]
// FILE    : [e.g. "components/candidates/PipelineBoard.jsx"]
// TABLES  : [e.g. "applications, stage_history"]
// ACCESS  : [e.g. "PROTECTED — hr, hiring_manager, boss"]
// SKILL   : baca Arvela/SKILL.md sebelum edit file ini
// ──────────────────────────────────────────────────
```

---

## BAGIAN 9 — PR/DEPLOY CHECKLIST

```
QUERY
  [ ] Semua query filter company_id
  [ ] INSERT menyertakan company_id dari session
  [ ] Tidak ada N+1 query
  [ ] Error Supabase ditangani + di-log

SECURITY
  [ ] adminClient tidak di client component
  [ ] Public route sesuai daftar di Bagian 6
  [ ] Token UUID digunakan untuk akses tanpa auth

UI
  [ ] Loading → Skeleton
  [ ] Empty state → EmptyState component
  [ ] Delete/reject → AlertDialog
  [ ] Form → react-hook-form + zod
  [ ] Mobile responsive (career page + apply form)

NAMING
  [ ] File di folder /components/[module]/ yang benar
  [ ] Function naming: getXByY / createX / updateX
  [ ] Anchor comment ada di baris pertama
```