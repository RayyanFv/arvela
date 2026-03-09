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
    Mail, FileSignature, Layout, Fingerprint, MapPin, MessageCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { getMetadata } from '@/lib/seo'

export const metadata = getMetadata()

function JsonLd() {
    const data = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Arvela HR",
        "operatingSystem": "Web",
        "applicationCategory": "BusinessApplication, HRSoftware",
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "120"
        },
        "offers": {
            "@type": "Offer",
            "price": "500000",
            "priceCurrency": "IDR"
        }
    };
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
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
    { feature: 'Job Posting & Brand Career Page', arvela: true, legacy: true, sheet: 'Manual' },
    { feature: 'Pipeline Rekrutmen Kanban', arvela: true, legacy: 'Kaku', sheet: 'Berantakan' },
    { feature: 'Asesmen Kustom & Timer Otomatis', arvela: true, legacy: false, sheet: false },
    { feature: 'Interview Scorecard & Rating', arvela: true, legacy: false, sheet: false },
    { feature: 'Onboarding Checklist Terintegrasi', arvela: true, legacy: 'Terpisah', sheet: 'Manual' },
    { feature: 'LMS Internal (Video & Quiz)', arvela: true, legacy: false, sheet: false },
    { feature: 'Presensi GPS & Verifikasi Foto', arvela: true, legacy: 'Device Mahal', sheet: false },
    { feature: 'Monitoring OKR & KPI Karyawan', arvela: true, legacy: false, sheet: false },
    { feature: 'Satu Data dari Rekrut ke Performa', arvela: true, legacy: false, sheet: false },
]

// ─── Components ───────────────────────────────────────────────────────────────
function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-9 md:h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                        <span className="text-white font-black text-sm md:text-base tracking-tighter italic">A</span>
                    </div>
                    <span className="text-slate-900 font-black text-lg md:text-xl tracking-tighter">Arvela<span className="text-primary">HR</span></span>
                </div>
                <div className="hidden md:flex items-center gap-10 text-[13px] font-bold text-slate-500">
                    <a href="#modul" className="hover:text-primary transition-colors">Solusi</a>
                    <a href="#bandingkan" className="hover:text-primary transition-colors">Perbandingan</a>
                    <a href="#harga" className="hover:text-primary transition-colors">Harga</a>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                    <Link href="/login" className="text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
                        Login
                    </Link>
                    <a href="#pilot" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                        Mulai Pilot
                    </a>
                </div>
            </div>
        </nav>
    )
}

function ComparisonTable() {
    return (
        <section id="bandingkan" className="py-24 md:py-32 bg-white border-y border-slate-100 overflow-hidden">
            <div className="max-w-5xl mx-auto px-6">
                <div className="text-center mb-16 md:mb-20">
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">Head-to-Head</span>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tighter mb-6">
                        Mengapa <span className="text-primary italic">Arvela</span> Berbeda?
                    </h2>
                    <p className="text-slate-500 font-medium max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                        Kami tidak hanya mendigitalkan form kertas. Kami menghubungkan setiap titik data dari rekrutmen hingga performa harian Anda.
                    </p>
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="relative overflow-x-auto rounded-[32px] md:rounded-[40px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/50">
                        <div className="min-w-[700px]">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] bg-slate-900 py-6 md:py-8 px-6 md:px-10 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-400">
                                <span>Layanan & Fitur Utama</span>
                                <span className="text-white text-center italic">Arvela System</span>
                                <span className="text-center">Legacy HRIS</span>
                                <span className="text-center">Manual Sheet</span>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {COMPARE_ROWS.map((row, i) => (
                                    <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr] py-4 md:py-6 px-6 md:px-10 items-center hover:bg-slate-50/50 transition-colors">
                                        <span className="text-xs md:text-sm font-bold text-slate-700">{row.feature}</span>
                                        <div className="flex justify-center bg-primary/[0.02] border-x border-primary/10 shadow-inner py-4 md:py-6"><CellVal val={row.arvela} /></div>
                                        <div className="flex justify-center opacity-70"><CellVal val={row.legacy} /></div>
                                        <div className="flex justify-center opacity-70"><CellVal val={row.sheet} /></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-8 md:mt-12 text-center text-slate-400 text-[10px] md:text-sm italic font-medium px-4">
                    * Berdasarkan perbandingan internal dengan sistem HR konvensional dan alur kerja manual umum (2024).
                </p>
            </div>
        </section>
    )
}

function CellVal({ val }) {
    if (val === true) return <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 mx-auto" />
    if (val === false || val === null) return <span className="text-slate-300 text-[10px] md:text-xs font-medium">—</span>
    return <span className="text-slate-600 text-[9px] md:text-[11px] font-bold text-center block leading-tight px-2">{val}</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
    return (
        <div className="bg-white text-slate-900 selection:bg-primary selection:text-white">
            <JsonLd />
            <Navbar />

            {/* ── HERO ─────────────────────────────────────────────────────── */}
            <section className="min-h-screen flex items-center relative overflow-hidden pt-20 bg-white">
                <div className="absolute right-0 top-0 w-[500px] md:w-[800px] h-[500px] md:h-[800px] bg-primary/5 blur-[80px] md:blur-[120px] rounded-full -mr-20 md:-mr-40 -mt-20 md:-mt-40" />
                <div className="absolute left-0 bottom-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-emerald-500/5 blur-[80px] md:blur-[120px] rounded-full -ml-10 md:-ml-20 -mb-10 md:-mb-20" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
                    {/* Left */}
                    <div className="text-center lg:text-left">
                        <div className="inline-flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-2xl px-4 md:px-5 py-2 mb-8 md:10 shadow-sm border-l-4 border-l-primary">
                            <span className="w-2 h-2 bg-primary animate-pulse rounded-full" />
                            <span className="text-slate-600 text-[10px] md:text-[11px] font-black uppercase tracking-widest leading-none">Terbuka Untuk Pilot Program</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] md:leading-[0.95] tracking-tighter mb-6 md:mb-8">
                            HRIS Terintegrasi.<br className="hidden md:block" />
                            <span className="text-primary italic">Rekrutmen Cerdas</span> & Onboarding.<br className="hidden md:block" />
                            Kelola Karyawan.
                        </h1>
                        <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed mb-8 md:mb-12 max-w-lg mx-auto lg:mx-0">
                            Ekosistem Talent Management untuk tim yang mengejar pertumbuhan progresif. Kelola seluruh siklus hidup karyawan dalam satu pusat kendali yang elegan.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <a href="#pilot" className="bg-slate-900 hover:bg-slate-800 text-white font-black text-base md:text-lg px-8 md:px-10 py-4 md:py-5 rounded-[20px] md:rounded-[24px] shadow-2xl shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3 justify-center">
                                Mulai Sekarang <ArrowRight className="w-5 h-5" />
                            </a>
                            <a href="#modul" className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-base md:text-lg px-8 md:px-10 py-4 md:py-5 rounded-[20px] md:rounded-[24px] transition-all text-center">
                                Lihat Solusi
                            </a>
                        </div>
                    </div>

                    {/* Right — Interactive Preview */}
                    <div className="relative group px-4 md:px-0">
                        <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
                        <div className="relative bg-slate-50 p-6 md:p-8 rounded-[40px] md:rounded-[48px] border border-slate-100 shadow-inner">
                            <div className="bg-white rounded-[28px] md:rounded-[32px] p-6 md:p-8 shadow-2xl border border-white space-y-5 md:space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-5 md:pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                            <MapPin className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900">Attendance Center</p>
                                            <p className="text-[10px] text-emerald-600 font-bold">Verified via Geofence + Selfie</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] md:text-[10px]">LIVE UPDATES</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div className="h-20 md:h-24 bg-slate-50 rounded-[20px] md:rounded-2xl border border-slate-100 p-3 md:p-4">
                                        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Clock In</p>
                                        <p className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter italic">08:02:15</p>
                                    </div>
                                    <div className="h-20 md:h-24 bg-slate-50 rounded-[20px] md:rounded-2xl border border-slate-100 p-3 md:p-4">
                                        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                        <p className="text-xs md:text-sm font-black text-emerald-600">Terdaftar Aktif</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PROBLEM ──────────────────────────────────────────────────── */}
            <section className="py-20 md:py-24 px-6 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-start">
                    <div className="lg:sticky lg:top-24 text-center lg:text-left">
                        <p className="text-primary text-xs font-black uppercase tracking-widest mb-3">Masalah yang Dihadapi</p>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-6">
                            Setiap hari, tim HR kehilangan waktu untuk hal-hal yang seharusnya bisa otomatis.
                        </h2>
                        <p className="text-slate-500 font-medium text-base md:text-lg">
                            Masalahnya bukan tim HR tidak kompeten. Masalahnya adalah <strong className="text-slate-900">toolnya yang tidak terintegrasi</strong>. Data dari rekrutmen tidak pernah sampai ke onboarding. Onboarding tidak terhubung ke performa.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                        {PAINS.map((pain, i) => (
                            <div key={i} className="bg-white border border-slate-100 rounded-[24px] p-5 md:p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                <div className="flex items-start gap-4">
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0 mt-1 group-hover:border-primary group-hover:bg-primary transition-all duration-300" />
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-1 leading-snug">{pain.title}</h3>
                                        <p className="text-slate-500 text-sm font-medium leading-relaxed">{pain.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS ────────────────────────────────────────────────────── */}
            <section className="py-20 md:py-24 bg-slate-900">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-primary text-xs font-black uppercase tracking-widest mb-3">Data & Urgensi</p>
                        <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter text-center">Software HRIS & ATS yang paling dicari tim HR Indonesia.</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {STATS.map((s, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/[0.08] hover:border-primary/40 transition-all group">
                                <p className="text-4xl font-black text-primary mb-2 group-hover:scale-110 transition-transform origin-left">{s.value}<span className="text-2xl">{s.suffix}</span></p>
                                <p className="text-slate-300 text-sm font-medium leading-relaxed mb-4">{s.desc}</p>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Sumber: {s.source}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MODUL ────────────────────────────────────────────────────── */}
            <section id="modul" className="py-24 md:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 md:mb-24">
                        <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Satu Flow. Tanpa Data Terputus.</span>
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-8 italic">The Arvela Bridge.</h2>
                        <p className="text-slate-500 font-medium max-w-2xl mx-auto text-base md:text-lg">
                            Seluruh perjalanan talenta Anda berada dalam satu sistem yang tersinkronasi satu sama lain.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {/* Card 1: Recruitment */}
                        <div className="bg-slate-50/50 rounded-[40px] p-8 border border-slate-100 flex flex-col group hover:bg-white hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full" />
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter">Smart Pipeline & Email Sync</h4>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 flex-grow italic">
                                "Otomatisasi info status kandidat via email setiap perpindahan stage. Data mengalir otomatis tanpa input ulang."
                            </p>
                            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-50 space-y-3 relative overflow-hidden">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3 text-indigo-400 animate-bounce" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Auto-Update...</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full w-full overflow-hidden">
                                    <div className="h-full bg-indigo-400 animate-[shimmer_2s_infinite]" style={{ width: '40%', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', backgroundSize: '1000px 100%' }} />
                                </div>
                                <div className="h-1.5 bg-slate-50 rounded-full w-4/6" />
                            </div>
                        </div>

                        {/* Card 2: Scorecards */}
                        <div className="bg-slate-50/50 rounded-[40px] p-8 border border-slate-100 flex flex-col group hover:bg-white hover:shadow-2xl hover:shadow-amber-100/50 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-8 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all transform group-hover:-rotate-6">
                                <ClipboardCheck className="w-6 h-6" />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter">Hiring Scorecard Objektif</h4>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 flex-grow italic">
                                "Evaluasi kandidat berbasis data kompetensi nyata, bukan sekadar intuisi tim interviewer."
                            </p>
                            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Hiring Score</span>
                                <span className="text-sm font-black text-amber-500 italic">4.8 / 5.0</span>
                            </div>
                        </div>

                        {/* Card 3: Transition */}
                        <div className="bg-slate-50/50 rounded-[40px] p-8 border border-slate-100 flex flex-col group hover:bg-white hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all transform group-hover:scale-110">
                                <FileSignature className="w-6 h-6" />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter">Instant Onboarding Setup</h4>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 flex-grow italic">
                                "Surat penawaran digital otomatis mengaktifkan fitur orientasi untuk karyawan baru secara adaptif."
                            </p>
                            <div className="flex items-center gap-3">
                                <Badge className="bg-emerald-50 text-emerald-600 border-none px-5 py-2 rounded-xl font-black text-[10px] w-fit italic tracking-tighter shadow-sm border border-emerald-100 animate-pulse">FLOW: HIRED → ONBOARD</Badge>
                            </div>
                        </div>

                        {/* Card 4: Attendance */}
                        <div className="bg-slate-50/50 rounded-[40px] p-8 border border-slate-100 flex flex-col group hover:bg-white hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full" />
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <MapPin className="w-6 h-6 animate-pulse" />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter">Presensi Lokasi & Selfie</h4>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 flex-grow italic">
                                "Pantau kehadiran presisi dengan verifikasi GPS Geofencing dan foto selfie langsung dari mobile portal."
                            </p>
                            <div className="flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase tracking-tight italic">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
                                LIVE GPS TRACKING ACTIVE
                            </div>
                        </div>

                        {/* Card 5: Learning */}
                        <div className="bg-slate-50/50 rounded-[40px] p-8 border border-slate-100 flex flex-col group hover:bg-white hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full" />
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter">Integrated Learning Path</h4>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 flex-grow italic">
                                "Portal belajar mandiri dengan Quiz dan Sertifikat otomatis yang terhubung ke modul performa."
                            </p>
                            <div className="flex gap-2">
                                <div className="w-2.5 h-1 bg-indigo-500 rounded-full" />
                                <div className="w-2.5 h-1 bg-indigo-500 rounded-full" />
                                <div className="w-2.5 h-1 bg-slate-200 rounded-full" />
                            </div>
                        </div>

                        {/* Card 6: Performance */}
                        <div className="bg-slate-900 rounded-[40px] p-8 flex flex-col group hover:shadow-2xl hover:shadow-slate-900/40 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 blur-2xl rounded-full" />
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 text-white group-hover:text-primary transition-colors">
                                <LineChart className="w-6 h-6" />
                            </div>
                            <h4 className="text-2xl font-black text-white mb-4 tracking-tighter">Continuous Feedback OKR</h4>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 flex-grow italic">
                                "Data rekrutmen dan pelatihan sebelumnya menjadi basis evaluasi performa yang lebih akurat."
                            </p>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden w-full border border-white/5 shadow-inner">
                                <div className="h-full bg-primary w-[75%] group-hover:w-[85%] transition-all duration-1000 ease-in-out" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <ComparisonTable />

            {/* ── PRICING ──────────────────────────────────────────────────── */}
            <section id="harga" className="py-24 bg-slate-50/50">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-primary text-xs font-black uppercase tracking-widest mb-3">Harga</p>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter italic text-center">Harga Software HRIS Arvela.</h2>
                        <p className="text-slate-500 font-medium text-base md:text-lg">Semua paket termasuk pilot 15 hari gratis. Tanpa kartu kredit.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        {PRICING.map((p) => (
                            <div key={p.name} className={`rounded-[32px] p-8 md:p-10 border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${p.popular ? 'bg-slate-900 border-primary shadow-xl shadow-primary/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                                {p.popular && (
                                    <div className="inline-block bg-primary text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">Paling Populer</div>
                                )}
                                <h3 className={`text-xl font-black mb-1 ${p.popular ? 'text-white' : 'text-slate-900'}`}>{p.name}</h3>
                                <p className="text-slate-400 text-xs font-bold mb-8 uppercase tracking-widest">{p.sub}</p>
                                <div className="mb-10 overflow-hidden">
                                    <span className={`text-2xl min-[400px]:text-3xl md:text-4xl font-black tracking-tighter block truncate ${p.popular ? 'text-white' : 'text-slate-900'}`}>{p.price}</span>
                                    {p.period && <span className="text-slate-400 text-sm font-medium">{p.period}</span>}
                                </div>
                                <ul className="space-y-4 mb-10">
                                    {p.features.map((f, j) => (
                                        <li key={j} className={`flex items-start gap-3 text-sm font-bold leading-tight ${p.popular ? 'text-slate-300' : 'text-slate-600'}`}>
                                            <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <a href="#pilot" className={`block w-full py-4 rounded-2xl font-black text-sm text-center transition-all ${p.popular ? 'bg-primary hover:bg-white hover:text-primary text-white shadow-xl shadow-primary/20' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
                                    {p.name === 'Scale' ? 'Hubungi Kami' : 'Mulai Pilot Gratis'}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PILOT CTA ────────────────────────────────────────────────── */}
            <section id="pilot" className="py-24 md:py-32 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -mr-40 -mt-40 opacity-20" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <p className="text-primary text-xs font-black uppercase tracking-widest mb-6 block">Pilot Terbatas</p>
                    <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-8 tracking-tighter">
                        15 Hari Gratis.<br className="hidden md:block" />Setup Hanya 30 Menit.
                    </h2>
                    <p className="text-slate-400 text-base md:text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                        Arvela sedang dalam fase pilot terbatas. Kamu mendapat akses penuh — bukan versi demo, bukan fitur terbatas. Direct WhatsApp ke founder dengan respons sekejap.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-16 text-left">
                        {[
                            'Akses penuh modul rekrutmen terintegrasi',
                            'Onboarding checklist otomatis untuk batch baru',
                            'Demo live performance module bersama founder',
                            'Saluran WhatsApp prioritas ke founder langsung',
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3 text-slate-300 text-sm font-bold bg-white/5 border border-white/10 p-4 rounded-2xl">
                                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                                {item}
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="mailto:hey.aicareer@gmail.com" className="bg-primary hover:bg-white hover:text-primary text-white font-black text-lg px-10 py-5 rounded-2xl transition-all flex items-center gap-3 justify-center shadow-2xl shadow-primary/20">
                            Claim Akses Pilot <ArrowRight className="w-5 h-5" />
                        </a>
                        <a href="https://wa.me/6285727627146?text=halo%20kak%20mau%20coba%2015%20hari%20pilot%20project%20bareng%20Arvela" target="_blank" rel="noopener noreferrer" className="border-2 border-white/10 text-white hover:bg-white/10 font-black text-lg px-10 py-5 rounded-2xl transition-all">
                            WhatsApp Us
                        </a>
                    </div>
                    <p className="text-slate-500 text-sm font-bold mt-8">hey.aicareer@gmail.com</p>
                </div>
            </section>

            {/* ── FOOTER ───────────────────────────────────────────────────── */}
            <footer className="bg-white border-t border-slate-100 py-20 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-20">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
                                <span className="text-white font-black text-base italic">A</span>
                            </div>
                            <span className="text-slate-900 font-black text-xl tracking-tighter">Arvela<span className="text-primary">HR</span></span>
                        </div>
                        <p className="text-slate-500 font-bold text-sm max-w-sm mb-6 leading-relaxed">Platform Talent Management untuk Tim HR Modern yang ingin bergerak cepat dan berbasis data.</p>
                        <p className="text-slate-400 text-xs italic font-medium leading-relaxed border-l-2 border-primary/20 pl-4 py-1">
                            "Kami tidak hanya membangun software. Kami membangun standar baru pengelolaan talenta."
                        </p>
                        <p className="text-slate-400 text-[10px] font-black uppercase mt-3 tracking-widest">— Dian Kusumawati, Founder</p>
                    </div>
                    <div>
                        <p className="text-slate-900 font-black text-[11px] mb-6 uppercase tracking-[0.2em]">Hubungi Kami</p>
                        <div className="space-y-4">
                            <a href="mailto:hey.aicareer@gmail.com" className="text-slate-500 hover:text-primary text-sm font-bold block transition-colors">hey.aicareer@gmail.com</a>
                            <a href="#" className="text-slate-500 hover:text-primary text-sm font-bold block transition-colors tracking-tight">arvela.id · aicareer.id</a>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-900 font-black text-[11px] mb-6 uppercase tracking-[0.2em]">Navigasi & Legal</p>
                        <div className="space-y-4">
                            <a href="#modul" className="text-slate-500 hover:text-primary text-sm font-bold block transition-colors">Modul Solusi</a>
                            <a href="#" className="text-slate-500 hover:text-primary text-sm font-bold block transition-colors">Kebijakan Privasi</a>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">© 2026 Arvela System by Aicareer.</p>
                </div>

                {/* WhatsApp Floating Popup */}
                <a
                    href="https://wa.me/6285727627146?text=halo%20kak%20mau%20coba%2015%20hari%20pilot%20project%20bareng%20Arvela"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] bg-[#25D366] text-white px-5 py-3 rounded-2xl shadow-2xl hover:bg-[#20ba5a] hover:-translate-y-1 transition-all flex items-center gap-3"
                >
                    <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <span className="font-black text-sm whitespace-nowrap tracking-tight">Hubungi Kami via WhatsApp</span>
                </a>
            </footer>
        </div>
    )
}
