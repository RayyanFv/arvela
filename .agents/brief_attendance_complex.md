# Brief: Complex Attendance & Leave Management

## 1. Analisis Kebutuhan & Tujuan
Sistem kehadiran dasar (Clock-in / Clock-out) sudah tidak cukup untuk mencakup dinamika kerja tim nyata. Kita perlu berekspansi menjadi **Time & Attendance + Leave Management System** yang komprehensif.

Fitur utama yang akan ditambahkan:
1. **Manajemen Ketidakhadiran (Time-Off)**: Cuti, Sakit, Izin.
2. **Manajemen Eksepsi Hari Kerja**: Terlambat, Pulang Cepat, Lupa Absen.
3. **Manajemen Kalender & Libur**: Hari libur nasional, libur perusahaan, dan jadwal shifting dasar.

---

## 2. Struktur Fitur yang Disarankan

### A. Time-Off & Leave Management (Manajemen Cuti & Ketidakhadiran)
Karyawan tidak selalu bisa masuk. Kita butuh modul agar mereka bisa mengajukan ketidakhadiran secara formal.
*   **Tipe Pengajuan (Leave Types):**
    *   **Cuti Tahunan (Annual Leave)**: Memotong saldo cuti.
    *   **Sakit (Sick Leave)**: Membutuhkan *attachment* (foto surat dokter).
    *   **Izin Khusus**: Berkabung, Cuti Melahirkan, Menikah (biasanya tidak memotong cuti tahunan).
*   **Alur Persetujuan (Customizable Approval Flow)**: Sistem mendukung *approval* bertingkat yang fleksibel. Admin dapat mengatur siapa saja yang berwenang menyetujui pengajuan (misal: Atasan Langsung saja, atau Atasan Langsung -> HRD, dsb).
*   **Sistem Saldo (Balance Tracking)**: Lacak sisa cuti tahunan masing-masing karyawan secara otomatis.

### B. Daily Exceptions (Eksepsi & Koreksi Jam Kerja)
Karyawan hadir, tapi ada anomali pada jamnya.
*   **Pulang Cepat (Early Leave) & Datang Terlambat (Late In)**: Form mini di mana karyawan harus mengisi alasan (justifikasi) mengapa mereka pulang cepat atau datang telat, untuk diverifikasi.
*   **Lupa Absen (Missed Punch / Attendance Correction)**: Karyawan lupa *clock in* atau *clock out*. Mereka bisa mengajukan "Koreksi Absen" ke atasan.
*   **Mekanisme Otomatis "Alpa"**: 
    1. Jika hari ini adalah Hari Kerja Wajib dan karyawan tidak *clock-in* sama sekali (serta tidak ada pengajuan izin/cuti yang *Approved*), sistem otomatis memberi label **Alpa (Tidak Hadir Tanpa Keterangan)** pada akhir hari.
    2. Jika karyawan mengajukan Koreksi Absen (Lupa Absen) namun **Ditolak (Rejected)** oleh Approver, maka sistem mengembalikan log ke kondisi awal (jika tidak ada data sama sekali, tetap menjadi **Alpa**).

### C. Holiday & Schedule Management (Kalender Libur Nasional & Perusahaan)
Agar sistem tahu kapan harus menghitung "Alpa" dan kapan memang sedang libur.
*   **Tabel Hari Libur Nasional (Holidays)**: Admin bisa mensetting tanggal merah dalam satu tahun.
*   **Hadir di Hari Libur (Holiday Work / Overtime)**: Sistem harus bisa mendeteksi jika karyawan melakukan *clock-in* pada hari libur nasional atau akhir pekan. Status kehadirannya bukan "Reguler", melainkan ditandai khusus (misal: "Hadir Libur" atau "Overtime Holiday"). Data ini krusial untuk perhitungan kompensasi lembur/uang makan.
*   *(Opsional untuk masa depan)* **Work Schedules / Shifts**: Jika perusahaan punya jam kerja non-standar (Shift malam, dll). Untuk sekarang bisa diasumsikan *Fixed Schedule* (misal: Senin - Jumat).

---

## 3. Dampak pada Skema Database (Supabase)
Kita perlu merancang atau merombak beberapa tabel:
1.  **`company_holidays`**: `id`, `date`, `name`, `type` (National, Company).
2.  **`leave_types`**: `id`, `name`, `is_paid`, `requires_attachment`.
3.  **`leave_balances`**: `karyawan_id`, `leave_type_id`, `year`, `balance`, `used`.
4.  **`attendance_requests`** (Bisa mencakup cuti, sakit, dan koreksi waktu): `id`, `karyawan_id`, `type`, `start_date`, `end_date`, `reason`, `attachment_url`, `status` (Pending, Approved, Rejected), `approved_by`.

---

## 4. Rencana Eksekusi (Langkah Demi Langkah)
Tahap mana yang sebaiknya kita kerjakan dulu?
*   **Tahap 1**: Setup Database schema (Tabel libur, cuti, saldo)
*   **Tahap 2**: Backend Logic & Edge Functions (Cron job untuk memotong saldo cuti beda tahun, dll jika perlu).
*   **Tahap 3**: UI Karyawan Karyawan (Pengajuan Form & Dashboard Kuota Cuti).
*   **Tahap 4**: UI Admin/Manager (Approve/Reject Dashboard).
