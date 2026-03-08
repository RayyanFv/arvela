// ──────────────────────────────────────────────────
// MODULE  : Landing Page (Public)
// FILE    : app/page.jsx
// TABLES  : — (static, no DB)
// ACCESS  : PUBLIC — anonymous
// SKILL   : baca Arvela/SKILL.md sebelum edit file ini
// ──────────────────────────────────────────────────

import Link from 'next/link'
import {
    Briefcase, Users, ClipboardCheck, CalendarDays,
    GraduationCap, LineChart, ArrowRight, CheckCircle,
    X, AlertTriangle, ChevronRight, MonitorPlay, Award,
    Mail, FileSignature, Layout, Fingerprint
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata = {
    title: 'Arvela — Rekrut Lebih Tepat, Kembangkan Lebih Cepat',
    description: 'Platform talent management terintegrasi untuk tim HR modern — dari career page, assessment, onboarding, hingga monitoring performa karyawan.',
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const MODULES = [
    {
        num: '01', title: 'Job Posting & Career Page',
        desc: 'Buat lowongan dalam hitungan menit. Publish ke career page publik dengan URL unik perusahaan — tanpa developer, tanpa biaya tambahan.',
        icon: Briefcase,
    },
    {
        num: '02', title: 'Seleksi & Pipeline Kanban',
        desc: 'Semua pelamar masuk ke satu pipeline. Pindahkan kandidat antar stage, tambah catatan internal, filter berdasarkan posisi — real-time.',
        icon: Users,
    },
    {
        num: '03', title: 'Assessment Kustom',
        desc: 'Buat asesmen multi-tipe: pilihan ganda, essay, ranking, skala rating. Kandidat kerjakan via link unik — tanpa akun, dengan timer otomatis.',
        icon: ClipboardCheck,
    },
    {
        num: '04', title: 'Interview & Scorecard',
        desc: 'Jadwalkan interview, assign interviewer, kirim notifikasi otomatis. Scorecard terstruktur menghasilkan skor komparatif antar kandidat.',
        icon: CalendarDays,
    },
    {
        num: '05', title: 'Onboarding & LMS',
        desc: 'Assign learning path ke karyawan baru langsung dari pipeline rekrutmen. Video, quiz, dan sertifikat PDF otomatis saat menyelesaikan course.',
        icon: GraduationCap,
    },
    {
        num: '06', title: 'OKR & Monitoring Performa',
        desc: 'Set OKR per karyawan per periode. Karyawan update progress mingguan. Setiap keputusan evaluasi didasarkan data — bukan intuisi.',
        icon: LineChart,
    },
]

const STATS = [
    { value: '43', suffix: ' hari', desc: 'Rata-rata proses rekrutmen di Indonesia dari buka lowongan hingga onboard.', source: 'Talentics, 2023' },
    { value: '82%', suffix: '', desc: 'Peningkatan retensi karyawan baru pada perusahaan dengan onboarding terstruktur.', source: 'Brandon Hall Group' },
    { value: '70%', suffix: '', desc: 'Peningkatan produktivitas karyawan baru yang didukung program onboarding yang baik.', source: 'Brandon Hall Group' },
    { value: '6–9×', suffix: ' gaji', desc: 'Estimasi biaya yang hilang ketika satu karyawan resign dan harus direkrut ulang.', source: 'SHRM' },
]

const PAINS = [
    { title: 'Lamaran tidak terstruktur', desc: 'CV masuk via email, WA, dan Google Form. Rekap manual memakan waktu berjam-jam.' },
    { title: 'Proses manual dan lambat', desc: 'Update status kandidat manual, reminder lewat WA, koordinasi tim tidak sinkron.' },
    { title: 'Kandidat tidak tahu statusnya', desc: 'Kandidat apply lalu "menghilang" tanpa kabar. Employer branding rusak sebelum hiring selesai.' },
    { title: 'Assessment terpisah-pisah', desc: 'Psikotes di vendor lain, tes kompetensi di platform berbeda. Rekap dari banyak sumber.' },
    { title: 'Onboarding tidak terpantau', desc: 'Karyawan baru dapat dokumen, lalu dibiarkan. Tidak ada visibility perkembangan mereka.' },
    { title: 'Keputusan berbasis intuisi', desc: 'Evaluasi probation subjektif. Tidak ada data performa terstruktur untuk HR dan manajemen.' },
]

const TESTIMONIALS = [
    {
        quote: 'Proses rekrutmen kami dari 3 minggu jadi lebih dari 1 minggu. Pipeline yang terstruktur benar-benar membantu tim kami fokus pada kandidat terbaik.',
        name: 'R.A.', role: 'Head of HR, Startup Teknologi, Jakarta'
    },
    {
        quote: 'Yang paling saya suka adalah kandidat bisa track statusnya sendiri. Kami tidak lagi dibanjiri pertanyaan "gimana status lamaran saya?" via email.',
        name: 'D.P.', role: 'HR Manager, Perusahaan Manufaktur, Surabaya'
    },
    {
        quote: 'Scorecard interview membuat proses evaluasi jadi lebih objektif. Sekarang keputusan hiring kami bisa dipertanggungjawabkan dengan data.',
        name: 'M.S.', role: 'Talent Acquisition Lead, E-Commerce, Bandung'
    },
]

const PRICING = [
    {
        name: 'Starter', price: 'Rp 500.000', period: '/bulan', sub: 'Hingga 30 karyawan', popular: false,
        features: ['Job Posting & Career Page', 'Pipeline Rekrutmen Kanban', 'Assessment Builder (semua tipe soal)', 'Interview Scheduling', 'Onboarding Checklist', 'Notifikasi Otomatis ke Kandidat'],
    },
    {
        name: 'Growth', price: 'Rp 1.500.000', period: '/bulan', sub: 'Hingga 150 karyawan', popular: true,
        features: ['Semua fitur Starter', 'OKR & Performance Monitoring', 'Mini LMS + Video + Quiz + Sertifikat', 'Interview Scorecard Terstruktur', 'Offer Letter Generator', 'Candidate Experience Survey'],
    },
    {
        name: 'Scale', price: 'Hubungi Kami', period: '', sub: '150+ karyawan', popular: false,
        features: ['Semua fitur Growth', 'Employee Referral Program', 'Bulk Import via CSV', 'Smart Reminders Otomatis', 'Dedicated Onboarding Support', 'SLA & Priority Support'],
    },
]

const COMPARE_ROWS = [
    ['Job posting & career page', true, true, true],
    ['Pipeline rekrutmen kanban', true, null, true],
    ['Assessment kustom multi-tipe', false, false, true],
    ['Interview scheduling + scorecard', null, false, true],
    ['Offer letter digital', false, false, true],
    ['Onboarding checklist terintegrasi', false, null, true],
    ['LMS + quiz + sertifikat', false, false, true],
    ['OKR & performance monitoring', false, false, true],
    ['Data rekrut terhubung ke performa', false, false, true],
]

// ─── Components ───────────────────────────────────────────────────────────────
function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-primary-foreground font-black text-sm tracking-tight">A</span>
                    </div>
                    <span className="text-foreground font-black text-lg tracking-tight">Arvela<span className="text-primary">HR</span></span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
                    <a href="#modul" className="hover:text-foreground transition-colors">Fitur</a>
                    <a href="#harga" className="hover:text-foreground transition-colors">Harga</a>
                    <a href="#bandingkan" className="hover:text-foreground transition-colors">Perbandingan</a>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                        Masuk
                    </Link>
                    <a href="#pilot" className="bg-primary hover:bg-brand-600 text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
                        Coba Gratis
                    </a>
                </div>
            </div>
        </nav>
    )
}

function CellVal({ val }) {
    if (val === true) return <span className="text-emerald-600 font-bold text-sm">Ya</span>
    if (val === false) return <span className="text-muted-foreground/40 text-sm">—</span>
    return <span className="text-amber-600 text-xs font-semibold">Terbatas</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
    return (
        <div className="bg-background text-foreground">
            <Navbar />

            {/* ── HERO ─────────────────────────────────────────────────────── */}
            <section className="min-h-screen flex items-center relative overflow-hidden pt-16 bg-sidebar-bg">
                {/* subtle texture */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,1) 25%, rgba(255,255,255,1) 26%, transparent 27%), linear-gradient(90deg, transparent 24%, rgba(255,255,255,1) 25%, rgba(255,255,255,1) 26%, transparent 27%)', backgroundSize: '40px 40px' }} />
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />

                <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left */}
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                            <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">Pilot Terbatas · Daftar Sekarang</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight mb-6">
                            Rekrut Lebih Tepat.{' '}
                            <span className="text-primary">Kembangkan</span>{' '}
                            Lebih Cepat.
                        </h1>
                        <p className="text-sidebar-muted text-lg font-medium leading-relaxed mb-10 max-w-lg">
                            Satu platform untuk seluruh perjalanan talenta — dari lamaran pertama hingga evaluasi performa. Tidak ada lagi data tersebar di spreadsheet, WA, dan platform berbeda.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <a href="#pilot" className="bg-primary hover:bg-brand-600 text-primary-foreground font-bold text-base px-7 py-3.5 rounded-xl transition-colors flex items-center gap-2 justify-center">
                                Coba Gratis 15 Hari <ArrowRight className="w-4 h-4" />
                            </a>
                            <a href="#modul" className="border border-white/20 text-white hover:bg-white/5 font-semibold text-base px-7 py-3.5 rounded-xl transition-colors text-center">
                                Lihat Fitur
                            </a>
                        </div>
                        <p className="text-sidebar-muted text-xs font-medium mt-4">Setup 30 menit · Tanpa kartu kredit</p>
                    </div>

                    {/* Right — flow card */}
                    <div className="hidden lg:block">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Alur Talenta Arvela</p>
                            {[
                                { icon: Briefcase, label: 'Job Posting & Career Page', sub: 'Buka lowongan, kandidat apply langsung' },
                                { icon: Users, label: 'Pipeline & Seleksi', sub: 'Kelola kandidat di satu tempat' },
                                { icon: ClipboardCheck, label: 'Assessment Kustom', sub: 'Tes online tanpa akun kandidat' },
                                { icon: CalendarDays, label: 'Interview & Scorecard', sub: 'Evaluasi objektif berbasis data' },
                                { icon: GraduationCap, label: 'Onboarding & LMS', sub: 'Karyawan langsung belajar dari hari pertama' },
                                { icon: LineChart, label: 'OKR & Performa', sub: 'Monitor perkembangan setiap karyawan' },
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
                                            <step.icon className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        {i < 5 && <div className="w-px h-3 bg-white/10 mt-1" />}
                                    </div>
                                    <div className="pb-3">
                                        <p className="text-white text-sm font-bold">{step.label}</p>
                                        <p className="text-white/40 text-xs font-medium">{step.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </section>

            {/* ── PROBLEM ──────────────────────────────────────────────────── */}
            <section className="py-24 px-6 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    <div className="sticky top-24">
                        <p className="text-primary text-xs font-black uppercase tracking-widest mb-3">Masalah yang Dihadapi</p>
                        <h2 className="text-3xl md:text-4xl font-black text-foreground leading-tight mb-6">
                            Setiap hari, tim HR kehilangan waktu untuk hal-hal yang seharusnya bisa otomatis.
                        </h2>
                        <p className="text-muted-foreground font-medium">
                            Masalahnya bukan tim HR tidak kompeten. Masalahnya adalah <strong className="text-foreground">toolnya yang tidak terintegrasi</strong>. Data dari rekrutmen tidak pernah sampai ke onboarding. Onboarding tidak terhubung ke performa.
                        </p>
                    </div>
                    <div className="space-y-4">
                        {PAINS.map((pain, i) => (
                            <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors group">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full border-2 border-muted shrink-0 mt-0.5 group-hover:border-primary/30 transition-colors" />
                                    <div>
                                        <h3 className="font-bold text-foreground mb-1">{pain.title}</h3>
                                        <p className="text-muted-foreground text-sm font-medium">{pain.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS ────────────────────────────────────────────────────── */}
            <section className="py-24 bg-sidebar-bg">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-primary text-xs font-black uppercase tracking-widest mb-3">Data & Urgensi</p>
                        <h2 className="text-3xl md:text-4xl font-black text-white">Angka-angka yang perlu tim HR ketahui.</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {STATS.map((s, i) => (
                            <div key={i} className="border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-colors">
                                <p className="text-4xl font-black text-primary mb-1">{s.value}<span className="text-2xl">{s.suffix}</span></p>
                                <p className="text-sidebar-text text-sm font-medium leading-relaxed mb-3">{s.desc}</p>
                                <p className="text-sidebar-muted text-[10px] font-bold uppercase tracking-wider">Sumber: {s.source}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-sidebar-muted font-medium max-w-2xl mx-auto mt-12 text-sm">
                        Onboarding bukan formalitas. Assessment bukan ritual. Keduanya adalah investasi yang menentukan apakah karyawan baru bisa berkontribusi dalam 30 hari — atau justru resign dalam 90 hari pertama.
                    </p>
                </div>
            </section>

            {/* ── MODUL ────────────────────────────────────────────────────── */}
            <section id="modul" className="py-24 px-6 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <p className="text-primary text-xs font-black uppercase tracking-widest mb-3">Platform Overview</p>
                    <h2 className="text-3xl md:text-4xl font-black text-foreground leading-tight mb-4">
                        Satu Platform. Enam Modul. Dari Rekrut hingga Kembangkan.
                    </h2>
                    <p className="text-muted-foreground font-medium max-w-xl mx-auto">
                        Setiap data dari rekrutmen terhubung langsung ke onboarding dan performa — tanpa migrasi, tanpa rekap manual, tanpa platform berbeda.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {MODULES.map((mod) => (
                        <div key={mod.num} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-sm transition-all group">
                            <div className="flex items-center justify-between mb-5">
                                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                                    <mod.icon className="w-5 h-5 text-primary" />
                                </div>
                                <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-widest">{mod.num}</span>
                            </div>
                            <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{mod.title}</h3>
                            <p className="text-muted-foreground text-sm font-medium leading-relaxed">{mod.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── EMPLOYEE ACCESS GUIDE ────────────────────────────────────── */}
            <section className="py-24 bg-muted/20">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-primary text-xs font-black uppercase tracking-widest mb-3">Portal Karyawan</p>
                        <h2 className="text-3xl md:text-4xl font-black text-foreground leading-tight mb-4">
                            Karyawan Akses Lewat Mana?
                        </h2>
                        <p className="text-muted-foreground font-medium max-w-xl mx-auto text-sm">
                            Setelah HR menambahkan karyawan ke sistem, mereka langsung mendapat akses ke portal khusus karyawan —
                            tidak perlu setup manual, tidak perlu IT support.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {[
                            {
                                step: '01',
                                title: 'HR Tambah Karyawan',
                                desc: 'HR input email karyawan di menu Karyawan → sistem kirim undangan login otomatis ke email mereka.',
                                icon: Users,
                                color: 'bg-blue-50 text-blue-600'
                            },
                            {
                                step: '02',
                                title: 'Karyawan Login di arvela.id',
                                desc: 'Karyawan buka link di email, set password, langsung masuk ke dashboard pribadi mereka.',
                                icon: ArrowRight,
                                color: 'bg-emerald-50 text-emerald-600'
                            },
                            {
                                step: '03',
                                title: 'Akses Semua Menu Karyawan',
                                desc: 'Tersedia: Onboarding Checklist, OKR & Target Performa, Kursus LMS, dan Dokumen.',
                                icon: CheckCircle,
                                color: 'bg-primary/5 text-primary'
                            },
                        ].map((s) => (
                            <div key={s.step} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
                                        <s.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">{s.step}</span>
                                </div>
                                <h3 className="font-bold text-foreground mb-2">{s.title}</h3>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Menu yang tersedia untuk karyawan */}
                    <div className="bg-sidebar-bg rounded-2xl p-8">
                        <p className="text-[10px] font-black text-sidebar-muted uppercase tracking-widest mb-6">Menu yang Tersedia di Portal Karyawan</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { icon: ClipboardCheck, label: 'Onboarding Checklist', desc: 'Tugas-tugas hari pertama yang harus diselesaikan' },
                                { icon: LineChart, label: 'OKR & Sasaran Kinerja', desc: 'Target kuartal, Key Results, dan Inisiatif' },
                                { icon: GraduationCap, label: 'Kursus LMS', desc: 'Video, materi, dan sertifikat penyelesaian' },
                                { icon: CalendarDays, label: 'Jadwal Interview', desc: 'Notifikasi dan link interview yang dikirim HR' },
                            ].map((m, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                        <m.icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">{m.label}</p>
                                        <p className="text-sidebar-muted text-xs font-medium mt-0.5">{m.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
            <section className="py-24 bg-muted/30">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-primary text-xs font-black uppercase tracking-widest mb-3">Yang Mereka Rasakan</p>
                        <h2 className="text-3xl md:text-4xl font-black text-foreground">Apa kata praktisi HR yang sudah mencoba Arvela.</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {TESTIMONIALS.map((t, i) => (
                            <div key={i} className="bg-card border border-border rounded-2xl p-7 hover:border-primary/30 hover:shadow-sm transition-all">
                                <p className="text-foreground font-medium leading-relaxed mb-6 text-sm">"{t.quote}"</p>
                                <div className="flex items-center gap-3 pt-5 border-t border-border">
                                    <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-black text-sm shrink-0">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground text-sm">{t.name}</p>
                                        <p className="text-muted-foreground text-xs font-medium">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-muted-foreground text-xs font-medium mt-8">Feedback dari sesi diskusi awal dengan praktisi HR. Nama disamarkan.</p>
                </div>
            </section>

            {/* ── COMPARISON ───────────────────────────────────────────────── */}
            <section id="bandingkan" className="py-24 px-6 max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <p className="text-primary text-xs font-black uppercase tracking-widest mb-3">Perbandingan</p>
                    <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">Bukan sekadar ATS. Bukan HRIS biasa.</h2>
                    <p className="text-muted-foreground font-medium max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                        Software rekrutmen biasa berhenti saat kandidat diterima. HRIS biasa mulai saat karyawan sudah masuk. <span className="text-foreground font-bold">Arvela adalah jembatan</span> yang menyatukan data kandidat hingga performa kerja mereka.
                    </p>
                </div>
                <div className="border border-border rounded-3xl overflow-hidden shadow-2xl shadow-primary/5">
                    <div className="grid grid-cols-4 bg-sidebar-bg">
                        <div className="p-5" />
                        {['ATS Biasa', 'HRIS Biasa', 'Arvela'].map((col, i) => (
                            <div key={i} className={`p-5 text-center text-xs md:text-sm font-black uppercase tracking-widest ${i === 2 ? 'bg-primary/20 text-primary border-x border-primary/20' : 'text-sidebar-muted'}`}>
                                {col}
                            </div>
                        ))}
                    </div>
                    {COMPARE_ROWS.map(([label, ats, hris, arvela], i) => (
                        <div key={i} className={`grid grid-cols-4 border-t border-border group ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                            <div className="p-5 text-sm font-bold text-foreground group-hover:text-primary transition-colors">{label}</div>
                            <div className="p-5 flex justify-center items-center border-l border-border/50"><CellVal val={ats} /></div>
                            <div className="p-5 flex justify-center items-center border-l border-border/50"><CellVal val={hris} /></div>
                            <div className="p-5 flex justify-center items-center bg-primary/[0.02] border-x border-primary/10 shadow-inner"><CellVal val={arvela} /></div>
                        </div>
                    ))}
                </div>

                {/* ── ILLUSTRATIVE FEATURE PREVIEWS (The Arvela Difference) ── */}
                <div className="mt-32 space-y-40">
                    <div className="text-center">
                        <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4">The Arvela Bridge</p>
                        <h3 className="text-3xl md:text-5xl font-black text-foreground">Satu Flow. Tanpa Data Terputus.</h3>
                        <p className="text-muted-foreground font-medium max-w-2xl mx-auto mt-4">
                            Seluruh perjalanan talenta Anda berada dalam satu sistem yang tersinkronasi satu sama lain.
                        </p>
                    </div>

                    {/* Feature 1: Recruitment & Email Sync */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                <Mail className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h4 className="text-3xl font-black text-foreground leading-tight">Smart Pipeline dengan <span className="text-indigo-600 italic">Email Sync</span> Otomatis.</h4>
                            <p className="text-muted-foreground font-medium leading-relaxed text-base">
                                Jangan biarkan kandidat menunggu dalam ketidakpastian. Setiap kali Anda memindahkan kandidat ke stage baru, sistem otomatis memberikan info via email.
                            </p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { icon: Layout, text: 'Pipeline Kanban Interaktif' },
                                    { icon: Mail, text: 'Email Notifikasi Real-time' },
                                    { icon: Users, text: 'Portal Status Kandidat' },
                                    { icon: Fingerprint, text: 'Link Login Tanpa Password' },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                                            <item.icon className="w-3 h-3 text-indigo-600" />
                                        </div>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="bg-indigo-600/5 rounded-[40px] p-8 border border-indigo-100">
                                <div className="bg-white rounded-3xl shadow-xl border border-border p-6 space-y-4">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">SM</div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">Siti Maryam</p>
                                                <p className="text-[10px] text-slate-400 font-medium tracking-wide">Applied 2 days ago</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 font-black text-[9px] uppercase">Screening</Badge>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-dashed border-indigo-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Mail className="w-3.5 h-3.5 text-indigo-400" />
                                            <span className="text-[10px] font-black uppercase text-indigo-400">Email Terkirim</span>
                                        </div>
                                        <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                                            "Halo Siti, Lamaran Anda telah kami tinjau dan masuk ke tahap Screening..."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: Scorecards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
                        <div className="lg:order-last space-y-6">
                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
                                <ClipboardCheck className="w-6 h-6 text-amber-500" />
                            </div>
                            <h4 className="text-3xl font-black text-foreground leading-tight">Hiring Objektif dengan <span className="text-amber-500 italic">Scorecard Terukur</span>.</h4>
                            <p className="text-muted-foreground font-medium leading-relaxed text-base">
                                Hentikan debat kusir di ruang meeting. Gunakan scorecard terstruktur yang memberikan skor numerik berdasarkan kompetensi nyata.
                            </p>
                            <div className="space-y-3">
                                {[
                                    'Rating per kompetensi (Coding, Culture, dsb)',
                                    'Perhitungan skor komparatif antar kandidat',
                                    'Rangkuman rekomendasi tim interviewer'
                                ].map((l, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <CheckCircle className="w-5 h-5 text-amber-500 shrink-0" /> {l}
                                    </li>
                                ))}
                            </div>
                        </div>
                        <div className="bg-amber-600/[0.03] p-10 rounded-[40px] border border-amber-100">
                            <div className="bg-white rounded-3xl p-6 shadow-xl border border-border space-y-5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interview Scorecard</p>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Technical Skills', val: 4 },
                                        { label: 'Communication', val: 5 },
                                        { label: 'Culture Fit', val: 3 },
                                    ].map((row, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-600">{row.label}</span>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <div key={s} className={`w-3 h-3 rounded-full ${s <= row.val ? 'bg-amber-400' : 'bg-slate-100'}`} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 border-t flex justify-between items-center">
                                    <span className="text-xs font-black text-slate-900">Total Score</span>
                                    <span className="text-lg font-black text-amber-500">4.0 / 5.0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 3: Offer & Transition */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                <FileSignature className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h4 className="text-3xl font-black text-foreground leading-tight">Digital Offer ke <span className="text-emerald-600 italic">Instant Onboarding</span>.</h4>
                            <p className="text-muted-foreground font-medium leading-relaxed text-base">
                                Kirim surat penawaran dalam satu klik. Saat kandidat tanda tangan, sistem langsung menyiapkan segala kebutuhan mereka di hari pertama.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <p className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">Status Offer</p>
                                    <p className="text-lg font-black text-emerald-600">Terkirim</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <p className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">Response</p>
                                    <p className="text-lg font-black text-emerald-600">Pending</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-emerald-600/[0.03] p-6 rounded-[40px] border border-emerald-100">
                            <div className="bg-white rounded-3xl border border-border shadow-xl overflow-hidden">
                                <div className="h-32 bg-emerald-500 flex items-center justify-center">
                                    <FileSignature className="w-12 h-12 text-white/50" />
                                </div>
                                <div className="p-8 text-center space-y-4">
                                    <h5 className="font-black text-slate-900 text-lg">Digital Offer Letter</h5>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        "Kandidat telah menerima email penawaran gaji dan jadwal join date."
                                    </p>
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11">
                                        Konfirmasi Hire
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 4: LMS & Certificate */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
                        <div className="lg:order-last space-y-6">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-primary" />
                            </div>
                            <h4 className="text-3xl font-black text-foreground leading-tight">Integrated <span className="text-primary italic">Learning Path</span>.</h4>
                            <p className="text-muted-foreground font-medium leading-relaxed text-base">
                                Training bukan lagi tumpukan dokumen kertas. Biarkan karyawan belajar sendiri di portal mereka — dengan bukti kelulusan berupa sertifikat.
                            </p>
                            <div className="bg-slate-50 p-5 rounded-2xl border border-border">
                                <div className="flex items-center gap-4 mb-4">
                                    <Award className="w-8 h-8 text-primary" />
                                    <div>
                                        <p className="text-sm font-black text-slate-900">Sertifikat Otomatis</p>
                                        <p className="text-[11px] text-slate-400 font-medium leading-tight">Terhubung ke modul performance karyawan.</p>
                                    </div>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full w-full overflow-hidden">
                                    <div className="h-full bg-primary w-full animate-pulse" />
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="bg-primary/5 p-12 rounded-[40px] border border-primary/10">
                                <div className="bg-white rounded-3xl p-6 shadow-2xl border border-border space-y-5">
                                    <div className="flex items-center justify-between">
                                        <h5 className="font-black text-slate-900 text-sm">Course Selesai!</h5>
                                        <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[9px] uppercase">LULUS</Badge>
                                    </div>
                                    <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center border border-border shadow-inner">
                                        <MonitorPlay className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <Button variant="outline" className="w-full border-amber-200 text-amber-600 hover:bg-amber-50 h-10 rounded-xl font-bold text-xs gap-2">
                                        <Award className="w-4 h-4" /> Download Certificate
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 5: Continuous Performance */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <LineChart className="w-6 h-6 text-primary" />
                            </div>
                            <h4 className="text-3xl font-black text-foreground leading-tight">Performa Berbasis <span className="text-primary italic">Continuous Feedback</span>.</h4>
                            <p className="text-muted-foreground font-medium leading-relaxed text-base">
                                Pantau pergerakan OKR dan KPI setiap minggu. Setiap evaluasi diputuskan berdasarkan data nyata sepanjang periode, bukan sekadar memori sesaat.
                            </p>
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-3xl font-black text-foreground">8.2<span className="text-sm text-slate-400">/10</span></p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Average Score</p>
                                </div>
                                <div className="w-px h-10 bg-slate-200" />
                                <div>
                                    <p className="text-3xl font-black text-foreground">100%</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Goal Alignment</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-900 rounded-[50px] p-10 relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
                            <div className="space-y-6 relative z-10">
                                <p className="text-primary text-[10px] font-black uppercase tracking-widest">Employee Performance</p>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Q3 Product Excellence', val: 78 },
                                        { label: 'Infrastructure Upgrade', val: 45 },
                                    ].map((okr, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-xs font-black text-white/40 uppercase tracking-tight">
                                                <span>{okr.label}</span>
                                                <span className="text-primary">{okr.val}%</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary transition-all duration-1000 group-hover:bg-brand-400" style={{ width: `${okr.val}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
                                        <Users className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-medium text-white/60 leading-tight italic">
                                        "Performa karyawan ini konsisten meningkat setelah menyelesaikan materi LMS Bulan Lalu."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PRICING ──────────────────────────────────────────────────── */}
            <section id="harga" className="py-24 bg-muted/30">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-primary text-xs font-black uppercase tracking-widest mb-3">Harga</p>
                        <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">Investasi yang transparan.</h2>
                        <p className="text-muted-foreground font-medium">Semua paket termasuk pilot 15 hari gratis. Tidak perlu kartu kredit.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                        {PRICING.map((p) => (
                            <div key={p.name} className={`rounded-2xl p-7 border relative ${p.popular ? 'bg-sidebar-bg border-primary/30' : 'bg-card border-border'}`}>
                                {p.popular && (
                                    <div className="absolute -top-3 left-6">
                                        <span className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Paling Populer</span>
                                    </div>
                                )}
                                <h3 className={`text-lg font-black mb-0.5 ${p.popular ? 'text-white' : 'text-foreground'}`}>{p.name}</h3>
                                <p className="text-muted-foreground text-xs font-semibold mb-5">{p.sub}</p>
                                <div className="mb-6">
                                    <span className={`text-3xl font-black ${p.popular ? 'text-white' : 'text-foreground'}`}>{p.price}</span>
                                    {p.period && <span className="text-muted-foreground text-sm font-medium">{p.period}</span>}
                                </div>
                                <ul className="space-y-2.5 mb-7">
                                    {p.features.map((f, j) => (
                                        <li key={j} className={`flex items-start gap-2 text-sm font-medium ${p.popular ? 'text-sidebar-text' : 'text-foreground'}`}>
                                            <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <a href="#pilot" className={`block w-full py-3 rounded-xl font-bold text-sm text-center transition-colors ${p.popular ? 'bg-primary hover:bg-brand-600 text-primary-foreground' : 'bg-foreground hover:bg-foreground/90 text-background'}`}>
                                    {p.name === 'Scale' ? 'Hubungi Kami' : 'Mulai Pilot Gratis'}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PILOT CTA ────────────────────────────────────────────────── */}
            <section id="pilot" className="py-24 bg-sidebar-bg">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <p className="text-primary text-xs font-black uppercase tracking-widest mb-4">Pilot Terbatas</p>
                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6">
                        15 Hari Gratis.<br />Setup 30 Menit.
                    </h2>
                    <p className="text-sidebar-muted font-medium mb-10 max-w-xl mx-auto">
                        Arvela sedang dalam fase pilot terbatas. Kamu mendapat akses penuh — bukan versi demo, bukan fitur terbatas. Selama pilot, kamu punya akses langsung ke founder via WhatsApp dengan respons di bawah 2 jam.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto mb-10 text-left">
                        {[
                            'Akses penuh modul rekrutmen: job posting, pipeline, assessment, interview',
                            'Onboarding checklist untuk karyawan baru yang bergabung selama pilot',
                            'Demo live modul performance & LMS bersama founder',
                            'Direct WhatsApp ke founder — respons < 2 jam',
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-sidebar-text text-sm font-medium">
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                {item}
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a href="mailto:dian@aicareer.id" className="bg-primary hover:bg-brand-600 text-primary-foreground font-bold text-base px-8 py-3.5 rounded-xl transition-colors flex items-center gap-2 justify-center">
                            Mulai Pilot Gratis <ArrowRight className="w-4 h-4" />
                        </a>
                        <a href="https://wa.me/" className="border border-white/20 text-white hover:bg-white/10 font-semibold text-base px-8 py-3.5 rounded-xl transition-colors">
                            WhatsApp Langsung
                        </a>
                    </div>
                    <p className="text-sidebar-muted text-sm font-medium mt-6">dian@aicareer.id</p>
                </div>
            </section>

            {/* ── FOOTER ───────────────────────────────────────────────────── */}
            <footer className="bg-sidebar-bg border-t border-sidebar-border py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-primary-foreground font-black text-xs">A</span>
                            </div>
                            <span className="text-white font-black text-base">Arvela<span className="text-primary">HR</span></span>
                        </div>
                        <p className="text-sidebar-muted text-sm font-medium max-w-xs mb-4">Platform Talent Management untuk Tim HR Modern — by Aicareer</p>
                        <p className="text-sidebar-muted/60 text-xs italic max-w-xs leading-relaxed">
                            "Kami tidak jualan software. Kami minta izin untuk menyelesaikan masalah Anda bersama."
                        </p>
                        <p className="text-sidebar-muted/40 text-xs font-medium mt-1">— Dian Kusumawati, Founder</p>
                    </div>
                    <div className="flex gap-12">
                        <div>
                            <p className="text-white font-bold text-sm mb-4">Kontak</p>
                            <div className="space-y-2">
                                <a href="mailto:dian@aicareer.id" className="text-sidebar-muted hover:text-white text-sm font-medium block transition-colors">dian@aicareer.id</a>
                                <a href="#" className="text-sidebar-muted hover:text-white text-sm font-medium block transition-colors">arvela.id</a>
                            </div>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm mb-4">Legal</p>
                            <div className="space-y-2">
                                <a href="#" className="text-sidebar-muted hover:text-white text-sm font-medium block transition-colors">Kebijakan Privasi</a>
                                <a href="#" className="text-sidebar-muted hover:text-white text-sm font-medium block transition-colors">Syarat & Ketentuan</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-sidebar-border flex justify-between items-center">
                    <p className="text-sidebar-muted/40 text-xs font-medium">© 2026 Aicareer. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
