# Arvela — Full Schema Reference
# Semua 38 tabel dengan kolom lengkap (dari schema v3)
# Dibaca AI saat butuh detail kolom untuk query atau migration

---

## MODULE 0 — FOUNDATION

### TABLE: companies
```
PURPOSE : Data perusahaan. Satu row = satu tenant.
UNIQUE  : slug

id          uuid        PK, gen_random_uuid()
slug        text        UNIQUE NOT NULL          -- URL identifier
name        text        NOT NULL
logo_url    text                                 -- Supabase Storage URL
industry    text                                 -- e.g. "Technology"
size        text                                 -- startup|smb|mid|enterprise
website     text
created_at  timestamptz NOT NULL default now()
```

### TABLE: profiles
```
PURPOSE : User account. Extends auth.users. Auto-create via DB trigger.
SPECIAL : id = auth.users.id (bukan gen_random_uuid)

id          uuid        PK, FK → auth.users
company_id  uuid        FK → companies         [TENANT KEY]
full_name   text        NOT NULL
email       text        NOT NULL
role        text        NOT NULL               -- super_admin|hr|hiring_manager|boss|employee
department  text
avatar_url  text
is_active   boolean     default true
created_at  timestamptz NOT NULL default now()
```

---

## MODULE 1 — JOB POSTING

### TABLE: jobs
```
PURPOSE : Lowongan kerja. Diakses publik saat status=published.
PUBLIC  : SELECT WHERE status='published' — tanpa auth

id              uuid        PK
company_id      uuid        FK → companies      [TENANT KEY]
created_by      uuid        FK → profiles
title           text        NOT NULL
slug            text        UNIQUE per company  -- auto-generate dari title
description     text                            -- rich text
requirements    text
location        text
work_type       text                            -- remote|hybrid|onsite
employment_type text                            -- fulltime|parttime|contract|internship
status          text        NOT NULL default 'draft'  -- draft|published|closed
deadline        date
published_at    timestamptz
closed_at       timestamptz
created_at      timestamptz NOT NULL default now()
```

---

## MODULE 2 — APPLICATIONS & PIPELINE

### TABLE: applications
```
PURPOSE   : Data lamaran kandidat. INSERT publik tanpa auth.
CONSTRAINT: UNIQUE(job_id, email) — cegah double apply
TRIGGER   : AFTER UPDATE stage → auto INSERT stage_history

id              uuid        PK
job_id          uuid        FK → jobs           NOT NULL
company_id      uuid        FK → companies      [TENANT KEY] denormalized
referral_id     uuid        FK → employee_referrals  nullable
full_name       text        NOT NULL
email           text        NOT NULL
phone           text
cv_url          text                            -- Supabase Storage bucket 'cvs'
cover_letter    text
portfolio_url   text
stage           text        NOT NULL default 'applied'
                            -- applied|screening|assessment|interview|offering|hired|rejected
rejection_reason text                           -- internal, tidak terlihat kandidat
internal_notes  text                            -- catatan HR
created_at      timestamptz NOT NULL default now()
updated_at      timestamptz
```

### TABLE: stage_history
```
PURPOSE : Audit trail perubahan stage. JANGAN insert manual — pakai trigger.
TRIGGER : Auto-insert saat applications.stage berubah

id                    uuid        PK
application_id        uuid        FK → applications   NOT NULL
from_stage            text                            -- null jika pertama apply
to_stage              text        NOT NULL
changed_by            uuid        FK → profiles
message_to_candidate  text                            -- pesan custom email
created_at            timestamptz NOT NULL default now()
```

---

## MODULE 4 — ASSESSMENT

### TABLE: assessments
```
PURPOSE : Bank assessment. Dipakai untuk rekrutmen (application_id) dan LMS (employee_id).

id              uuid        PK
company_id      uuid        FK → companies      [TENANT KEY]
created_by      uuid        FK → profiles
title           text        NOT NULL
description     text
duration_minutes int                             -- null = tidak ada timer
is_template     boolean     default false
created_at      timestamptz NOT NULL default now()
```

### TABLE: questions
```
id              uuid        PK
assessment_id   uuid        FK → assessments    NOT NULL
order_index     int         NOT NULL
type            text        NOT NULL            -- multiple_choice|essay|scale|scenario
question_text   text        NOT NULL
options         jsonb                           -- ["A","B","C","D"] untuk MC
correct_answer  text                            -- untuk auto-scoring MC
points          int         default 1
created_at      timestamptz NOT NULL default now()
```

### TABLE: assessment_assignments
```
CHECK : (application_id IS NOT NULL) OR (employee_id IS NOT NULL)
PUBLIC: SELECT via token match — tanpa auth

id              uuid        PK
assessment_id   uuid        FK → assessments    NOT NULL
application_id  uuid        FK → applications   nullable
employee_id     uuid        FK → employees      nullable
token           uuid        UNIQUE NOT NULL     -- akses publik tanpa login
status          text        NOT NULL default 'pending'
                            -- pending|in_progress|completed|expired
started_at      timestamptz                     -- ⚠️ timer berbasis ini, bukan client
submitted_at    timestamptz
expires_at      timestamptz                     -- started_at + duration + 10min buffer
tab_switch_count int        default 0
total_score     numeric
created_at      timestamptz NOT NULL default now()
```

### TABLE: answers
```
id              uuid        PK
assignment_id   uuid        FK → assessment_assignments  NOT NULL
question_id     uuid        FK → questions      NOT NULL
answer_text     text
score           numeric                         -- auto-set untuk MC, manual untuk essay
is_reviewed     boolean     default false       -- essay masuk review queue HR
reviewer_notes  text
created_at      timestamptz NOT NULL default now()
```

---

## MODULE 5 — INTERVIEW & SCORECARD

### TABLE: interviews
```
id              uuid        PK
application_id  uuid        FK → applications   NOT NULL
company_id      uuid        FK → companies      [TENANT KEY]
scheduled_at    timestamptz NOT NULL
duration_minutes int        default 60
format          text        NOT NULL            -- online|offline
meeting_link    text                            -- Google Meet / Zoom
location        text                            -- untuk offline
status          text        NOT NULL default 'scheduled'
                            -- scheduled|done|rescheduled|no_show
notes           text                            -- catatan hasil interview
created_by      uuid        FK → profiles
created_at      timestamptz NOT NULL default now()
```

### TABLE: interview_interviewers
```
PURPOSE : Many-to-many interviewer per sesi

id              uuid        PK
interview_id    uuid        FK → interviews     NOT NULL
profile_id      uuid        FK → profiles       NOT NULL
created_at      timestamptz NOT NULL default now()
```

### TABLE: scorecard_templates
```
id              uuid        PK
company_id      uuid        FK → companies      [TENANT KEY]
title           text        NOT NULL
created_by      uuid        FK → profiles
created_at      timestamptz NOT NULL default now()
```

### TABLE: scorecard_criteria
```
RULE : SUM(weight) per template_id harus = 1.0

id              uuid        PK
template_id     uuid        FK → scorecard_templates  NOT NULL
title           text        NOT NULL            -- e.g. "Communication"
description     text                            -- panduan penilaian
weight          numeric     NOT NULL default 1  -- 0.0–1.0
order_index     int         NOT NULL
created_at      timestamptz NOT NULL default now()
```

### TABLE: scorecard_results
```
CHECK : score BETWEEN 1 AND 5

id              uuid        PK
interview_id    uuid        FK → interviews     NOT NULL
criteria_id     uuid        FK → scorecard_criteria  NOT NULL
interviewer_id  uuid        FK → profiles       NOT NULL
score           int         NOT NULL CHECK (score BETWEEN 1 AND 5)
notes           text
created_at      timestamptz NOT NULL default now()
```

---

## MODULE 6 — EMPLOYEE PERFORMANCE

### TABLE: employees
```
UNIQUE : profile_id (satu akun = satu record karyawan)

id              uuid        PK
profile_id      uuid        FK → profiles       UNIQUE NOT NULL
company_id      uuid        FK → companies      [TENANT KEY]
application_id  uuid        FK → applications   nullable (jika dari rekrutmen)
employee_id     text                            -- ID internal perusahaan
position        text        NOT NULL
department      text
manager_id      uuid        FK → profiles       -- atasan langsung
join_date       date        NOT NULL
work_phase      text        NOT NULL default 'probation'
                            -- probation|active|pip
created_at      timestamptz NOT NULL default now()
```

### TABLE: work_periods
```
RULE : decision final hanya setelah acknowledged_by diisi Boss

id              uuid        PK
employee_id     uuid        FK → employees      NOT NULL
company_id      uuid        FK → companies      [TENANT KEY]
phase           text        NOT NULL            -- probation|active|pip
start_date      date        NOT NULL
end_date        date
decision        text                            -- passed|extended|pip|terminated
decision_notes  text                            -- wajib diisi saat set decision
decided_by      uuid        FK → profiles       -- HR pembuat keputusan
acknowledged_by uuid        FK → profiles       -- Boss yang approve
acknowledged_at timestamptz
created_at      timestamptz NOT NULL default now()
```

### TABLE: okrs
```
id              uuid        PK
employee_id     uuid        FK → employees      NOT NULL
work_period_id  uuid        FK → work_periods   NOT NULL
company_id      uuid        FK → companies      [TENANT KEY]
title           text        NOT NULL
description     text
weight          numeric     NOT NULL default 1  -- bobot relatif per karyawan
target_value    numeric                         -- angka target
unit            text                            -- %, transaksi, tickets, dll
current_progress numeric    default 0           -- 0–100
status          text        NOT NULL default 'active'
                            -- active|completed|cancelled
created_by      uuid        FK → profiles
created_at      timestamptz NOT NULL default now()
```

### TABLE: okr_updates
```
id              uuid        PK
okr_id          uuid        FK → okrs           NOT NULL
employee_id     uuid        FK → employees      NOT NULL
progress        numeric     NOT NULL            -- nilai baru 0–100
notes           text
review_status   text        NOT NULL default 'pending'
                            -- pending|approved|revision_requested
reviewed_by     uuid        FK → profiles
review_notes    text
created_at      timestamptz NOT NULL default now()
```

### TABLE: work_logs
```
id              uuid        PK
employee_id     uuid        FK → employees      NOT NULL
company_id      uuid        FK → companies      [TENANT KEY]
title           text        NOT NULL
description     text
category        text        NOT NULL
                -- initiative|collaboration|learning|problem_solving|leadership|other
impact          text
attachment_url  text
is_highlight    boolean     default false       -- masuk performance summary
log_date        date        NOT NULL
created_at      timestamptz NOT NULL default now()
```

### TABLE: acknowledgements
```
id              uuid        PK
work_log_id     uuid        FK → work_logs      NOT NULL
profile_id      uuid        FK → profiles       NOT NULL
reaction        text        NOT NULL            -- noted|impressive
created_at      timestamptz NOT NULL default now()
```

### TABLE: onboarding_templates
```
id              uuid        PK
company_id      uuid        FK → companies      [TENANT KEY]
name            text        NOT NULL
created_by      uuid        FK → profiles
created_at      timestamptz NOT NULL default now()
```

### TABLE: onboarding_tasks
```
id              uuid        PK
template_id     uuid        FK → onboarding_templates  NOT NULL
title           text        NOT NULL
description     text
order_index     int         NOT NULL
due_days        int                             -- due dalam X hari setelah join
created_at      timestamptz NOT NULL default now()
```

### TABLE: onboarding_progress
```
id              uuid        PK
employee_id     uuid        FK → employees      NOT NULL
task_id         uuid        FK → onboarding_tasks  NOT NULL
is_completed    boolean     default false
completed_at    timestamptz
created_at      timestamptz NOT NULL default now()
```

---

## MODULE 7 — LMS

### TABLE: lms_courses
```
id              uuid        PK
company_id      uuid        FK → companies      [TENANT KEY]
created_by      uuid        FK → profiles
title           text        NOT NULL
description     text
thumbnail_url   text
category        text        -- onboarding|compliance|technical|soft_skill|other
status          text        NOT NULL default 'draft'  -- draft|published|archived
order_index     int         NOT NULL default 0
created_at      timestamptz NOT NULL default now()
updated_at      timestamptz
```

### TABLE: lms_course_sections
```
id              uuid        PK
course_id       uuid        FK → lms_courses    NOT NULL
title           text        NOT NULL
description     text
order_index     int         NOT NULL
created_at      timestamptz NOT NULL default now()
```

### TABLE: lms_course_contents
```
id              uuid        PK
section_id      uuid        FK → lms_course_sections  NOT NULL
title           text        NOT NULL
type            text        NOT NULL            -- video|text|document|quiz
video_url       text                            -- URL eksternal
video_platform  text                            -- youtube|vimeo|gdrive|other
body            text                            -- konten teks/markdown
document_url    text
quiz_id         uuid        FK → assessments    nullable
duration_mins   int
order_index     int         NOT NULL
is_required     boolean     default true
created_at      timestamptz NOT NULL default now()
```

### TABLE: lms_learning_paths
```
id              uuid        PK
company_id      uuid        FK → companies      [TENANT KEY]
name            text        NOT NULL
description     text
created_by      uuid        FK → profiles
created_at      timestamptz NOT NULL default now()
```

### TABLE: lms_path_courses
```
id                  uuid    PK
learning_path_id    uuid    FK → lms_learning_paths  NOT NULL
course_id           uuid    FK → lms_courses         NOT NULL
order_index         int     NOT NULL
is_required         boolean default true
```

### TABLE: lms_course_assignments
```
CHECK : (course_id IS NOT NULL) OR (learning_path_id IS NOT NULL)

id                  uuid    PK
company_id          uuid    FK → companies      [TENANT KEY]
employee_id         uuid    FK → employees      NOT NULL
course_id           uuid    FK → lms_courses    nullable
learning_path_id    uuid    FK → lms_learning_paths  nullable
assigned_by         uuid    FK → profiles
due_date            date
status              text    NOT NULL default 'assigned'
                            -- assigned|in_progress|completed|overdue
created_at          timestamptz NOT NULL default now()
```

### TABLE: lms_course_progress
```
id                  uuid    PK
employee_id         uuid    FK → employees      NOT NULL
course_id           uuid    FK → lms_courses    NOT NULL
status              text    NOT NULL default 'not_started'
                            -- not_started|in_progress|completed
completion_percentage numeric default 0         -- 0–100
started_at          timestamptz
completed_at        timestamptz
last_accessed_at    timestamptz
created_at          timestamptz NOT NULL default now()
```

### TABLE: lms_content_progress
```
RULE : is_completed = true jika watch_duration >= duration_mins × 60 × 0.8

id              uuid        PK
employee_id     uuid        FK → employees              NOT NULL
content_id      uuid        FK → lms_course_contents    NOT NULL
is_completed    boolean     default false
watch_duration  int                             -- detik video ditonton
completed_at    timestamptz
created_at      timestamptz NOT NULL default now()
```

---

## QUICK WINS

### TABLE: referral_programs
```
id                  uuid    PK
company_id          uuid    FK → companies      [TENANT KEY]
job_id              uuid    FK → jobs           NOT NULL
is_active           boolean default true
reward_description  text
created_by          uuid    FK → profiles
created_at          timestamptz NOT NULL default now()
```

### TABLE: employee_referrals
```
PUBLIC : SELECT via referral_token — tanpa auth

id                  uuid    PK
program_id          uuid    FK → referral_programs  NOT NULL
referrer_id         uuid    FK → employees      NOT NULL
referral_token      uuid    UNIQUE NOT NULL     -- token link referral
candidate_name      text
candidate_email     text
candidate_phone     text
status              text    NOT NULL default 'pending'
                            -- pending|applied|hired|rejected
application_id      uuid    FK → applications   nullable
notes               text
created_at          timestamptz NOT NULL default now()
```

### TABLE: offer_templates
```
VARIABLES: {{candidate_name}} {{position}} {{start_date}} {{salary}} {{company_name}} {{deadline}}

id              uuid        PK
company_id      uuid        FK → companies      [TENANT KEY]
name            text        NOT NULL
body            text        NOT NULL            -- HTML dengan variabel
created_by      uuid        FK → profiles
created_at      timestamptz NOT NULL default now()
updated_at      timestamptz
```

### TABLE: offer_letters
```
PUBLIC : SELECT via token — tanpa auth

id              uuid        PK
application_id  uuid        FK → applications   NOT NULL
company_id      uuid        FK → companies      [TENANT KEY]
template_id     uuid        FK → offer_templates  nullable
body            text        NOT NULL            -- HTML final, variabel sudah di-replace
status          text        NOT NULL default 'draft'
                            -- draft|sent|accepted|declined|expired
token           uuid        UNIQUE NOT NULL
sent_at         timestamptz
accepted_at     timestamptz
declined_at     timestamptz
expires_at      timestamptz
created_by      uuid        FK → profiles
created_at      timestamptz NOT NULL default now()
```

### TABLE: reminders
```
CRON : Cek harian WHERE trigger_date = TODAY AND is_sent = false

id              uuid        PK
company_id      uuid        FK → companies      [TENANT KEY]
type            text        NOT NULL
                -- probation_ending|work_anniversary|task_overdue|okr_low_progress|course_overdue
reference_id    uuid        NOT NULL            -- employee_id / task_id / assignment_id
reference_type  text        NOT NULL            -- employee|onboarding_task|lms_assignment
notify_profiles jsonb       NOT NULL            -- ["uuid1","uuid2"] array profile_id
trigger_date    date        NOT NULL
is_sent         boolean     default false
sent_at         timestamptz
created_at      timestamptz NOT NULL default now()
```

### TABLE: candidate_surveys
```
PUBLIC : SELECT/UPDATE via token — tanpa auth

id                      uuid    PK
application_id          uuid    FK → applications   NOT NULL
company_id              uuid    FK → companies      [TENANT KEY]
token                   uuid    UNIQUE NOT NULL
status                  text    NOT NULL default 'pending'  -- pending|completed
overall_rating          int     CHECK (1–5)  nullable
process_clarity         int     CHECK (1–5)  nullable
communication_rating    int     CHECK (1–5)  nullable
feedback_text           text
sent_at                 timestamptz
completed_at            timestamptz
created_at              timestamptz NOT NULL default now()
```

### TABLE: lms_certificates
```
FORMAT certificate_number: CERT-YYYY-00001 (incremental per company)

id                  uuid    PK
employee_id         uuid    FK → employees      NOT NULL
course_id           uuid    FK → lms_courses    NOT NULL
company_id          uuid    FK → companies      [TENANT KEY]
certificate_number  text    UNIQUE NOT NULL
issued_at           timestamptz NOT NULL default now()
pdf_url             text                        -- Supabase Storage URL
created_at          timestamptz NOT NULL default now()
```

### TABLE: bulk_imports
```
ERROR_LOG format: [{"row": 5, "reason": "Email sudah terdaftar"}, ...]

id              uuid        PK
company_id      uuid        FK → companies      [TENANT KEY]
type            text        NOT NULL            -- employees|candidates
status          text        NOT NULL default 'processing'
                            -- processing|completed|failed
total_rows      int
success_count   int         default 0
error_count     int         default 0
error_log       jsonb                           -- array error per baris
file_url        text                            -- CSV original di Storage
created_by      uuid        FK → profiles
created_at      timestamptz NOT NULL default now()
completed_at    timestamptz
```