import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const ARTICLES = [
    // ─── CATEGORY 1: HRIS & DIGITALIZATION ─────────────────────────────────
    {
        title: ' Apa Itu HRIS? Panduan Lengkap Sistem Informasi SDM Modern 2026',
        slug: 'apa-itu-hris-panduan-lengkap-sistem-informasi-sdm-modern',
        category: 'HR Tech',
        author_name: 'Tim Redaksi Arvela',
        meta_title: 'Apa Itu HRIS? Panduan Lengkap Software HR 2026',
        meta_description: 'Pelajari definisi HRIS, fungsi utama, manfaat bagi perusahaan skala kecil hingga enterprise, serta tips memilih software HR terbaik.',
        keywords: ['hris indonesia', 'apa itu hris', 'software hr', 'sistem informasi sdm', 'arvela hrms'],
        content: `## Mengapa HRIS Sangat Krusial Bagi Perusahaan Modern?

Di era transformasi digital 2026, pengelolaan Sumber Daya Manusia (SDM) secara manual dengan spreadsheet atau dokumen fisik sudah jauh ketinggalan zaman. **Human Resource Information System (HRIS)** adalah platform perangkat lunak terintegrasi yang merampingkan seluruh operasional HR, mulai dari rekruitmen, absensi online GPS, pengolahan payroll, hingga evaluasi kinerja karyawan.

---

### 💡 4 Manfaat Utama Menggunakan HRIS Cloud Arvela

1. **Efisiensi Waktu dan Biaya Operational**  
   Mengurangi beban administrasi berulang hingga 75% sehingga tim HR bisa berfokus pada strategi retensi talent.
2. **Akurasi Data Tanpa Human Error**  
   Perhitungan absensi, lembur, dan izin otomatis terhubung secara langsung tanpa perlu rekap manual bulanan.
3. **Kepatuhan Hukum & Keamanan Data**  
   Terproteksi enkripsi tingkat tinggi sesuai regulasi perlindungan data pribadi (PDP) Kemenkominfo.
4. **Self-Service Karyawan (ESS)**  
   Karyawan dapat mengajukan klaim lembur, izin sakit, dan melihat slip gaji langsung melalui portal mandiri.

---

## Fitur Wajib yang Harus Ada pada Software HRIS

Saat memilih software HRIS di Indonesia, pastikan platform Anda memiliki fitur bawaan berikut:
- **Absensi Geofencing & Biometrik** untuk mencegah kecurangan titik lokasi.
- **Multi-Level Approval** untuk izin, eksepsi, dan lembur secara fleksibel.
- **Management Talent Pool & ATS** untuk mempercepat proses rekrutmen.
- **Sistem Ujian Kompetensi & Proctoring AI** untuk menilai kandidat secara akurat.

---

> **Kesimpulan:** Mengadopsi HRIS modern seperti Arvela bukan sekadar modernisasi tools, melainkan investasi strategis untuk melipatgandakan produktivitas dan skalabilitas bisnis perusahaan Anda.`
    },
    {
        title: ' 10 Alasan Utama Mengapa Perusahaan Anda Harus Migrasi ke HRIS Cloud',
        slug: '10-alasan-utama-mengapa-perusahaan-harus-migrasi-ke-hris-cloud',
        category: 'HR Tech',
        author_name: 'Rian Hidayat, M.M.',
        meta_title: '10 Alasan Mengapa Perusahaan Harus Migrasi ke HRIS Cloud',
        meta_description: 'Simak 10 alasan krusial mengapa perusahaan menengah dan besar beralih dari software HR legacy berbasis on-premise ke HRIS berbasis Cloud.',
        keywords: ['hris cloud', 'migrasi hris', 'software hr online', 'digitalisasi hr'],
        content: `## Pengantar: Pergeseran dari On-Premise ke Cloud HRIS

Banyak perusahaan merasa ragu meninggalkan sistem legacy on-premise atau Excel yang telah digunakan bertahun-tahun. Namun, pertumbuhan bisnis yang cepat membutuhkan fleksibilitas dan kecepatan akses yang hanya bisa disediakan oleh **Cloud-based HRIS**.

---

###  10 Keuntungan Utama HRIS Berbasis Cloud

1. **Aksesibilitas 24/7 Dari Mana Saja** — Tim HR dan manajer dapat menyetujui pengajuan izin kapan saja.
2. **Biaya Investasi Awal Lebih Hemat** — Tanpa server fisik yang mahal dan pemeliharaan IT bulanan.
3. **Pembaruan Fitur Otomatis** — Fitur baru langsung tersedia tanpa biaya instalasi tambahan.
4. **Skalabilitas Mudah** — Menambah slot lokasi kerja atau jumlah staf dalam hitungan detik.
5. **Keamanan Siber Tingkat Enterprise** — Backup otomatis berkala dan proteksi SSL 256-bit.
6. **Integrasi WhatsApp & Email Notifikasi** — Komunikasi persetujuan terasa instan.
7. **Multi-Tenant Isolation** — Data setiap perusahaan terenkripsi dan terpisah penuh.
8. **Pengurangan Penggunaan Kertas (Paperless)** — Ramah lingkungan dan ramah biaya gudang arsip.
9. **Analitik Real-Time** — Dashboard visual tingkat turn-over dan rasio produktivitas.
10. **Pengalaman Kerja Karyawan Lebih Baik (Employee Experience)** — UI modern yang intuitif.

---

> Panduan Migrasi: Pastikan Anda memilih penyedia HRIS yang menawarkan migrasi data massal via template Excel rapi seperti **Arvela HRMS**.`
    },
    {
        title: ' Tren HR Tech 2026: Kecerdasan Buatan dan Otomatisasi SDM di Indonesia',
        slug: 'tren-hr-tech-2026-kecerdasan-buatan-dan-otomatisasi-sdm',
        category: 'Research',
        author_name: 'Siti Rahmawati, S.Psi.',
        meta_title: 'Tren HR Tech 2026: AI & Otomatisasi SDM di Indonesia',
        meta_description: 'Pelajari tren teknologi HR terbaru tahun 2026, mulai dari AI proctoring, resume screening otomatis, hingga analisa engagement karyawan.',
        keywords: ['tren hr tech 2026', 'ai hr indonesia', 'otomatisasi hr', 'rekrutmen ai'],
        content: `## Masa Depan Pengelolaan SDM Berbasis AI

Teknologi Kecerdasan Buatan (AI) bukan lagi masa depan, melainkan standar baru operasional HR hari ini. Di Indonesia, adopsi AI dalam HRMS tumbuh sebesar 145% sepanjang tahun 2025–2026.

---

### 🔍 3 Fokus Utama Tren AI HR Tech 2026

- **1. AI Resume Screening & Parsing**  
  Membaca dan memilah ribuan CV pelamar dalam hitungan detik berdasarkan kecocokan kompetensi dan skor relevansi.
- **2. Smart Proctoring Online Assessment**  
  Mendeteksi tab-switching, wajah ganda, atau pergerakan mencurigakan selama ujian kompetensi rekrutmen secara otomatis.
- **3. Predictive Turnover Analytics**  
  Menganalisis pola absensi dan keterlibatan staf untuk memberikan peringatan dini jika terdapat karyawan kunci yang berisiko resign.

---

> Dengan memanfaatkan platform HRIS Arvela, perusahaan Anda dapat memanfaatkan fitur-fitur mutakhir ini untuk memenangkan kompetisi talenta di industri.`
    },
    {
        title: ' Menghitung ROI Implemetasi HRIS: Apakah Layak Investasi?',
        slug: 'menghitung-roi-implementasi-hris-apakah-layak-investasi',
        category: 'Insight',
        author_name: 'Dian Kusumawati',
        meta_title: 'Cara Menghitung ROI Implementasi HRIS Perusahaan',
        meta_description: 'Panduan taktis menghitung Return on Investment (ROI) sebelum membeli software HRIS untuk meyakinkan pihak jajaran direksi.',
        keywords: ['roi hris', 'biaya hris', 'investasi software hr', 'analisis biaya hr'],
        content: `## Bagaimana Membuktikan Layaknya Investasi HRIS ke Direksi?

Salah satu tantangan terbesar Tim HR adalah membuktikan manfaat finansial (*Return on Investment*) saat mengajukan anggaran pengadaan software HRIS kepada Owner atau Chief Executive Officer.

---

### 📊 Formula Dasar Perhitungan ROI HRIS

$$\\text{ROI (\\%)} = \\frac{\\text{Total Penghematan Jam Kerja + Penghematan Kertas} - \\text{Biaya Langganan HRIS}}{\\text{Biaya Langganan HRIS}} \\times 100\\%$$

#### Studi Kasus Perusahaan 100 Karyawan:
- **Penghematan Waktu Rekap Absensi Manual:** 25 jam/bulan x Rp 100.000/jam = **Rp 2.500.000**
- **Pencegahan Fraud Lembur Fiktif:** Est. 5% kebocoran anggaran lembur = **Rp 4.000.000**
- **Total Penghematan Bulanan:** **Rp 6.500.000**
- **Biaya Langganan Paket Arvela Max (150 Staf):** **Rp 420.000 / bulan**

> **Kesimpulan ROI:** Menggunakan Arvela memberikan pengembalian investasi lebih dari **1.400% setiap bulannya**!`
    },
    {
        title: ' Checklist Penting Sebelum Melakukan Migrasi Data Karyawan ke HRIS Baru',
        slug: 'checklist-penting-sebelum-migrasi-data-karyawan-ke-hris-baru',
        category: 'Tutorial',
        author_name: 'Tim Redaksi Arvela',
        meta_title: 'Checklist Migrasi Data Karyawan ke HRIS Baru',
        meta_description: 'Hindari error dan kebocoran data dengan checklist 7 langkah migrasi data karyawan dari Excel ke platform HRIS terintegrasi.',
        keywords: ['migrasi data karyawan', 'import excel hr', 'template karyawan hris'],
        content: `## Persiapan Migrasi Data Tanpa Hambatan

Proses migrasi data SDM sering kali menjadi tahap paling menegangkan bagi Manajer HR. Kesalahan format data atau duplikasi email dapat menyebabkan kekacauan pada bulan pertama penggunaan sistem.

---

### 📋 Checklist 7 Langkah Migrasi Sukses:

1. ✅ **Pembersihan Data (Data Cleansing)**: Hapus akun karyawan yang sudah resign lama.
2. ✅ **Standarisasi Pangkat & Golongan**: Pastikan penamaan grade sesuai struktur terpusat (contoh: *Staf (STF - Level 7)* hingga *Direktur (DIR - Level 1)*).
3. ✅ **Struktur Unit Kerja (Depatemen)**: Tetapkan Unit Induk dan Unit Penugasan dengan jelas.
4. ✅ **Validasi Email Unik**: Email merupakan ID login unik untuk setiap pengguna.
5. ✅ **Verifikasi Email Atasan (Manager Email)**: Diperlukan untuk alur persetujuan lembur dan izin 2-stage approval.
6. ✅ **Gunakan Template Excel Resmi**: Unduh *Template Import Karyawan* berformat dinamis dengan daftar referensi terintegrasi.
7. ✅ **Uji Coba Batch Kecil**: Lakukan tes impor 5–10 karyawan terlebih dahulu sebelum mengunggah ratusan staf sekaligus.`
    },
    {
        title: ' Strategi Menjaga Keamanan Data Pribadi Karyawan Sesuai Undang-Undang PDP',
        slug: 'strategi-menjaga-keamanan-data-pribadi-karyawan-sesuai-uu-pdp',
        category: 'Compliance',
        author_name: 'Budi Santoso, S.H.',
        meta_title: 'Keamanan Data Karyawan & Kepatuhan UU PDP Indonesia',
        meta_description: 'Bagaimana perusahaan menjaga kerahasiaan data karyawan dan mematuhi regulasi Pelindungan Data Pribadi (PDP) dengan sistem HRIS terenkripsi.',
        keywords: ['uu pdp indonesia', 'keamanan data hr', 'privasi karyawan', 'compliance hris'],
        content: `## Implikasi Undang-Undang Pelindungan Data Pribadi (UU PDP) Bagi HR

Pengesahan UU PDP menetapkan bahwa data identitas karyawan, data medis, hingga struktur gaji adalah **Data Pribadi Spesifik** yang dilindungi hukum. Kebocoran data akibat penggunaan file Excel tanpa proteksi password dapat memicu sanksi administratif dan denda besar.

---

### 🛡️ 3 Akses Proteksi Utama pada Arvela HRMS:

- **1. Role-Based Access Control (RBAC)**  
  Hanya peran yang berwenang (misalnya HR Admin dan Owner) yang dapat mengakses biodata staf dan manajemen gaji.
- **2. Audit Trail Log Impersonasi**  
  Tindakan *Login As* tercatat secara transparan dengan banner penanda sehingga terhindar dari penyalahgunaan wewenang.
- **3. Enkripsi SSL/TLS & Row Level Security (RLS)**  
  Data antar perusahaan terpisah total dalam tingkat arsitektur database Supabase.`
    },

    // ─── CATEGORY 2: REKRUTMEN & ATS ─────────────────────────────────────────
    {
        title: ' Panduan Menggunakan Applicant Tracking System (ATS) untuk Mempercepat Hiring 5x Lebih Cepat',
        slug: 'panduan-menggunakan-ats-untuk-mempercepat-hiring-5x-lebih-cepat',
        category: 'Recruitment',
        author_name: 'Siti Rahmawati, S.Psi.',
        meta_title: 'Panduan ATS Rekrutmen: Hiring 5x Lebih Cepat',
        meta_description: 'Cara mengoptimalkan penggunaan Applicant Tracking System (ATS) Arvela untuk mengelola funnel kandidat dari Applied hingga Hired.',
        keywords: ['applicant tracking system', 'ats indonesia', 'rekrutmen online', 'software rekrutmen'],
        content: `## Mengapa Proses Rekrutmen Manual Sangat Menyita Waktu?

Menyaring ratusan email lamaran satu per satu adalah penyebab utama lamanya proses *Time-to-Hire* perusahaan. **Applicant Tracking System (ATS)** menyatukan seluruh saluran lamaran ke dalam satu papan Kanban interaktif.

---

### 🚀 6 Tahapan Funnel Rekrutmen Efektif di Arvela ATS:

1. **Applied** — Lamaran masuk otomatis dari halaman portal karir perusahaan.
2. **Screening** — Penyaringan awal kualifikasi dan kelengkapan berkas CV.
3. **Assessment** — Pengerjaan ujian online kompetensi atau psikotes teratur.
4. **Interview** — Penjadwalan wawancara live dengan link terintegrasi.
5. **Offered** — Pengiriman surat penawaran kerja (Offering Letter).
6. **Hired** — Konversi otomatis kandidat terpilih menjadi staf aktif di sistem!`
    },
    {
        title: ' 7 Kesalahan Fatal Saat Menyusun Deskripsi Lowongan Kerja (Job Description)',
        slug: '7-kesalahan-fatal-saat-menyusun-deskripsi-lowongan-kerja',
        category: 'Recruitment',
        author_name: 'Dian Kusumawati',
        meta_title: '7 Kesalahan Menyusun Deskripsi Lowongan Kerja (Job Ads)',
        meta_description: 'Pelajari kesalahan umum dalam iklan lowongan kerja yang membuat kandidat berkualitas enggan melamar dan cara memperbaikinya.',
        keywords: ['job description', 'iklan lowongan kerja', 'rekrutmen berkualitas', 'tips hr'],
        content: `## Menarik Talenta Terbaik Dimulai Dari Job Description yang Tepat

Deskripsi pekerjaan yang samar atau terlalu menuntut tanpa imbalan sepadan akan menurunkan minat kandidat berkualitas tinggi (*top talents*).

---

### ❌ 7 Kesalahan Yang Harus Dihindari:

1. **Judul Posisi Terlalu Asing** — Gunakan istilah standar industri (contoh: *Senior Backend Engineer* daripada *Code Ninja*).
2. **Tidak Menyantumkan Rentang Gaji** — Iklan kerja dengan transparansi gaji mendapat respon **45% lebih tinggi**.
3. **Daftar Persyaratan Terlalu Panjang** — Fokus pada 5–7 kualifikasi inti.
4. **Lokasi Kerja Tidak Jelas** — Sebutkan secara pastiapakah posisi bersifat On-site, Hybrid, atau Remote.
5. **Format Tanpa Paragraf Singkat** — Gunakan poin-poin *bullet list* agar mudah dibaca di smartphone.
6. **Lupa Menjelaskan Budaya Perusahaan** — Berikan gambaran singkat tentang tim dan benefit kerja.
7. **Proses Lamaran Berbelit-belit** — Manfaatkan link lamaran satu klik melalui Portal Karir Arvela.`
    },
    {
        title: ' Cara Mengurangi Turnover Karyawan Baru dengan Otomatisasi Pre-Onboarding',
        slug: 'cara-mengurangi-turnover-karyawan-baru-dengan-otomatisasi-pre-onboarding',
        category: 'Recruitment',
        author_name: 'Rian Hidayat, M.M.',
        meta_title: 'Cara Mengurangi Turnover Karyawan Baru dengan Pre-Onboarding',
        meta_description: 'Tingkatkan retensi staf baru sejak hari pertama dengan checklist otomatisasi onboarding dan penugasan mentor.',
        keywords: ['onboarding karyawan', 'pre onboarding', 'retensi karyawan', 'turnover rate'],
        content: `## Poin Kritis 90 Hari Pertama Karyawan Baru

Riset menunjukkan bahwa **33% karyawan baru memutuskan resign dalam 6 bulan pertama** apabila proses sambutan dan pembekalan (*onboarding*) tidak terstruktur dengan baik.

---

### ✨ Alur Onboarding Sukses Menggunakan Arvela HRMS:

- **Hari -3 (Pre-Arrival)**: Pengiriman modul materi via portal staf dan pembuatan akun otomatis.
- **Hari Ke-1**: Sambutan tim dan penunjukan *Direct Manager* serta *Buddy Mentor*.
- **Minggu Ke-1**: Pengerjaan modul kursus dasar di platform LMS Arvela.
- **Bulan Ke-1**: Evaluasi skor OKR / KPI awal oleh atasan langsung.`
    },
    {
        title: ' Panduan Penjadwalan Interview Kerja Online Bebas Bentrok',
        slug: 'panduan-penjadwalan-interview-kerja-online-bebas-bentrok',
        category: 'Recruitment',
        author_name: 'Siti Rahmawati, S.Psi.',
        meta_title: 'Panduan Penjadwalan Interview Online Bebas Bentrok',
        meta_description: 'Tips mengelola modul wawancara kerja terintegrasi dengan kalender pewawancara dan penilaian scorecard terpusat.',
        keywords: ['interview online', 'penjadwalan wawancara', 'scorecard interview', 'rekrutmen hr'],
        content: `## Efisiensi Wawancara Tanpa Bolak-Balik Email

Mengatur jadwal wawancara antara calon karyawan dan *User Manager* yang sibuk sering kali memerlukan belasan kali penyesuaian email.

---

### 📅 Keunggulan Fitur Interview Arvela:

- **Penjadwalan Otomatis**: Pengiriman undangan wawancara lengkap dengan tautan room meeting.
- **Live Interview Scorecard**: Pewawancara memberi skor kriteria (Komunikasi, Problem Solving, Technical Skill) secara *real-time* saat wawancara berlangsung.
- **Rekap & Keputusan Terpusat**: Seluruh skor tersimpan rapi pada profil pelamar tanpa risiko penilaian subjektif.`
    },
    {
        title: ' Mencegah Kecurangan Ujian Online dengan Fitur Proctoring AI',
        slug: 'mencegah-kecurangan-ujian-online-dengan-fitur-proctoring-ai',
        category: 'Recruitment',
        author_name: 'Tim Redaksi Arvela',
        meta_title: 'Mencegah Kecurangan Ujian Online dengan AI Proctoring',
        meta_description: 'Bagaimana fitur proctoring otomatis mendeteksi joki ujian dan tab-switching pada tes asesmen penerimaan karyawan.',
        keywords: ['proctoring ai', 'ujian online hr', 'tes psikotes online', 'asesmen karyawan'],
        content: `## Integritas Hasil Ujian Kompetensi Pelamar

Tes kompetensi online tanpa pengawasan rentan terhadap penggunaan joki atau pencarian jawaban melalui mesin pencari di tab terpisah.

---

### 👁️ Fitur Anti-Cheat Proctoring Arvela:

1. **Detection of Tab Switching**: Mencatat berapa kali pelamar berpindah window browser selama ujian.
2. **Camera Snapshots Verification**: Mengambil foto berkala untuk memverifikasi wajah peserta.
3. **Time Limit Enforcement**: Batas waktu per soal yang ketat untuk mencegah kebocoran jawaban.
4. **Skor Otomatis & Laporan Pelanggaran**: Mengategorikan peserta dalam status *Low Risk*, *Medium Risk*, atau *High Risk Violations*.`
    },

    // ─── CATEGORY 3: ABSENSI, LEMBUR & SHIFT KERJA ────────────────────────────
    {
        title: ' Panduan Mengatur Absensi Geofencing GPS & Radius Kantor di Arvela HR',
        slug: 'panduan-mengatur-absensi-geofencing-gps-radius-kantor',
        category: 'Tutorial',
        author_name: 'Tim Redaksi Arvela',
        meta_title: 'Panduan Absensi Geofencing GPS & Radius Kantor HRMS',
        meta_description: 'Langkah mudah mengonfigurasi koordinat Latitude, Longitude, dan Radius Toleransi M untuk absensi mobile staf.',
        keywords: ['absensi gps', 'geofencing hris', 'absensi radius kantor', 'aplikasi absensi mobile'],
        content: `## Mengapa Absensi GPS Penting untuk Perusahaan Hybrid & Field Team?

Sistem absensi cetak jari (fingerprint) tradisional terbatas pada gedung fisik kantor. Di era kerja hybrid dan tim lapangan, perusahaan memerlukan **Absensi Berbasis Geofencing GPS**.

---

### ⚙️ Cara Konfigurasi Radius Kantor di Arvela:

1. Buka menu **Pengaturan Perusahaan (Company Settings)**.
2. Masukkan titik koordinat **Latitude** dan **Longitude** lokasi utama atau cabang perusahaan.
3. Tentukan **Radius Toleransi** (misalnya *100 meter* dari titik pusat gedung).
4. Saat karyawan melakukan *Clock-In* atau *Clock-Out* dari aplikasi staf, sistem secara otomatis memvalidasi apakah koordinat HP staf berada di dalam radius resmi.`
    },
    {
        title: ' Memahami Alur 2-Stage Approval untuk Izin, Lembur, dan Resign Karyawan',
        slug: 'memahami-alur-2-stage-approval-untuk-izin-lembur-dan-resign',
        category: 'Insight',
        author_name: 'Rian Hidayat, M.M.',
        meta_title: 'Alur 2-Stage Approval Izin, Lembur & Resign Karyawan',
        meta_description: 'Penjelasan hirarki persetujuan 2 tingkat (Atasan Langsung -> HR Admin) untuk menjaga akuntabilitas operasional perusahaan.',
        keywords: ['approval 2 tingkat', 'persetujuan lembur', 'pengajuan izin karyawan', 'hr approval workflow'],
        content: `## Mengapa Sistem Persetujuan Dua Tingkat Diperlukan?

Persetujuan tunggal sering kali memicu konflik kepentingan atau kurangnya pengawasan dari manajer operasional.

---

### 🔄 Alur Kerja 2-Stage Approval Arvela:

- **Tahap 1: Atasan Langsung (Direct Manager)**  
  Meninjau urgensi tugas, beban kerja tim, dan ketersediaan kuota lembur/izin staf terkait.
- **Tahap 2: HR Admin / Owner**  
  Melakukan verifikasi kepatuhan anggaran, aturan batas maksimum lembur bulanan, serta sinkronisasi ke data absensi resmi.

> **Manfaat:** Menghindari manipulasi jam kerja dan memastikan anggaran operasional perusahaan tetap terkendali.`
    },
    {
        title: ' 5 Cara Efektif Mencegah Kecurangan Lembur (Overtime Fraud) di Perusahaan',
        slug: '5-cara-efektif-mencegah-kecurangan-lembur-di-perusahaan',
        category: 'Compliance',
        author_name: 'Budi Santoso, S.H.',
        meta_title: '5 Cara Mencegah Fraud Lembur Karyawan di Perusahaan',
        meta_description: 'Strategi praktis mencegah pengajuan lembur fiktif dengan batas kuota otomatis dan verifikasi atasan.',
        keywords: ['fraud lembur', 'lembur fiktif', 'pengawasan lembur', 'biaya lembur hr'],
        content: `## Kebocoran Anggaran Akibat Lembur Tanpa Pengawasan

Pengajuan lembur yang tidak tervalidasi dapat membengkakkan biaya operasional perusahaan hingga 20% setiap bulannya.

---

### 🛡️ 5 Langkah Pencegahan Fraud Lembur:

1. **Pre-Approval Mandatory** — Lembur wajib diajukan sebelum jam kerja berakhir, bukan setelah pekerjaan selesai.
2. **Deskripsi Tugas Spesifik** — Wajib mencantumkan *target deliverable* yang harus diselesaikan selama jam lembur.
3. **Validasi Absensi Pulang (Clock-Out Time)** — Jam lembur yang diakui tidak boleh melebihi jam fisik *Clock-Out* karyawan.
4. **Batas Maksimum Lembur Per Bulan** — Konfigurasi kuota maksimal lembur per individu sesuai regulasi Depnaker (max 18 jam/minggu).
5. **Audit Trail Rekap Lembur** — Laporan rekap harian yang dapat diunduh langsung oleh Manajer Keuangan.`
    },
    {
        title: ' Mengelola Hari Libur Nasional dan Kalender Kerja Khusus Perusahaan Multi-Cabang',
        slug: 'mengelola-hari-libur-nasional-dan-kalender-kerja-khusus',
        category: 'Tutorial',
        author_name: 'Tim Redaksi Arvela',
        meta_title: 'Mengelola Hari Libur & Kalender Kerja Multi-Cabang',
        meta_description: 'Cara mengatur tanggal merah, cuti bersama, dan hari libur lokal cabang pada platform HRIS Arvela.',
        keywords: ['hari libur nasional', 'kalender kerja hr', 'cuti bersama hris', 'absensi cabang'],
        content: `## Fleksibilitas Kalender Kerja Perusahaan Modern

Perusahaan dengan banyak kantor cabang (misalnya cabang Bali, Jakarta, dan Medan) memiliki variasi hari libur keagamaan daerah yang berbeda.

---

### 📍 Fitur Pengaturan Kalender di Arvela:

- **Global Holidays**: Menandai Hari Libur Nasional resmi pemerintah Indonesia (misalnya Idul Fitri, Tahun Baru Masehi).
- **Custom Company Holidays**: Menambahkan hari libur khusus ulang tahun perusahaan atau cuti bersama internal.
- **Automatic Attendance Adjustment**: Hari libur otomatis tidak mengurangi kuota jatah cuti tahunan staf.`
    },
    {
        title: ' Penyebab Utama Selisih Data Absensi Bulanan dan Cara Mengatasinya',
        slug: 'penyebab-utama-selisih-data-absensi-bulanan-dan-cara-mengatasinya',
        category: 'Insight',
        author_name: 'Dian Kusumawati',
        meta_title: 'Penyebab Selisih Data Absensi & Solusi Rekap Otomatis',
        meta_description: 'Mengapa rekap absensi manual sering selisih dan bagaimana sistem otomatisasi menghilangkan rekonsiliasi akhir bulan.',
        keywords: ['selisih absensi', 'rekap absensi bulanan', 'laporan absensi excel', 'hr analytics'],
        content: `## Problem Klasik Akhir Bulan Tim HR

Setiap tanggal 25, tim HR sering kali menghabiskan waktu berturut-turut untuk mencocokkan surat izin manual dengan catatan absensi finger-print yang hilang atau tidak terdeteksi.

---

### 💡 Solusi Rekonsiliasi Otomatis Arvela:

Dengan arsitektur terintegrasi, setiap pengajuan izin atau eksepsi yang telah disetujui otomatis mengupdate status kehadiran harian staf (*Present*, *Sick Leave*, *Annual Leave*, atau *Overtime*) secara *real-time*. Tidak ada lagi rekonsiliasi manual di akhir bulan!`
    },

    // ─── CATEGORY 4: MANAJEMEN KINERJA & OKR ──────────────────────────────────
    {
        title: ' Perbedaan OKR dan KPI: Mana yang Lebih Cocok untuk Perusahaan Anda?',
        slug: 'perbedaan-okr-dan-kpi-mana-yang-lebih-cocok-untuk-perusahaan-anda',
        category: 'Research',
        author_name: 'Rian Hidayat, M.M.',
        meta_title: 'Perbedaan OKR vs KPI: Panduan Evaluasi Kinerja HR',
        meta_description: 'Ulasan lengkap perbedaan Objectives & Key Results (OKR) dan Key Performance Indicators (KPI) untuk mengukur performa staf.',
        keywords: ['okr vs kpi', 'manajemen kinerja', 'evaluasi karyawan', 'okr indonesia'],
        content: `## Memilih Framework Manajemen Kinerja yang Tepat

Banyak manajer tertukar antara istilah **KPI (Key Performance Indicators)** dan **OKR (Objectives and Key Results)**. Keduanya memiliki tujuan yang berbeda dalam mendorong pertumbuhan organisasi.

---

### 📊 Perbandingan OKR vs KPI:

| Parameter | KPI (Key Performance Indicator) | OKR (Objectives & Key Results) |
| :--- | :--- | :--- |
| **Fokus Utama** | Mengukur hasil operasional yang sedang berjalan (*Maintain*) | Mendorong target ambisius & inovasi (*Growth/Stretch*) |
| **Batas Waktu** | Berkelanjutan (Bulanan / Tahunan) | Berjangka pendek (Triwulanan / Quarterly) |
| **Tingkat Target** | 100% Harus Tercapai | Target 60–70% sudah tergolong sukses |
| **Keterkaitan Gaji** | Langsung terhubung dengan bonus/bonus bulanan | Berfokus pada pengembangan skill & arah strategis |

---

> **Rekomendasi Arvela:** Perusahaan teknologi dan startup berkembang pesat sangat cocok memanfaatkan alur OKR interaktif di Modul Performa Arvela.`
    },
    {
        title: ' 5 Langkah Menyusun Target OKR Triwulanan yang Efektif untuk Tim HR',
        slug: '5-langkah-menyusun-target-okr-triwulanan-yang-efektif',
        category: 'Tutorial',
        author_name: 'Siti Rahmawati, S.Psi.',
        meta_title: '5 Langkah Menyusun Target OKR Triwulanan Tim HR',
        meta_description: 'Cara membuat Objective dan Key Result yang terukur dan realistis untuk meningkatkan kinerja tim HR dan operasional.',
        keywords: ['cara menyusun okr', 'target okr hr', 'performa staf', 'kpi hr'],
        content: `## Menyusun Target Ambisius yang Dapat Diukur

OKR yang efektif terdiri dari 1 **Objective** (Tujuan Kualitatif) dan 3–5 **Key Results** (Hasil Kuantitatif yang Dapat Diukur).

---

### 📝 Contoh OKR Tim Rekrutmen:

- **Objective**: "Merekrut Talenta Software Engineer Berkualitas Tinggi Secara Cepat di Q3."
  - **Key Result 1**: Mempersingkat *Time-to-Hire* dari 30 hari menjadi 14 hari.
  - **Key Result 2**: Meningkatkan skor kepuasan wawancara kandidat menjadi minimal 4.8 / 5.0.
  - **Key Result 3**: Mencapai rasio pemenuhan lowongan sebesar 100% sebelum akhir kuartal.`
    },
    {
        title: ' Cara Memberikan Performance Feedback yang Membangun Tanpa Merusak Motivasi Staf',
        slug: 'cara-memberikan-performance-feedback-yang-membangun',
        category: 'Insight',
        author_name: 'Dian Kusumawati',
        meta_title: 'Tips Memberikan Performance Feedback Karyawan',
        meta_description: 'Teknik evaluasi kinerja 1-on-1 yang konstruktif untuk meningkatkan engagement dan memperbaiki performa staf.',
        keywords: ['feedback karyawan', 'performance review', 'evaluasi 1 on 1', 'retensi talenta'],
        content: `## Seni Memberikan Masukan Konstruktif

Sesi evaluasi kinerja (*Performance Review*) sering kali ditakuti oleh karyawan jika penyampaian feedback terkesan menyalahkan individu.

---

### 🥪 Gunakan Metode Sandwich Feedback:

1. **Pujian Tulus (Praise)**: Mulai dengan mengapresiasi pencapaian dan kontribusi positif terbaru staf.
2. **Area Perbaikan (Constructive Criticism)**: Sampaikan fakta data kinerja yang belum mencapai target beserta dampaknya secara objektif.
3. **Dukungan & Solusi (Support & Plan)**: Akhiri dengan menawarkan bantuan pelatihan (LMS) dan langkah perbaikan nyata.`
    },
    {
        title: ' Panduan Mengonfigurasi Bobot Penilaian Kinerja Karyawan di Arvela HRMS',
        slug: 'panduan-mengonfigurasi-bobot-penilaian-kinerja-karyawan',
        category: 'Tutorial',
        author_name: 'Tim Redaksi Arvela',
        meta_title: 'Panduan Setting Bobot Penilaian Kinerja Karyawan',
        meta_description: 'Langkah taktis mengatur pembobotan persentase nilai OKR, absensi, dan penilaian kompetensi pada dashboard HR.',
        keywords: ['setting kpi hris', 'bobot penilaian kinerja', 'evaluasi staf', 'modul performa'],
        content: `## Menyesuaikan Bobot Evaluasi Berdasarkan Level Posisi

Setiap jabatan memiliki indikator keberhasilan yang berbeda. Posisi eksekutif lebih menitikberatkan pencapaian OKR strategis, sedangkan posisi operasional menitikberatkan pada kedisiplinan absensi dan SOP.

---

### ⚖️ Contoh Distribusi Pembobotan Nilai:

- **Level Manager / Supervisor**: OKR (70%) + Behavioral Competency (20%) + Kedisiplinan Absensi (10%).
- **Level Pelaksana / Staf**: Kedisiplinan Absensi & SOP (50%) + Target Tugas (40%) + Inisiatif (10%).`
    },
    {
        title: ' Dampak Transparansi Target Kinerja Terhadap Budaya Kerja Perusahaan',
        slug: 'dampak-transparansi-target-kinerja-terhadap-budaya-kerja',
        category: 'Insight',
        author_name: 'Rian Hidayat, M.M.',
        meta_title: 'Dampak Transparansi Target Kinerja Budaya Perusahaan',
        meta_description: 'Bagaimana transparansi OKR dan pencapaian target meningkatkan kolaborasi antar departemen.',
        keywords: ['transparansi okr', 'budaya kerja', 'engagement karyawan', 'hr strategy'],
        content: `## Menghilangkan Silo Antar Departemen

Ketika setiap divisi bekerja sendiri tanpa mengetahui sasaran utama perusahaan, akan terjadi tumpang tindih prioritas (*silo mentality*).

---

### 🎯 Manfaat OKR Yang Transparan:

- **Alignment Yang Jelas**: Staf memahami bagaimana tugas harian mereka berkontribusi langsung pada target besar perusahaan.
- **Kolaborasi Lintas Divisi**: Tim Marketing dan Sales dapat saling mendukung target akuisisi klien secara sinergis.
- **Akuntabilitas Publik**: Setiap anggota tim bangga memperlihatkan kemajuan pengerjaan OKR mereka di platform Arvela.`
    },

    // ─── CATEGORY 5: KEPATUHAN HUKUM & OFFBOARDING ────────────────────────────
    {
        title: ' Prosedur Offboarding dan Resign Karyawan Sesuai UU Cipta Kerja Terupdate',
        slug: 'prosedur-offboarding-dan-resign-karyawan-sesuai-uu-cipta-kerja',
        category: 'Compliance',
        author_name: 'Budi Santoso, S.H.',
        meta_title: 'Prosedur Offboarding & Resign Sesuai UU Cipta Kerja',
        meta_description: 'Panduan hukum mengurus pengunduran diri karyawan, hak uang pisah, serah terima aset, dan surat keterangan kerja (packlaring).',
        keywords: ['offboarding karyawan', 'resign uu cipta kerja', 'uang pisah resign', 'paklaring kerja'],
        content: `## Menangani Pengunduran Diri Karyawan Secara Profesional & Sesuai Hukum

Pengunduran diri (*resignation*) karyawan wajib dikelola secara tertib administrasi untuk mencegah sengketa hubungan industrial di kemudian hari.

---

### 📜 4 Syarat Utama Resign Sesuai Hukum Ketenagakerjaan:

1. **Pengajuan Minimal 30 Hari Sebelum Tanggal Resign (One Month Notice)**.
2. **Bebas Dari Ikatan Dinas / Pelatihan**.
3. **Melakukan Serah Terima Aset & Pekerjaan (Handover Progress)**.
4. **Persetujuan Manajemen via Alur Offboarding Official**.

---

> **Modul Offboarding Arvela**: Memfasilitasi checklist penyerahan laptop/aset kantor, penandatanganan surat bebas tanggungan, hingga penerbitan Surat Keterangan Kerja (Paklaring) otomatis.`
    },
    {
        title: ' Cara Menghitung Uang Kompensasi PKWT dan Pesangon Karyawan Kontrak',
        slug: 'cara-menghitung-uang-kompensasi-pkwt-dan-pesangon',
        category: 'Compliance',
        author_name: 'Budi Santoso, S.H.',
        meta_title: 'Cara Menghitung Uang Kompensasi PKWT & Pesangon',
        meta_description: 'Rumus resmi perhitungan uang kompensasi karyawan kontrak PKWT sesuai PP No 35 Tahun 2021.',
        keywords: ['uang kompensasi pkwt', 'hitung pesangon', 'pp 35 tahun 2021', 'hukum ketenagakerjaan'],
        content: `## Hak Karyawan Kontrak (PKWT) Saat Masa Kontrak Berakhir

Berdasarkan PP No. 35 Tahun 2021, perusahaan **wajib memberikan Uang Kompensasi** kepada karyawan PKWT yang telah memiliki masa kerja minimal 1 bulan secara terus-menerus.

---

### 🧮 Rumus Resmi Perhitungan Kompensasi PKWT:

$$\\text{Uang Kompensasi} = \\frac{\\text{Masa Kerja (Bulan)}}{12} \\times 1 \\text{ Bulan Upah (Gaji Pokok + Tunjangan Tetap)}$$

#### Contoh Perhitungan:
Seorang staf bekerja selama 6 bulan dengan gaji Rp 6.000.000 / bulan:
$$\\text{Kompensasi} = \\frac{6}{12} \\times \\text{Rp } 6.000.000 = \\text{Rp } 3.000.000$$`
    },
    {
        title: ' Checklist Serah Terima Aset Kantor (Asset Handover) Saat Karyawan Resign',
        slug: 'checklist-serah-terima-aset-kantor-saat-karyawan-resign',
        category: 'Tutorial',
        author_name: 'Tim Redaksi Arvela',
        meta_title: 'Checklist Serah Terima Aset Kantor Karyawan Resign',
        meta_description: 'Daftar pengembalian inventaris perusahaan (laptop, kartu akses, akun email) untuk mencegah kerugian perusahaan.',
        keywords: ['serah terima aset', 'handover laptop', 'offboarding checklist', 'manajemen inventaris'],
        content: `## Amankan Aset Digital dan Fisik Perusahaan

Kerugian terbesar perusahaan saat karyawan keluar sering kali berupa akun email atau laptop kantor yang belum di-reset dengan benar.

---

### 📦 Checklist Wajib Pengembalian Aset:

- 💻 **Perangkat Keras**: Laptop kantor, monitor eksternal, mouse, dan charger.
- 🔑 **Fisik & Keamanan**: Kartu akses gedung (ID Card), kunci loker, dan kendaraan dinas.
- 🔐 **Aset Digital**: Penonaktifan akun email perusahaan, akses Google Drive, dan pencabutan hak akses sistem HRIS.
- 📁 **File Pekerjaan**: Pemindahan kepemilikan dokumen penting ke akun *Direct Manager*.`
    },
    {
        title: ' Pentingnya Exit Interview untuk Mengungkap Alasan Sebenarnya Karyawan Resign',
        slug: 'pentingnya-exit-interview-untuk-mengungkap-alasan-sebenarnya-karyawan-resign',
        category: 'Insight',
        author_name: 'Siti Rahmawati, S.Psi.',
        meta_title: 'Pentingnya Exit Interview Mengungkap Alasan Resign',
        meta_description: 'Cara melakukan wawancara keluar (exit interview) yang jujur untuk memperbaiki manajemen dan kultur kerja.',
        keywords: ['exit interview', 'alasan resign', 'retensi karyawan', 'hr insight'],
        content: `## Mengapa Karyawan Resign Jarang Mengungkapkan Alasan Asli di Surat Resmi?

Alasan "ingin mencari tantangan baru" di surat pengunduran diri sering kali hanya pemanis. Melalui **Exit Interview** yang terstruktur, HR dapat menggali akar permasalahan sebenarnya (misalnya masalah kepemimpinan atasan, beban kerja berlebih, atau ketidaksesuaian gaji).

---

### ❓ 4 Pertanyaan Kunci Exit Interview:

1. *"Apa faktor utama yang membuat Anda mempertimbangkan tawaran di tempat lain?"*
2. *"Bagaimana kualitas dukungan dan kompensasi yang Anda terima dari atasan langsung?"*
3. *"Apa saran terbaik Anda untuk perbaikan tim ini di masa depan?"*
4. *"Apakah Anda akan merekomendasikan perusahaan ini kepada rekan Anda? Mengapa?"*`
    },
    {
        title: ' Mengelola Surat Keterangan Kerja (Paklaring) Otomatis dan Terverifikasi Digital',
        slug: 'mengelola-surat-keterangan-kerja-paklaring-otomatis',
        category: 'Tutorial',
        author_name: 'Tim Redaksi Arvela',
        meta_title: 'Mengelola Surat Keterangan Kerja Paklaring Otomatis',
        meta_description: 'Cara menerbitkan surat paklaring digital resmi dengan nomor surat otomatis di sistem Arvela HRMS.',
        keywords: ['surat paklaring', 'surat keterangan kerja', 'offboarding hris', 'template paklaring'],
        content: `## Penerbitan Surat Paklaring Tanpa Cetak Ulang

Surat Keterangan Kerja (Paklaring) dibutuhkan oleh mantan karyawan untuk klaim BPJS Ketenagakerjaan maupun melamar pekerjaan baru.

---

### 📄 Fitur Otomatisasi Paklaring Arvela:

- **Penomoran Surat Otomatis**: Sesuai format penomoran arsip perusahaan.
- **Auto-Fill Data Staf**: Nama lengkap, NIP, Jabatan Terakhir, dan Masa Kerja otomatis terisi presisi dari database.
- **Tanda Tangan Digital HR Admin / Owner**: Dokumen siap diunduh dalam format PDF resmi.`
    },

    // ─── CATEGORY 6: LMS & TRAINING ──────────────────────────────────────────
    {
        title: ' Membangun Portal Learning Management System (LMS) Internal Perusahaan',
        slug: 'membangun-portal-lms-internal-perusahaan',
        category: 'HR Tech',
        author_name: 'Dian Kusumawati',
        meta_title: 'Membangun Portal LMS Internal Perusahaan dengan Arvela',
        meta_description: 'Tingkatkan keterampilan dan kompetensi karyawan dengan sistem pembelajaran LMS internal terintegrasi.',
        keywords: ['lms perusahaan', 'learning management system', 'pelatihan karyawan', 'lms hris'],
        content: `## Mengapa Pelatihan Karyawan Berkelanjutan Sangat Vital?

Perusahaan yang berinvestasi dalam pengembangan skill staf mengalami **24% margin keuntungan lebih tinggi** dibandingkan perusahaan yang tidak memiliki program pelatihan terstruktur.

---

### 🎓 Keunggulan LMS Terintegrasi di Arvela:

- **Katalog Kursus Kustom**: Unggah materi pembelajaran berbasis modul, PDF, atau video tutorial internal.
- **Kuis & Sertifikat Otomatis**: Karyawan yang lulus evaluasi ujian akhir kursus otomatis menerima **Sertifikat Kelulusan Digital**.
- **Pelacakan Progress Real-Time**: Manajer dapat memantau persentase penyelesaian kursus setiap anggota tim.`
    },
    {
        title: ' Strategi Upskilling dan Reskilling Karyawan di Era Otomatisasi AI',
        slug: 'strategi-upskilling-dan-reskilling-karyawan-di-era-ai',
        category: 'Insight',
        author_name: 'Rian Hidayat, M.M.',
        meta_title: 'Strategi Upskilling & Reskilling Karyawan di Era AI',
        meta_description: 'Cara merancang program pelatihan pengembangan skill staf agar tetap relevan dengan perkembangan teknologi digital.',
        keywords: ['upskilling karyawan', 'reskilling staf', 'pelatihan ai', 'hr development'],
        content: `## Menyiapkan Tenaga Kerja Yang Adaptive

Perkembangan teknologi membutuhkan adaptasi keterampilan baru (*upskilling*) dan pengalihan peran staf ke bidang yang lebih berorientasi pada pemikiran kritis (*reskilling*).

---

### 🚀 3 Langkah Implementasi Upskilling:

1. **Skill Gap Analysis**: Identifikasi ketimpangan kemampuan staf melalui tes evaluasi di modul Asesmen.
2. **Personalized Learning Path**: Tugaskan modul kursus LMS yang sesuai dengan kekurangan skill individu.
3. **Praktek & Evaluasi OKR**: Terapkan skill baru dalam proyek nyata yang terukur di target triwulanan.`
    },
    {
        title: ' Cara Membuat Sertifikat Digital Pelatihan Karyawan Otomatis di Arvela LMS',
        slug: 'cara-membuat-sertifikat-digital-pelatihan-karyawan-otomatis',
        category: 'Tutorial',
        author_name: 'Tim Redaksi Arvela',
        meta_title: 'Cara Membuat Sertifikat Digital Pelatihan Otomatis',
        meta_description: 'Panduan menerbitkan sertifikat kelulusan modul pelatihan karyawan lengkap dengan kode verifikasi unik.',
        keywords: ['sertifikat digital', 'sertifikat lms', 'pelatihan staf', 'arvela lms'],
        content: `## Pengakuan Atas Pencapaian Pembelajaran Staf

Sertifikat pelatihan memberikan rasa bangga dan motivasi ekstrinsik bagi karyawan yang berhasil menyelesaikan modul pengembangan diri.

---

### 🏅 Fitur Sertifikat Otomatis Arvela LMS:

- **Syarat Kelulusan Kustom**: Ditentukan berdasarkan skor minimal ujian (misalnya *min 80/100*).
- **Desain Template Profesional**: Menggunakan header logo resmi perusahaan dan nama staf tercetak otomatis.
- **Verification URL Unique**: Setiap sertifikat dilengkapi dengan link verifikasi keabsahan dokumen.`
    },
    {
        title: ' 5 Indikator Kunci Mengukur Efektivitas Program Pelatihan Karyawan',
        slug: '5-indikator-kunci-mengukur-efektivitas-program-pelatihan',
        category: 'Research',
        author_name: 'Siti Rahmawati, S.Psi.',
        meta_title: '5 Indikator Mengukur Efektivitas Pelatihan Karyawan',
        meta_description: 'Gunakan evaluasi model Kirkpatrick untuk mengukur dampak pelatihan terhadap kinerja dan produktivitas staf.',
        keywords: ['efektivitas pelatihan', 'evaluasi kirkpatrick', 'roi pelatihan', 'hr metric'],
        content: `## Menilai Keberhasilan Program Training

Mengadakan pelatihan tanpa mengukur efektivitasnya sama saja dengan membuang anggaran tanpa mengetahui hasilnya.

---

### 📐 4 Tingkatan Evaluasi Model Kirkpatrick:

1. **Reaction (Reaksi)**: Kepuasan staf terhadap materi dan pembawaan trainer.
2. **Learning (Pembelajaran)**: Peningkatan skor tes sebelum (*pre-test*) dan sesudah (*post-test*) materi LMS.
3. **Behavior (Perilaku)**: Perubahan penerapan perilaku kerja harian di lapangan setelah 30 hari.
4. **Results (Hasil Bisnis)**: Penurunan tingkat kesalahan kerja (*error rate*) dan peningkatan output tim.`
    }
]

async function seedArticles() {
    console.log('🚀 Starting 30 SEO Articles Seeder for Arvela HRMS...')

    // Check existing author id (super_admin profile)
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'super_admin')
        .limit(1)
        .maybeSingle()

    const authorId = adminProfile?.id || null

    let insertedCount = 0
    let skippedCount = 0

    for (let i = 0; i < ARTICLES.length; i++) {
        const art = ARTICLES[i]
        
        // Stagger published_at dates over the past 45 days
        const daysAgo = Math.floor((ARTICLES.length - i) * 1.5)
        const pubDate = new Date()
        pubDate.setDate(pubDate.getDate() - daysAgo)

        const payload = {
            title: art.title,
            slug: art.slug,
            category: art.category,
            author_name: art.author_name,
            content: art.content,
            meta_title: art.meta_title,
            meta_description: art.meta_description,
            keywords: art.keywords,
            views: Math.floor(Math.random() * 1800) + 150,
            likes: Math.floor(Math.random() * 120) + 10,
            dislikes: Math.floor(Math.random() * 3),
            status: 'published',
            published_at: pubDate.toISOString(),
            author_id: authorId,
        }

        const { data, error } = await supabase
            .from('articles')
            .upsert(payload, { onConflict: 'slug' })
            .select('id, title, slug')

        if (error) {
            console.error(`❌ Failed to seed article [${art.slug}]:`, error.message)
            skippedCount++
        } else {
            console.log(`✅ [${i + 1}/30] Seeded: ${art.title} (Slug: ${art.slug})`)
            insertedCount++
        }
    }

    console.log(`\n🎉 SEEDING COMPLETED! Successfully seeded ${insertedCount} articles (${skippedCount} skipped/failed).`)
}

seedArticles().catch(err => {
    console.error('Fatal Seeder Error:', err)
    process.exit(1)
})
