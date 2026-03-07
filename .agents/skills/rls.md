# Arvela — RLS Policy Reference
# Dibaca AI saat membutuhkan info: siapa bisa akses apa, route public vs protected, query aman

---

## PRINSIP DASAR

1. **Semua tabel RLS aktif** — default DENY untuk operasi apapun
2. **RLS adalah safety net** — aplikasi tetap wajib filter company_id sendiri
3. **Service Role Key** bypass RLS sepenuhnya — hanya pakai di server-side
4. **Token publik** (uuid) untuk akses tanpa auth — bukan JWT

---

## RLS POLICY PER TABEL

### companies
```
SELECT  : profiles.company_id = companies.id (member company saja)
INSERT  : super_admin saja (via server action)
UPDATE  : super_admin saja
```

### profiles
```
SELECT  : company_id yang sama
INSERT  : via DB trigger (auto saat auth.users dibuat) atau super_admin
UPDATE  : user sendiri (data profil) atau super_admin
```

### jobs
```
SELECT  : [PUBLIC] status='published' — anon key tanpa auth
          [PRIVATE] semua job milik company_id yang sama (untuk HR)
INSERT  : role IN (hr, super_admin)
UPDATE  : role IN (hr, super_admin)
DELETE  : role IN (hr, super_admin)
```

### applications
```
SELECT  : role IN (hr, hiring_manager, boss, super_admin) AND company_id match
INSERT  : [PUBLIC] anon key — kandidat apply tanpa auth
UPDATE  : role IN (hr, hiring_manager, super_admin)
```

### stage_history
```
SELECT  : role IN (hr, hiring_manager, boss, super_admin) AND company_id match
INSERT  : via DB trigger saja — aplikasi tidak insert langsung
```

### assessments
```
SELECT  : company_id match
INSERT  : role IN (hr, super_admin)
UPDATE  : role IN (hr, super_admin)
```

### questions
```
SELECT  : via assessments.company_id (join check)
INSERT  : role IN (hr, super_admin)
UPDATE  : role IN (hr, super_admin)
```

### assessment_assignments
```
SELECT  : [PUBLIC] WHERE token = $token — tanpa auth (assessment runner)
          [PRIVATE] via company_id match (untuk HR lihat hasil)
INSERT  : role IN (hr, super_admin)
UPDATE  : [PUBLIC] update started_at, submitted_at, tab_switch_count via token
```

### answers
```
SELECT  : [PUBLIC] via assignment token
          [PRIVATE] role IN (hr, super_admin) via company
INSERT  : [PUBLIC] via assignment token (kandidat submit)
UPDATE  : role IN (hr, super_admin) untuk review essay
```

### interviews
```
SELECT  : role IN (hr, hiring_manager, boss, super_admin) AND company_id match
INSERT  : role IN (hr, super_admin)
UPDATE  : role IN (hr, super_admin) OR profile_id IN interview_interviewers
```

### interview_interviewers
```
SELECT  : role IN (hr, hiring_manager, boss, super_admin)
INSERT  : role IN (hr, super_admin)
```

### scorecard_templates + scorecard_criteria
```
SELECT  : company_id match
INSERT  : role IN (hr, super_admin)
UPDATE  : role IN (hr, super_admin)
```

### scorecard_results
```
SELECT  : role IN (hr, super_admin) ATAU interviewer_id = current_user
INSERT  : profile_id IN interview_interviewers (interviewer terkait saja)
UPDATE  : interviewer_id = current_user
```

### employees
```
SELECT  : role IN (hr, hiring_manager, boss, super_admin) AND company_id match
          OR profile_id = current_user (karyawan lihat diri sendiri)
INSERT  : role IN (hr, super_admin)
UPDATE  : role IN (hr, super_admin)
```

### work_periods
```
SELECT  : role IN (hr, boss, super_admin) AND company_id match
          OR employee.profile_id = current_user
INSERT  : role IN (hr, super_admin)
UPDATE decision: role IN (hr, super_admin)
UPDATE acknowledged_by: role = boss
```

### okrs
```
SELECT  : employee.profile_id = current_user (karyawan lihat milik sendiri)
          OR role IN (hr, hiring_manager, boss, super_admin) AND company_id match
INSERT  : role IN (hr, super_admin)
UPDATE  : role IN (hr, super_admin)
```

### okr_updates
```
SELECT  : employee.profile_id = current_user
          OR role IN (hr, boss, super_admin) AND company_id match
INSERT  : employee.profile_id = current_user (karyawan update sendiri)
UPDATE review_status: role IN (hr, boss, super_admin)
```

### work_logs
```
SELECT  : employee.profile_id = current_user
          OR role IN (hr, boss, super_admin) AND company_id match
INSERT  : employee.profile_id = current_user
```

### acknowledgements
```
SELECT  : company_id match
INSERT  : role IN (hr, boss, hiring_manager, super_admin)
```

### onboarding_templates + onboarding_tasks
```
SELECT  : company_id match
INSERT  : role IN (hr, super_admin)
UPDATE  : role IN (hr, super_admin)
```

### onboarding_progress
```
SELECT  : employee.profile_id = current_user OR role IN (hr, boss, super_admin)
UPDATE  : employee.profile_id = current_user (karyawan centang sendiri)
```

### lms_courses + lms_course_sections + lms_course_contents
```
SELECT  : company_id match, status='published' (untuk karyawan)
          role IN (hr, super_admin) bisa lihat semua status
INSERT  : role IN (hr, super_admin)
UPDATE  : role IN (hr, super_admin)
```

### lms_learning_paths + lms_path_courses
```
SELECT  : company_id match
INSERT  : role IN (hr, super_admin)
UPDATE  : role IN (hr, super_admin)
```

### lms_course_assignments
```
SELECT  : employee_id milik current_user ATAU role IN (hr, boss, super_admin)
INSERT  : role IN (hr, super_admin)
```

### lms_course_progress
```
SELECT  : employee.profile_id = current_user OR role IN (hr, boss, super_admin)
INSERT  : employee.profile_id = current_user
UPDATE  : employee.profile_id = current_user
```

### lms_content_progress
```
SELECT  : employee.profile_id = current_user
INSERT  : employee.profile_id = current_user
UPDATE  : employee.profile_id = current_user
```

### referral_programs
```
SELECT  : company_id match
INSERT  : role IN (hr, super_admin)
```

### employee_referrals
```
SELECT  : [PUBLIC] WHERE referral_token = $token — tanpa auth
          [PRIVATE] referrer_id = current_employee OR role IN (hr, super_admin)
INSERT  : employee dengan is_active = true (karyawan buat referral sendiri)
```

### offer_templates
```
SELECT  : company_id match
INSERT  : role IN (hr, super_admin)
UPDATE  : role IN (hr, super_admin)
```

### offer_letters
```
SELECT  : [PUBLIC] WHERE token = $token — tanpa auth
          [PRIVATE] role IN (hr, super_admin) AND company_id match
INSERT  : role IN (hr, super_admin)
UPDATE status accepted/declined: [PUBLIC] via token — tanpa auth
```

### reminders
```
SELECT  : role IN (hr, super_admin) AND company_id match
INSERT  : via server actions (cron atau trigger)
UPDATE is_sent: via cron server action
```

### candidate_surveys
```
SELECT  : [PUBLIC] WHERE token = $token — tanpa auth
          [PRIVATE] role IN (hr, super_admin) AND company_id match
UPDATE  : [PUBLIC] via token (kandidat submit survey)
```

### lms_certificates
```
SELECT  : employee.profile_id = current_user (lihat milik sendiri)
          OR role IN (hr, super_admin)
          OR [PUBLIC] via certificate_number untuk verifikasi
INSERT  : via server action saat completion_percentage = 100
```

### bulk_imports
```
SELECT  : role IN (hr, super_admin) AND company_id match
INSERT  : role IN (hr, super_admin)
```

---

## QUERY AMAN — CONTOH IMPLEMENTASI

### Public career page (tanpa auth)
```js
// Gunakan createClient() browser client dengan anon key
// RLS sudah allow SELECT published jobs
const { data: jobs } = await supabase
  .from('jobs')
  .select('id, title, location, work_type, employment_type, deadline')
  .eq('company_id', company.id)   // tetap filter meski public
  .eq('status', 'published')
  .order('published_at', { ascending: false })
```

### Assessment runner (token access)
```js
// Public route /assessment/[token] — tanpa auth
// Gunakan anon key, RLS allow SELECT via token
const { data: assignment } = await supabase
  .from('assessment_assignments')
  .select('*, assessments(title, duration_minutes), questions(*)')
  .eq('token', token)
  .single()

if (!assignment) return notFound()
if (assignment.status === 'expired') return redirect('/assessment/expired')
```

### Update stage kandidat (HR)
```js
// Server action — pakai createServerSupabaseClient
// Sertakan company_id sebagai defense in depth
const { error } = await supabase
  .from('applications')
  .update({ stage: newStage, updated_at: new Date().toISOString() })
  .eq('id', applicationId)
  .eq('company_id', profile.company_id)  // ← WAJIB

// stage_history akan auto-insert via trigger
// email notifikasi dikirim via server action terpisah
```

### Work period decision (HR + Boss acknowledgement)
```js
// Step 1: HR set decision (masih belum final karena acknowledged_by = null)
await supabase
  .from('work_periods')
  .update({ decision, decision_notes, decided_by: profile.id })
  .eq('id', periodId)
  .eq('company_id', profile.company_id)

// Step 2: Boss acknowledge (hanya role boss yang bisa)
// Validasi role di server action sebelum query
if (profile.role !== 'boss') throw new Error('Unauthorized')

await supabase
  .from('work_periods')
  .update({ acknowledged_by: profile.id, acknowledged_at: new Date().toISOString() })
  .eq('id', periodId)
  .eq('company_id', profile.company_id)
```

---

## SUMMARY — TABEL PUBLIC ACCESS

| Tabel | Jenis Akses Publik | Via |
|---|---|---|
| `jobs` | SELECT published | anon key |
| `assessment_assignments` | SELECT, UPDATE (start/submit) | token UUID |
| `answers` | INSERT | token UUID |
| `offer_letters` | SELECT, UPDATE (accept/decline) | token UUID |
| `candidate_surveys` | SELECT, UPDATE (submit) | token UUID |
| `employee_referrals` | SELECT (cek token) | referral_token UUID |
| `applications` | INSERT (apply form) | anon key |
| `lms_certificates` | SELECT (verifikasi) | certificate_number |