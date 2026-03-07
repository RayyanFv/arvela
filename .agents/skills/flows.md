# Arvela — Data Flow Reference
# Dibaca AI saat membangun fitur yang melibatkan beberapa tabel atau trigger

---

## FLOW 1 — Kandidat Apply

```
1. Kandidat buka /[company-slug]/[job-slug]
   → GET jobs WHERE slug=$slug AND status='published'

2. Kandidat submit form apply
   → POST /api/apply
   → INSERT applications (public, anon key)
   → Upload CV ke Storage bucket 'cvs' via signed URL
   → DB trigger auto-INSERT stage_history (from_stage: null, to_stage: 'applied')

3. Email konfirmasi otomatis
   → Trigger dari stage_history INSERT
   → Kirim via Resend/Sendgrid ke aplikasi.email

TABLES: jobs → applications → stage_history
ERROR HANDLING:
  - Unique constraint (job_id, email) violated → code 23505 → "Kamu sudah pernah apply"
  - CV upload gagal → rollback application insert
```

---

## FLOW 2 — HR Pindah Stage Kandidat

```
1. HR drag/klik pindah stage di pipeline board
   → UPDATE applications SET stage=$newStage WHERE id=$id AND company_id=$companyId
   → DB trigger auto-INSERT stage_history

2. Opsional: HR tambah pesan custom
   → UPDATE stage_history SET message_to_candidate=$msg (baris yang baru dibuat)

3. Email notifikasi ke kandidat
   → Server action/edge function triggered by stage_history insert
   → Template email berbeda per stage

TABLES: applications → stage_history
NOTE: Jangan insert stage_history manual dari aplikasi
```

---

## FLOW 3 — HR Assign Assessment ke Kandidat

```
1. HR pilih kandidat → klik "Kirim Assessment"
   → INSERT assessment_assignments (
       assessment_id, application_id,
       token = gen_random_uuid(),
       expires_at = now() + interval '7 days'
     )

2. Email terkirim ke kandidat.email
   → Link: /assessment/[token]

3. Kandidat buka link assessment
   → GET assessment_assignments WHERE token=$token
   → Jika expired → tampil halaman expired
   → Jika valid → tampil soal

4. Kandidat mulai mengerjakan
   → UPDATE assessment_assignments SET status='in_progress', started_at=now()
   → Timer di frontend = started_at + duration_minutes (bukan Date.now())

5. Tab switch detection
   → document.addEventListener('visibilitychange')
   → POST /api/assessment/tab-switch → UPDATE tab_switch_count++

6. Submit (manual atau auto saat timer habis)
   → INSERT answers (semua jawaban)
   → UPDATE assessment_assignments SET status='completed', submitted_at=now()
   → Auto-score MC: bandingkan answer_text dengan correct_answer
   → Essay: is_reviewed=false, masuk review queue

TABLES: assessments → assessment_assignments → answers → questions
```

---

## FLOW 4 — HR Jadwalkan Interview

```
1. HR buat jadwal interview
   → INSERT interviews (application_id, scheduled_at, format, ...)
   → INSERT interview_interviewers (interview_id, profile_id) per interviewer

2. Email otomatis terkirim
   → Ke kandidat: nama posisi, waktu, format, link meeting
   → Ke semua interviewer: nama kandidat, posisi, waktu, link meeting

3. Interview selesai
   → UPDATE interviews SET status='done', notes=$notes

4. Interviewer isi scorecard (opsional)
   → INSERT scorecard_results per criteria
   → Weighted score dihitung di frontend: SUM(score × weight) / SUM(weight)

TABLES: interviews → interview_interviewers → scorecard_results → scorecard_criteria
```

---

## FLOW 5 — HR Onboard Karyawan Baru

```
1. Kandidat hired → HR buat akun karyawan
   → INSERT profiles (via Supabase invite)
   → INSERT employees (profile_id, company_id, position, join_date, work_phase='probation')
   → INSERT work_periods (phase='probation', start_date=join_date, end_date=join_date+90days)

2. Assign onboarding template
   → SELECT onboarding_tasks WHERE template_id=$templateId
   → INSERT onboarding_progress per task (is_completed=false)
   → INSERT reminders (type='probation_ending', trigger_date=end_date-7)

3. Karyawan login ke /portal
   → Lihat checklist onboarding
   → UPDATE onboarding_progress SET is_completed=true, completed_at=now()

TABLES: employees → work_periods → onboarding_templates → onboarding_tasks → onboarding_progress → reminders
```

---

## FLOW 6 — Siklus OKR Karyawan

```
1. HR buat OKR untuk karyawan
   → INSERT okrs (employee_id, work_period_id, title, weight, target_value)

2. Karyawan update progress mingguan
   → INSERT okr_updates (okr_id, progress, notes)
   → UPDATE okrs SET current_progress=$progress

3. Manager review update
   → UPDATE okr_updates SET review_status='approved' atau 'revision_requested', review_notes

4. Skor performa dihitung (real-time di frontend)
   → weighted_okr = SUM(okr.current_progress × okr.weight) / SUM(okr.weight)
   → activity_score = min(work_log_count_30d / target, 1) × 100
   → overall = (weighted_okr × 0.6) + (activity_score × 0.4)

TABLES: okrs → okr_updates, work_logs
```

---

## FLOW 7 — Keputusan Akhir Fase Karyawan

```
1. HR set decision
   → UPDATE work_periods SET decision='passed', decision_notes=$notes, decided_by=$hrId
   → Status masih PENDING (belum final) karena acknowledged_by = null

2. Boss lihat dan acknowledge
   → Validasi: profile.role === 'boss'
   → UPDATE work_periods SET acknowledged_by=$bossId, acknowledged_at=now()
   → Sekarang FINAL

3. Buat fase baru
   → INSERT work_periods (phase='active', start_date=today)
   → Jika decision='pip', phase='pip'

TABLES: work_periods
NOTE: Keputusan tanpa acknowledge boss = tidak valid. Frontend harus enforce ini.
```

---

## FLOW 8 — LMS: Karyawan Selesaikan Course

```
1. HR assign course ke karyawan
   → INSERT lms_course_assignments (employee_id, course_id, due_date)
   → INSERT lms_course_progress (employee_id, course_id, status='not_started')

2. Karyawan tonton video
   → UPDATE lms_content_progress SET watch_duration=$seconds setiap 10 detik
   → Jika watch_duration >= duration_mins × 60 × 0.8
     → UPDATE lms_content_progress SET is_completed=true

3. Completion percentage dihitung otomatis
   → COUNT(required contents is_completed=true) / COUNT(required contents) × 100
   → UPDATE lms_course_progress SET completion_percentage=$pct

4. Course 100% selesai
   → UPDATE lms_course_progress SET status='completed', completed_at=now()
   → INSERT lms_certificates (certificate_number='CERT-YYYY-XXXXX', pdf_url)

TABLES: lms_course_assignments → lms_course_progress → lms_content_progress → lms_certificates
```

---

## FLOW 9 — Offer Letter ke Kandidat

```
1. HR buat offer letter dari template
   → GET offer_templates (ambil body HTML)
   → Replace variabel: {{candidate_name}}, {{position}}, {{start_date}}, {{salary}}, dll
   → INSERT offer_letters (application_id, body=$replaced, token=gen_uuid, status='draft')

2. HR kirim offer
   → UPDATE offer_letters SET status='sent', sent_at=now()
   → Email ke kandidat: link /offer/[token]

3. Kandidat buka dan respons (tanpa login)
   → GET offer_letters WHERE token=$token
   → Jika expires_at < now() → status='expired'
   → Kandidat klik Accept → UPDATE SET status='accepted', accepted_at=now()
   → Kandidat klik Decline → UPDATE SET status='declined', declined_at=now()

TABLES: offer_templates → offer_letters → applications
```

---

## FLOW 10 — Smart Reminders (Cron Harian)

```
Cron job jalan setiap hari (Supabase pg_cron atau Vercel Cron):

1. SELECT * FROM reminders WHERE trigger_date = CURRENT_DATE AND is_sent = false
2. Per reminder: kirim email ke semua profile_id dalam notify_profiles array
3. UPDATE reminders SET is_sent=true, sent_at=now()

Reminder auto-dibuat saat:
- work_period INSERT → INSERT reminder (type='probation_ending', trigger_date=end_date-7)
- OKR cron mingguan → jika progress < 50 di hari ke-45 → INSERT reminder (type='okr_low_progress')
- onboarding_tasks → jika due_date terlewat → INSERT reminder (type='task_overdue')

TABLES: reminders
```

---

## FLOW 11 — Employee Referral

```
1. HR aktifkan program referral untuk job
   → INSERT referral_programs (job_id, is_active=true)

2. Karyawan generate link referral
   → INSERT employee_referrals (program_id, referrer_id, referral_token=gen_uuid)
   → Link: /apply/[job-slug]?ref=[referral_token]

3. Kandidat apply via link
   → Frontend ambil referral_token dari query param
   → GET employee_referrals WHERE referral_token=$token → ambil id
   → INSERT applications (referral_id=$employee_referral.id, ...)

4. Status referral update otomatis
   → DB trigger: saat applications.stage berubah ke 'hired'
   → UPDATE employee_referrals SET status='hired', application_id=$id

TABLES: referral_programs → employee_referrals → applications
```