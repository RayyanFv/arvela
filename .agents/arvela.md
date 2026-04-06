# Arvela: Technical & Feature Overview

Dokumen ini merupakan ringkasan komprehensif mengenai arsitektur, teknologi, dan fitur yang ada di proyek Arvela. Dokumen ini ditujukan sebagai *context blueprint* bagi AI Agent dan developer dalam mendiskusikan serta merencanakan pengembangan fitur selanjutnya.

## 1. Pendahuluan
**Arvela** adalah sebuah platform SaaS HRIS (Human Resources Information System) dan ATS (Applicant Tracking System) komprehensif berbasis web. Sistem ini dirancang untuk mengelola seluruh siklus karyawan di berbagai perusahaan (multi-tenant), mulai dari rekrutmen (job posting, application pipeline), seleksi (interview online, assessment), manajemen data internal (onboarding, absensi, lembur), manajemen kinerja (OKR, Scorecard), hingga pembelajaran internal perusahaan (LMS), serta menyertakan Content Management System (CMS) untuk artikel SEO.

## 2. Tech Stack & Arsitektur
- **Frontend Framework**: Next.js 16.1.6 (menggunakan App Router)
- **Backend, Database, & Auth**: Supabase (PostgreSQL, GoTrue untuk Authentication, Realtime, dan Storage Bucket untuk berkas/CV/gambar)
- **Styling & UI Components**: Tailwind CSS v4, `shadcn/ui`, Radix UI (`@radix-ui/react-slot`), Base UI (`@base-ui/react`), Lucide React. Animasi dengan `tailwindcss-animate` dan `tw-animate-css`.
- **Form & Validasi**: React Hook Form dipadukan dengan Zod.
- **Peta & Geolokasi**: Mapbox GL & `react-map-gl` (digunakan untuk absensi berbasis lokasi).
- **Video Conference**: Jitsi React SDK (`@jitsi/react-sdk`) untuk melangsungkan sesi interview online langsung dari dalam platform.
- **AI & Proctoring**: `face-api` (`@vladmandic/face-api`) diimplementasikan sebagai sistem *proctoring* untuk mendeteksi keberadaan wajah pengguna saat melangsungkan ujian/assessment.
- **Email Delivery**: Resend dan Nodemailer.
- **Charts / Visualisasi Data**: Recharts.

## 3. Sistem Otentikasi dan Role (Hak Akses)
Sistem menggunakan **Supabase Auth** dengan kebijakan **Row Level Security (RLS)** PostgreSQL yang sangat ketat untuk memastikan data tersegregasi berdasarkan `company_id` pada arsitektur multi-tenant ini.

Sistem *Role* Arvela baru saja mengalami proses *revamp* dan didefinisikan sebagai berikut:
1. **`super_admin`**: Administrator tingkatan global untuk aplikasi Arvela. Memiliki kendali penuh, termasuk CMS Artikel.
2. **`owner`**: Pemilik/Pimpinan perusahaan (menggantikan role 'boss'). Memiliki hak akses penuh untuk keseluruhan data dalam perusahaannya (`company_id`).
3. **`hr_admin`**: Administrator HRD (gabungan dari role 'hr' dan 'hiring_manager'). Mampu mengurus data operasional perusahaan, pegawai, dan proses rekrutmen di dalam kawasannya (`company_id`).
4. **`employee`**: Karyawan internal yang bekerja di sebuah entitas perusahaan.
5. **`candidate`**: Pengguna publik yang bertindak sebagai kandidat/pelamar kerja.
6. **`user`**: Role standar untuk pengguna yang telah divalidasi otentikasinya, namun belum mendapatkan asosiasi spesifik.

> **Catatan Penting terkait Akses:**
> - Di database Supabase disediakan helper function `is_admin()`, yang akan menghasilkan nilai `true` apabila `role` pengguna saat ini adalah `super_admin`, `owner`, atau `hr_admin`.
> - RLS function selalu memastikan fungsi-fungsi pembaruan dibatasi pada `company_id` yang cocok.

## 4. Modul dan Fitur Keseluruhan
Aplikasi ini dipecah ke dalam beberapa area fungsi / portal antarmuka:

### A. Dashboard Admin & HR (`/dashboard`)
Portal operasional utama bagi pengguna `owner` dan `hr_admin` (serta `super_admin`) untuk perusahaan mereka.
- **Company & Settings**: Manajemen profil perusahaan, perizinan, dan proses alur *onboarding* entitas perusahaan.
- **Jobs**: Pembuatan, penyuntingan, dan publikasi lowongan kerja.
- **Candidates & Applications (ATS)**: Pelacakan tahapan/pipeline rekrutmen kandidat dari awal lamaran hingga penawaran.
- **Assessments**: Pembuatan dan distribusi tes ujian/penilaian pekerjaan. Sistem ini memiliki sejarah perkembangan rilis (sampai *assessment_v2* dan *enhancements*).
- **Interviews**: Penjadwalan interview (dengan otomatisasi kalender/status dan terintegrasi langsung dengan platform via Jitsi).
- **Employees**: Sistem pengelolaan database seluruh karyawan di dalam perusahaan (Employee Profile / Roster).
- **Performance**: Modul manajemen pencapaian dan kinerja karyawan melalui kerangka **OKR (Objective & Key Results)**, *Initiatives*, hingga fase *review* via Scorecard.
- **LMS (Learning Management System)**: Manajemen sistem belajar mengajar internal perusahaan. HR/Admin dapat membuat materi kursus tingkat lanjut, ujian, dan sertifikasi penyelesaian.
- **Attendance**: Modul pengelolaan absensi (Master Data, *Shift Days*, rekaman manual, serta logic absen kompleks untuk operasional harian perusahaan).
- **Overtime**: Fitur pengelolaan dan persetujuan pengajuan waktu lembur (Overtime Requests).
- **Articles (CMS)**: Sistem manajemen berita, promosi atau blog yang disetir khusus oleh `super_admin`. Dilengkapi field seperti *slug*, *category*, *author_name*, metrik SEO, jumlah *view/like/dislike*, dan status visibilitas (draft/published).

### B. Portal Karyawan Internal (`/staff`)
Antarmuka Self-Service diperuntukkan bagi mereka dengan role `employee`.
- **Profile & Onboarding**: Untuk kelengkapan bio dan pembaruan data diri pegawai.
- **Attendance**: Fitur *Clock-in* dan *Clock-out* mandiri, yang mungkin menggunakan pengecekan lokasi (Geofencing via Mapbox).
- **Overtime**: Modul pengajuan lembur (overtime request system).
- **OKRs & Performance**: Panel pribadi untuk memantau, meng-eksekusi, dan melaporkan kemajuan sasaran sasaran kuartalan (OKR) mereka.
- **LMS & Courses**: Karyawan dapat mengambil kursus yang tersedia, menjalankan ujian *proctoring*, dan mendapatkan sertifikat kompetensi.

### C. Portal Kandidat Publik (`/portal`)
Ini merupakan area hub (Career Portal) bagi para pelamar eksternal `candidate`.
- **Jobs / Lamaran Kerja**: Pelamar dapat melacak progres aplikasi yang mereka masukan.
- **Interviews & Assessments**: Tempat pelamar melakukan tes keterampilan seleksi *(assessment test)* dan menjalankan Vicon Interview bersama recruiter.

### D. Fitur Antarmuka Publik Lainnya
- **`/[company-slug]`**: Halaman Landing/Portal karir resmi yang terbuka untuk umum per satu perusahaan tenant.
- **`/articles`**: Halaman umum (ter-indeks) yang menyajikan daftar dan isi artikel berstatus *"published"* bagi audiens publik.

## 5. Pertimbangan Teknis Spesifik untuk AI Agent
Bila akan mengembangkan atau menyarankan fitur lanjutan di Arvela, AI Agent diharapkan memperhatikan aspek esensial berikut:

1. **Row Level Security (RLS) adalah Hukum Mutlak:** Proyek ini memiliki lintasan panjang masalah terkait privasi data dan `circular dependencies` pada fungsi RLS (`hotfix_rls_circular`, `fix_rls_strict`, `nuclear_rls_reset`). Setiap entitas fitur/tabel backend baru mutlak HARUS dibuatkan *policy* RLS-nya yang mengecek validasi `role`, fungsi `is_admin()`, dan isolasi tenant via `company_id`.
2. **Kerapuhan AI Proctoring**: Terdapat fitur pengawasan otomatis menggunakan `face-api` pada rute /assessment & /lms yang akan mendeteksi presensi wajah user. Pengubahan User Interface (UI), pergeseran tag video form, atau modifikasi workflow di area uji/tes berisiko mengintervensi atau merusak logic deteksi ini.
3. **Standarisasi UI Komponen Lintas Portal**: Karena UI memakai kombinasi *Tailwind CSS* tingkat lanjut dan *Shadcn/UI*, konsistensi identitas estetika mutlak. Disarankan untuk menggunakan ulang komponen dari `/src/components/ui/` daripada melakukan kodifikasi komponen kustom dari nol, selama memikirkan varian tematik.
4. **Relasional Rantai Eksekusi DB Modifikasi**: Fitur yang mencakup area HR / LMS sangat relasional. Sebagai contoh, menghapus karyawan dapat memicu reaksi berantai ke pangkalan `attendance`, `okrs`, *scorecards*, dan `overtime_requests`. Gunakan constraint yang tepat (seperti `ON DELETE SET NULL` atau `CASCADE` mengikuti pola yang sudah ada).
