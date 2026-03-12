# Panduan & Kredensial Demo Arvela (SaaS HR)

Dokumen ini berisi rangkuman seluruh data demo (fiktif) yang telah disuntikkan ke dalam database aplikasi melalui skrip seeder (`supabase/seeds/demo_seed.sql`). Data ini dirancang khusus untuk memperagakan berbagai fitur platform dari perspektif peranan (role) yang berbeda.

Silakan gunakan informasi ini untuk mengeksplorasi fungsionalitas aplikasi atau sebagai rujukan dalam menyusun dokumen panduan (Technical Walkthrough / Demo Script).

---

## 🏢 1. Informasi Tenant Perusahaan (Company)
Seluruh data yang terhubung ke dalam ekosistem ini berada di bawah satu tenant perusahaan yang sama. Hal ini untuk mendemonstrasikan bahwa sistem Role-Level Security (RLS) menjaga ruang lingkup data per perusahaan (SaaS terisolasi).

*   **Nama Perusahaan:** PT Inovasi Teknologi Nusantara (Demo)
*   **Slug / Identifier:** `inovasi-nusantara-demo-1`
*   **Website:** https://inovasi.arvela.demo

---

## 🔐 2. Kredensial Akses Pengguna (Users & Roles)

Gunakan akun-akun di bawah ini pada halaman **Login** (`/login`) untuk mensimulasikan pandangan (view) dan batasan otoritas yang berbeda-beda.

> **⚠️ PENTING:** Semua akun di bawah ini menggunakan password default yang sama:
> **Password:** `Password123!`

| Role Sistem | Email Akses | Nama Profil | Departemen | Deskripsi Akses |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@arvelademo.local` | Budi Harjo | Management | Akses penuh ke sistem. Bisa melihat *Super Admin Dashboard* dan menambah akun. |
| **Owner** | `owner@arvelademo.local` | Ibu Nania Owner | Board of Directors | Eksekutif perusahaan. Melihat ringkasan *Owner Dashboard* (analitik tinggi perusahaan). |
| **HR Admin** | `hr@arvelademo.local` | Qiqi HR Admin | Human Resources | Admin SDM. Memiliki wewenang di *HR Admin Dashboard* (Rekrutmen, Lembur, Kehadiran). |
| **Employee** | `karyawan1@arvelademo.local` | Tatang R. | Engineering | Akun portal karyawan biasa (Tampilan staf non-admin). |
| **Employee** | `karyawan2@arvelademo.local` | Citra Kirana | Design | Akun portal karyawan biasa (Tampilan staf non-admin). |

---

## 🧭 3. Skenario Data yang Tersedia (Untuk Dieksplorasi)

Berikut adalah rekam data fiktif siap pakai yang akan langsung Anda temukan saat menjelajahi Dashboard dan Portal:

### A. Tiga Varian Dashboard Berbeda (Akses: Semua Admin)
Cobalah login bergantian menggunakan tiga akun admin (`superadmin`, `owner`, dan `hr`) untuk melihat perubahan wujud pada halaman utama Dashboard (`/dashboard`).
- **HR Admin** akan melihat statistik rekrutmen operasional (pelamar masuk, funnel rekrutmen, status lembur harian).
- **Owner** akan melihat grafik eksekutif (distribusi karyawan berupa Pie Chart, daftar karyawan berprestasi).
- **Super Admin** akan melihat status "System Control Panel" berisi daftar keseluruhan populasi *users* di tenant.

### B. Modul Rekrutmen (Jobs & Applications)
Masuk ke menu **Lowongan / Pekerjaan (`/dashboard/jobs`)** & **Kandidat (`/dashboard/candidates`)** menggunakan akun **HR Admin**:
- Terdapat **2 Lowongan Aktif**: "Senior Product Manager" (Hybrid) dan "Data Scientist Intern" (Remote).
- Terdapat **3 Pelamar (Candidates)** di lowongan Product Manager yang berada di berbagai Stage (Tahapan) berbeda:
  1. *Aditya Pratama* (Tahap: **Applied**)
  2. *Rina Sulviana* (Tahap: **Screening**)
  3. *Jonathan Setiawan* (Tahap: **Interview**)
- Anda dapat mencoba memindahkan stage (tahapan) mereka lewat UI Dashboard.

### C. Modul SDM: Absensi (Attendances)
Bila Anda membuka modul kehadiran (Attendance), terdapat data rekam absen *(Clock In / Clock Out)* untuk semua karyawan:
- Data direkam secara otomatis **tepat pada hari ini** dengan label status kehadiran **"Present" (Hadir)**.

### D. Modul SDM: Lembur (Overtime Requests)
Di dalam panel Pengajuan Lembur (`/dashboard/overtime`), terdapat demonstrasi persetujuan lembur:
- **1 Pengajuan Lembur Pending** dibuat oleh "Tatang R." hari ini (pukul 17:00 hingga 20:00).
- Alasan lembur: *"Mengejar deadline project"* dan bertugas menyelesaiakan *"modul laporan"*.
- **Aksi Uji Coba:** Anda bisa bertindak sebagai HR Admin yang merespons (Approve/Reject) pengajuan lembur ini.

---
*Dibuat secara otomatis oleh Agent AI Arvela.*
