# Update v0.1 - Analysis and Implementation Plan

**Context:** The application is an Applicant Tracking System (ATS) and HR Management Tool built with Next.js, React, Tailwind CSS, and Supabase. The codebase currently contains components for job portals, authentications, assessments, HR management (employees, dashboard, staff views). The goal is to analyze the system's structural and functional needs based on new requirements and produce a roadmap for version 0.1. The relevant codebase includes the database schema (via Supabase), HR dashboards (`src/app/dashboard`), candidate portals (`src/app/portal`), and assessment modules (`src/app/assessment`).

**Thought:** We need to expand the system to support a more comprehensive end-to-end recruitment and employee management flow. Based on the notes provided for v0.1:
1.  **Pre-screening/Prerequisite:** We need a flexible form builder or additional questionnaire during the job application process, utilizing checklists (e.g., checking willingness for business travel, assessing employer branding knowledge).
2.  **Assessment & Proctoring:** Integrate a free proctoring system for online assessments so HR admins can view logs of any cheating behavior. Additionally, AI review results, interview lists, and recordings (potentially exploring Jitsi integration) should be unified functionally in one page.
3.  **HR Perspective:** Implement templated/standardized interview questions for HR to use during interviews.
4.  **ATS Candidate History:** Track a candidate's multiple job applications across different periods (e.g., applying in 2024 and 2025) to provide HR with their full application track record.
5.  **Training & Performance Integration:** Create a system that maps and correlates employee training data with their objective performance metrics to see how training impacts their work.
6.  **Recruitment Procedures & Documentation:** Build a secure document feature for handling recruitment agreements (PKWT and PKWTT) with proper digital backup capabilities in case of physical document loss.

**Action:** Document these detailed requirements in this markdown file to serve as the definitive specification for the v0.1 engineering sprint.

**Observation:** This document clearly connects the user's meeting notes regarding ATS capabilities, HR workflows, proctoring, and employee development into actionable technical features ready for UI/UX design and schema development.

---

## Berikut Penjelasan Isi Update v0.1

### 1. Pre Screening / Prerequisite (Persyaratan Awal) [DONE]
*   **Fitur:** Penambahan daftar pertanyaan tambahan pada saat *apply* lowongan.
*   **Implementasi:** `ScreeningQuestionsBuilder.jsx` terintegrasi di `NewJobPage` & `EditJobForm`.
*   **Format:** Dukungan esai, yes/no, dan checklist terstruktur.

### 2. Assessment Proctoring & Interview Integration [DONE]
*   **Integrasi Hasil AI & Interview:** Unified Page `src/app/dashboard/candidates/[id]/evaluation/page.jsx`.
*   **Video Interview:** `JitsiMeeting.jsx` & `LiveInterviewPage` (`/interviews/[id]/live`).
*   **Gratis Proctoring:** `AssessmentInterface.jsx` mencatat log blur, tab switch, dan copy-paste ke `proctoring_logs`.

### 3. Perspektif HR (Standar Pertanyaan HR) [DONE]
*   **Fitur:** CRUD Template di `/dashboard/settings/interview-templates`.
*   **Tujuan:** Standardisasi evaluasi menggunakan pakem pertanyaan yang bisa diskor langsung saat interview live.

### 4. ATS Riwayat Pendaftar (Timeline Tracking) [DONE]
*   **Sistem Pelacakan:** `getCandidateHistory` di `applications.js` melacak lamaran berdasarkan email dalam satu perusahaan.
*   **Display:** Ditampilkan di dalam Detail Kandidat (`CandidatesDetailPage`).

### 5. Integrasi Sistem Training dan Performa Karyawan [DONE]
*   **Fitur Korelasi:** Analisis box di `EmployeeDetailPage` yang membandingkan penyelesaian modul LMS vs Capaian OKR.
*   **Schema:** Table `trainings` dan `performance_metrics` telah siap.

### 6. Prosedur Surat Rekrutmen & Backup [DONE]
*   **Manajemen Dokumen:** `RecruitmentDocManager.jsx` pada detail kandidat.
*   **Digital Backup:** Sistem upload PKWT/PKWTT ke storage khusus untuk mitigasi kehilangan fisik.
