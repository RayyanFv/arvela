# 📘 Arvela HCM: Documentation & User Guidelines

Selamat datang di **Arvela**, platform Manajemen Modal Manusia (HCM) yang dirancang untuk mengintegrasikan rekrutmen, manajemen karyawan, hingga pengembangan performa dalam satu ekosistem yang modern dan intuitif.

## 👥 Peran Pengguna (User Roles)

Platform ini memiliki tiga tingkat akses utama:

1.  **Super Admin & HR**: Pemegang kendali penuh. Mengelola data perusahaan, rekrutmen, kebijakan OKR, dan kurikulum pembelajaran.
2.  **Karyawan (Employee)**: Fokus pada produktivitas. Mengelola tugas onboarding, memperbarui target OKR, dan mengikuti kursus pengembangan.
3.  **Kandidat (Candidate)**: Pihak eksternal yang melamar pekerjaan dan mengikuti proses asesmen.

---

## 🏗️ Modul & Fitur Utama

### 1. Rekrutmen & Hiring (Siklus Kandidat)
Mengelola proses pencarian bakat dari hulu ke hilir.
- **URL**: `/dashboard/candidates`, `/dashboard/jobs`
- **Akses**: HR / Super Admin.
- **Fitur**:
    - **Job Management**: Membuat lowongan dengan kriteria spesifik.
    - **Candidate Assessment**: Mengirimkan link asesmen teknis/budaya kepada kandidat.
    - **Interview Scorecard**: Memberikan penilaian terstruktur (1-5) pada 5 aspek (Komunikasi, Teknis, Problem Solving, dll).
    - **Offer Letter**: Membuat dan mengirimkan surat penawaran kerja digital yang dapat ditandatangani kandidat.

### 2. Manajemen Karyawan (Data Master)
Pusat informasi seluruh aset manusia di perusahaan.
- **URL**: `/dashboard/employees`, `/dashboard/employees/[id]`
- **Akses**: HR / Super Admin.
- **Fitur**:
    - **Profil Digital**: Menyimpan data jabatan, divisi, hingga riwayat bergabung.
    - **Onboarding Tracker**: Melihat progres ceklis orientasi setiap karyawan baru secara spesifik.
    - **LMS Assignment**: Memberikan kursus pelatihan langsung dari profil karyawan.

### 3. Manajemen Kinerja (OKR - Objective & Key Results)
Sistem manajemen target berbasis data (Quantitative Measurement).
- **URL**: `/staff/okrs` (Employee) / `/dashboard/employees/[id]` (HR View).
- **Fitur**:
    - **Objektif (O)**: Tujuan utama kuartalan yang inspiratif.
    - **Key Result (KR)**: Indikator terukur (angka/persen). Update KR akan otomatis mengubah persentase progres Objektif.
    - **Inisiatif (IN)**: Rencana aksi konkret untuk mendukung tercapainya KR.

### 4. Learning Management System (LMS)
Pusat pembelajaran mandiri dan peningkatan skill.
- **URL**: `/dashboard/lms` (Admin) / `/staff/courses` (Employee).
- **Fitur**:
    - **Course Builder**: Membuat modul pembelajaran (Video, PDF, Teks, Quiz).
    - **Assignment**: Menugaskan kursus ke karyawan spesifik dengan deadline tertentu.
    - **Certificate**: Penerbitan sertifikat digital otomatis setelah kursus diselesaikan.

---

## 🔄 Alur Proses Bisnis (Business Workflow)

### A. Proses Onboarding Karyawan Baru
1. HR membuat **Onboarding Template** di menu pengaturan.
2. Saat status kandidat berubah menjadi 'Hired', sistem otomatis membuat entri Karyawan.
3. HR menugaskan template onboarding tersebut kepada karyawan baru.
4. Karyawan login ke portal `/staff` dan melihat daftar tugas di **Tugas Orientasi**.
5. Karyawan melakukan ceklis mandiri, dan HR dapat memantau progresnya secara real-time.

### B. Siklus Manajemen Kinerja (OKR)
1. Perusahaan/Manajer menetapkan Target Kuartal.
2. Manajer menambahkan **OKR** di profil karyawan melalui dashboard admin.
3. Karyawan memperbarui nilai aktual Key Result secara berkala (misal: "Capai 100 Penjualan", jika terjual 50, update ke 50).
4. Sistem menghitung secara otomatis: Jika KR mencapai 100%, maka Objektif pun dianggap tuntas.

### C. Alur Pelatihan & Sertifikasi
1. HR membuat kursus "Standard Operasional Prosedur" di menu **LMS**.
2. HR memilih karyawan yang wajib mengikuti pelatihan tersebut.
3. Karyawan menerima notifikasi di dashboard portal staff.
4. Karyawan menyelesaikan seluruh materi dan quiz.
5. Sistem menerbitkan **Nomor Sertifikat Unik** (Arvela-XXXX) sebagai bukti kompetensi.

---

## 📍 Navigasi Cepat (Quick Links)

| Nama Fitur | URL Path | Hak Akses |
| :--- | :--- | :--- |
| **Dashboard Admin** | `/dashboard` | HR, Admin |
| **Portal Karyawan** | `/staff` | Karyawan |
| **Daftar Karyawan** | `/dashboard/employees` | HR, Admin |
| **Manajemen Kursus** | `/dashboard/lms` | HR, Admin |
| **Detail Profil Staff** | `/staff/profile` | Karyawan (Self) |

---

---

## 🎓 Panduan Sertifikasi (Certificates)

### 1. Bagaimana Karyawan Mendapatkan Sertifikat?
Sertifikat di Arvela diterbitkan secara otomatis berdasarkan penyelesaian materi:
- **Prasyarat**: Karyawan harus menyelesaikan seluruh materi (video/PDF/teks) hingga progres mencapai **100%**.
- **Akses Karyawan**: Buka menu **Kursus Saya** di portal `/staff/courses`. Jika kursus sudah selesai, klik tombol **"Lihat Sertifikat"**.
- **Setup Sertifikat**: Sertifikat menggunakan template standar Arvela yang mencakup Nama Karyawan, Nama Kursus, Tanggal Terbit, dan **Nomor Sertifikat Unik** untuk validasi.

### 2. Monitoring oleh HR (Daftar Sertifikat)
HR dapat melihat seluruh sertifikat yang telah diterbitkan untuk seluruh karyawan di:
- **URL**: `/dashboard/lms` -> Tab **"Daftar Sertifikat"**.
- **Informasi**: Di sini HR dapat melacak nomor sertifikat, siapa penerimanya, dan kapan sertifikat tersebut diterbitkan.

---

## 💡 Tips & Dampak Aksi
- **Update KR**: Setiap perubahan angka pada Key Result berdampak langsung pada nilai KPI karyawan yang terekam secara permanen di basis data.
- **Ceklis Onboarding**: Pastikan setiap tugas diceklis tepat waktu agar status karyawan segera berubah dari 'Onboarding' menjadi 'Active'.
- **Status Kursus**: Kursus yang disetel sebagai 'Draft' tidak akan muncul di portal karyawan. Pastikan klik **Publish** agar materi dapat dipelajari.
- **Akses Tombol Update Status**: Jika tombol update status pada kandidat sulit diakses di perangkat tertentu, gunakan **Quick Stage Bar** (Link navigasi cepat) yang terletak tepat di atas menu dropdown status pada halaman detail kandidat.

- **Pembaruan Email Portal**: Di setiap email notifikasi untuk kandidat, kini tersedia link teks manual (Fallback URL) di atas tombol aksi utama. Ini berguna jika tombol pada email kandidat tidak dapat diklik atau diblokir oleh sistem email mereka.
- **Struktur File Script**: File-file skrip pengecekan (seperti `check_all.js`, `check_db.js`, dll) telah dipindahkan ke folder `scripts/` untuk menjaga kerapihan direktori utama.

---
*Dokumentasi ini dibuat untuk memudahkan Client memahami fungsionalitas Arvela secara komprehensif.*
