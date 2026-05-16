import Link from 'next/link'
import Image from 'next/image'
import {
    Briefcase, Users, ClipboardCheck, CalendarDays,
    GraduationCap, LineChart, ArrowRight, CheckCircle,
    X, AlertTriangle, ChevronRight, MonitorPlay, Award,
    Mail, FileSignature, Layout, Fingerprint, MapPin, MessageCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PublicNavbar, PublicFooter, CatalystMark } from '@/components/PublicLayout'

import { getMetadata } from '@/lib/seo'

export const metadata = getMetadata()

function JsonLd() {
    const data = [
        {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Arvela HR",
            "description": "Platform HRIS dan sistem manajemen rekrutmen terintegrasi nomor 1 di Indonesia. Solusi absensi online, ATS cerdas, manajemen talenta, dan asesmen dalam satu aplikasi HR.",
            "operatingSystem": "Web, iOS, Android",
            "applicationCategory": "BusinessApplication, HRSoftware",
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "120"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Arvela",
            "url": "https://arvela.id",
            "logo": "https://arvela.id/logo.png",
            "sameAs": [
                "https://facebook.com/arvelahr",
                "https://x.com/arvelahr",
                "https://linkedin.com/company/arvela"
            ],
            "contactPoint": {
                "@type": "ContactPoint",
                "email": "hey.aicareer@gmail.com",
                "contactType": "customer service"
            }
        }
    ];
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

const PRICING = [
    {
        name: 'Pilot Promo', price: 'Rp 0', originalPrice: 'Rp 84K', period: 'Gratis*', sub: 'Untuk 20 Perusahaan Pertama', popular: false,
        features: ['3 Slot Job Portal & Asesmen (Gratis)', 'Akses & Download CV Tanpa Batas', 'Data Langsung Tersambung ke HRIS', 'HRIS Core: Hanya Rp 3.000/user/bulan', 'Setup Dibantu Tim Arvela'],
    },
    {
        name: 'Arvela Pro', price: 'Rp 99K', originalPrice: 'Rp 140K', period: '/bulan', sub: 'Bundle 5 Slot Aktif', popular: true,
        features: ['Lebih hemat dari harga eceran', '5 Slot Loker & Modul Asesmen Aktif', 'Akses CV Kandidat Sepuasnya', 'Data Terintegrasi Penuh ke HRIS', 'Prioritas Support via WhatsApp'],
    },
    {
        name: 'Arvela Max', price: 'Rp 249K', originalPrice: 'Rp 420K', period: '/bulan', sub: 'Bundle 15 Slot Aktif', popular: false,
        features: ['Skala masif harga termurah', '15 Slot Loker & Modul Asesmen Aktif', 'Talent Pool & Rekap CV Tanpa Batas', 'Semua Data Tersambung ke HRIS', 'Dedicated Account Manager'],
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
function ComparisonTable() {
    return (
        <section id="bandingkan" className="py-24 md:py-32 bg-background border-y border-border overflow-hidden">
            <div className="max-w-5xl mx-auto px-6">
                <div className="text-center mb-16 md:mb-20">
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">Head-to-Head</span>
                    <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight tracking-tighter mb-6">
                        Mengapa <span className="font-serif italic text-primary">Arvela</span> Berbeda?
                    </h2>
                    <p className="text-foreground/70 font-medium max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                        Kami tidak hanya mendigitalkan form kertas. Kami menghubungkan setiap titik data dari rekrutmen hingga performa harian Anda.
                    </p>
                </div>

                <div className="relative overflow-x-auto border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(14,13,10,1)]">
                    <div className="min-w-[700px]">
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] bg-foreground py-4 md:py-5 px-6 md:px-8 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-background">
                            <span>Layanan & Fitur Utama</span>
                            <span className="text-primary text-center font-serif italic text-sm">Arvela System</span>
                            <span className="text-center">Legacy HRIS</span>
                            <span className="text-center">Manual Sheet</span>
                        </div>
                        <div className="divide-y divide-border">
                            {COMPARE_ROWS.map((row, i) => (
                                <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr] py-3 md:py-4 px-6 md:px-8 items-center hover:bg-border/20 transition-colors">
                                    <span className="text-xs md:text-sm font-bold text-foreground">{row.feature}</span>
                                    <div className="flex justify-center bg-primary/5 py-3 md:py-4 border-x border-border/50"><CellVal val={row.arvela} /></div>
                                    <div className="flex justify-center opacity-70"><CellVal val={row.legacy} /></div>
                                    <div className="flex justify-center opacity-70"><CellVal val={row.sheet} /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="mt-8 md:mt-12 text-center text-foreground/50 text-[10px] md:text-sm font-serif italic px-4">
                    * Berdasarkan perbandingan internal dengan sistem HR konvensional dan alur kerja manual umum (2026).
                </p>
            </div>
        </section>
    )
}

function CellVal({ val }) {
    if (val === true) return <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-primary mx-auto" />
    if (val === false || val === null) return <span className="text-foreground/30 text-[10px] md:text-xs font-medium">—</span>
    return <span className="text-foreground/70 text-[9px] md:text-[11px] font-bold text-center block leading-tight px-2">{val}</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
    return (
        <div className="bg-background text-foreground selection:bg-primary selection:text-white min-h-screen">
            <JsonLd />
            <PublicNavbar />

            {/* ── HERO ─────────────────────────────────────────────────────── */}
            <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-background">
                {/* Architectural Hero Image Background */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/hr_hero.png"
                        alt="HR and Recruitment Desk"
                        fill
                        className="object-cover opacity-30 mix-blend-multiply grayscale-[0.2]"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
                    {/* Left */}
                    <div className="text-center lg:text-left">
                        <div className="inline-flex items-center gap-2.5 bg-background border-2 border-foreground px-4 md:px-5 py-2 mb-8 shadow-[4px_4px_0px_0px_rgba(238,117,34,1)]">
                            <span className="w-2 h-2 bg-primary rounded-full" />
                            <h2 className="text-foreground text-[10px] md:text-[11px] font-black uppercase tracking-widest leading-none m-0">#1 Manajemen HR & Rekrutmen Terintegrasi</h2>
                        </div>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-[1] md:leading-[0.95] tracking-tighter mb-6 md:mb-8">
                            Otomatisasi HRIS yang<br className="hidden md:block" /> Menghemat <span className="font-serif italic text-primary">Ribuan Jam</span><br className="hidden md:block" /> Kerja Rekrutmen.
                        </h1>
                        <p className="text-foreground/70 text-lg md:text-xl font-medium leading-relaxed mb-8 md:mb-12 max-w-lg mx-auto lg:mx-0">
                            Tinggalkan tumpukan form kertas dan rekap Excel manual. Arvela menghubungkan rekrutmen cerdas (ATS), asesmen kandidat, absensi, hingga manajemen performa dalam satu ekosistem platform HR terintegrasi yang elegan.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <a href="#pilot" className="bg-foreground hover:bg-foreground/90 text-background font-black text-base md:text-lg px-8 md:px-10 py-4 md:py-5 border-2 border-foreground rounded-none shadow-[6px_6px_0px_0px_rgba(238,117,34,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(238,117,34,1)] flex items-center gap-3 justify-center">
                                Mulai Sekarang <ArrowRight className="w-5 h-5" />
                            </a>
                            <a href="#modul" className="bg-background border-2 border-border text-foreground hover:bg-border/10 font-bold text-base md:text-lg px-8 md:px-10 py-4 md:py-5 rounded-none transition-colors text-center">
                                Lihat Solusi
                            </a>
                        </div>
                    </div>

                    {/* Right — Interactive Preview */}
                    <div className="relative group px-4 md:px-0">
                        <div className="relative bg-background p-6 md:p-8 border-2 border-foreground shadow-[12px_12px_0px_0px_rgba(14,13,10,1)]">
                            <div className="border border-border p-6 md:p-8 space-y-5 md:space-y-6">
                                <div className="flex items-center justify-between border-b border-border pb-5 md:pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 border border-foreground flex items-center justify-center bg-primary/10">
                                            <MapPin className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-foreground uppercase tracking-widest">Attendance Center</p>
                                            <p className="text-[10px] text-foreground/60 font-serif italic">Verified via Geofence + Selfie</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-foreground text-background rounded-none border-none font-black text-[9px] md:text-[10px] uppercase tracking-widest">LIVE</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div className="h-20 md:h-24 bg-background border border-border p-3 md:p-4">
                                        <p className="text-[8px] md:text-[9px] font-black text-foreground/50 uppercase tracking-widest mb-1">Clock In</p>
                                        <p className="text-xl md:text-2xl font-serif text-foreground tracking-tighter italic">08:02:15</p>
                                    </div>
                                    <div className="h-20 md:h-24 bg-background border border-border p-3 md:p-4">
                                        <p className="text-[8px] md:text-[9px] font-black text-foreground/50 uppercase tracking-widest mb-1">Status</p>
                                        <p className="text-xs md:text-sm font-black text-primary">Terdaftar Aktif</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 2: Realita Pahit HR (PAS Framework) ── */}
            <section className="py-24 md:py-32 bg-foreground text-background relative border-y-2 border-foreground">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-16 md:mb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] block mb-4 border border-primary px-3 py-1 inline-block bg-primary/5">Realita Pahit HR</span>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-background leading-[1] mb-6 uppercase tracking-tighter">
                                Mengapa HR Selalu <br className="hidden lg:block" /><span className="text-primary font-serif italic normal-case">Kewalahan?</span>
                            </h2>
                            <p className="text-background/70 font-medium leading-relaxed text-lg md:text-xl font-serif italic border-l-4 border-primary pl-4">
                                "Masalahnya bukan tim HR tidak kompeten. Masalahnya adalah toolnya yang tidak terintegrasi. HR itu partner strategis, bukan robot admin."
                            </p>
                        </div>
                        <div className="relative w-full h-64 md:h-80 border-2 border-foreground bg-foreground p-2 shadow-[8px_8px_0px_0px_rgba(238,117,34,1)] group">
                            <div className="absolute inset-0 border-2 border-background z-10 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity m-4 mix-blend-difference" />
                            <Image
                                src="/images/hardware_ecosystem.png"
                                alt="Disconnected legacy systems illustration"
                                fill
                                className="object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-500 grayscale group-hover:grayscale-0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {/* Point 1: Data Entry Fatigue */}
                        <div className="border-2 border-background/20 bg-background/5 p-8 flex flex-col group hover:border-primary transition-colors">
                            <h3 className="text-xl font-black uppercase tracking-tight text-background mb-3 group-hover:text-primary">Beban Administratif & "Ketik Ulang"</h3>
                            <p className="text-background/50 font-medium text-sm mb-6 flex-grow">
                                80% waktu habis hanya untuk memindahkan data. Dari platform loker dipindah ke Excel, dari Excel diketik lagi ke sistem absensi.
                            </p>
                            <div className="pt-4 border-t-2 border-background/20">
                                <p className="text-primary text-sm font-bold leading-relaxed">
                                    "Berhenti membuang 20 jam seminggu hanya untuk rekap CV manual. Automasi aliran datanya."
                                </p>
                            </div>
                        </div>

                        {/* Point 2: Siloed Systems */}
                        <div className="border-2 border-background/20 bg-background/5 p-8 flex flex-col group hover:border-primary transition-colors">
                            <h3 className="text-xl font-black uppercase tracking-tight text-background mb-3 group-hover:text-primary">Sistem yang Tercecer</h3>
                            <p className="text-background/50 font-medium text-sm mb-6 flex-grow">
                                Bayar banyak langganan: satu untuk loker, satu untuk psikotes, satu lagi untuk absen. Data tetap tidak nyambung dan butuh sinkronisasi manual.
                            </p>
                            <div className="pt-4 border-t-2 border-background/20">
                                <p className="text-primary text-sm font-bold leading-relaxed">
                                    "Arvela menyatukan rekrutmen, absensi, hingga performa dalam satu ekosistem yang presisi."
                                </p>
                            </div>
                        </div>

                        {/* Point 3: Fraud & Bias */}
                        <div className="border-2 border-background/20 bg-background/5 p-8 flex flex-col group hover:border-primary transition-colors">
                            <h3 className="text-xl font-black uppercase tracking-tight text-background mb-3 group-hover:text-primary">Risiko Bad Hire & Joki</h3>
                            <p className="text-background/50 font-medium text-sm mb-6 flex-grow">
                                Kandidat terlihat bagus di CV, tapi skill aslinya nol. Seringkali tes online dikerjakan oleh joki, dan keputusan hiring cuma bermodal feeling.
                            </p>
                            <div className="pt-4 border-t-2 border-background/20">
                                <p className="text-primary text-sm font-bold leading-relaxed">
                                    "Pilih talenta pakai data. Sistem AI Proctoring kami memastikan tes kandidat 100% valid."
                                </p>
                            </div>
                        </div>

                        {/* Point 4: Candidate Ghosting */}
                        <div className="border-2 border-background/20 bg-background/5 p-8 flex flex-col group hover:border-primary transition-colors">
                            <h3 className="text-xl font-black uppercase tracking-tight text-background mb-3 group-hover:text-primary">Kandidat Terbaik Lepas</h3>
                            <p className="text-background/50 font-medium text-sm mb-6 flex-grow">
                                Karena tim kewalahan menyortir ratusan CV, kandidat lama tidak dikabari. Ujung-ujungnya, mereka diambil oleh kompetitor yang lebih cepat.
                            </p>
                            <div className="pt-4 border-t-2 border-background/20">
                                <p className="text-primary text-sm font-bold leading-relaxed">
                                    "Jangan biarkan talenta menunggu. Arvela otomatis mengirim update email status secara instan."
                                </p>
                            </div>
                        </div>

                        {/* Point 5: Onboarding */}
                        <div className="border-2 border-background/20 bg-background/5 p-8 flex flex-col group hover:border-primary transition-colors md:col-span-2 lg:col-span-1">
                            <h3 className="text-xl font-black uppercase tracking-tight text-background mb-3 group-hover:text-primary">Onboarding yang Repot</h3>
                            <p className="text-background/50 font-medium text-sm mb-6 flex-grow">
                                Saat pelamar akhirnya bergabung, HR harus buat akun email, daftar sidik jari, dan setup dokumen administrasi dari nol.
                            </p>
                            <div className="pt-4 border-t-2 border-background/20">
                                <p className="text-primary text-sm font-bold leading-relaxed">
                                    "Satu klik 'Hired', sistem otomatis mengubah pelamar jadi karyawan aktif di HRIS Anda."
                                </p>
                            </div>
                        </div>
                        
                        {/* Visual Connector / CTA to the Bridge */}
                        <a href="#modul" className="border-2 border-primary bg-primary p-8 flex flex-col justify-center items-center text-center group hover:bg-background hover:border-foreground transition-colors cursor-pointer">
                            <div className="w-16 h-16 border-2 border-foreground bg-background mb-4 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(14,13,10,1)]">
                                <CatalystMark className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-foreground group-hover:text-foreground">Inilah Solusinya</h3>
                            <p className="text-foreground/80 font-serif italic text-sm mt-2 font-bold">The Arvela Bridge.</p>
                        </a>
                    </div>
                </div>
            </section>

            {/* ── STATS ────────────────────────────────────────────────────── */}
            <section className="py-20 md:py-24 bg-foreground border-y border-foreground">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-primary text-xs font-black uppercase tracking-widest mb-3">Data & Urgensi</p>
                        <h2 className="text-3xl md:text-5xl font-serif text-background italic leading-tight text-center">Software HRIS & ATS yang paling dicari tim HR Indonesia.</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {STATS.map((s, i) => (
                            <div key={i} className="bg-foreground border border-border/20 p-6 hover:bg-background/5 transition-colors">
                                <p className="text-5xl font-black text-primary mb-2 tracking-tighter">{s.value}<span className="text-2xl font-serif italic text-background">{s.suffix}</span></p>
                                <p className="text-background/80 text-sm font-medium leading-relaxed mb-6">{s.desc}</p>
                                <p className="text-background/40 text-[10px] font-black uppercase tracking-widest border-t border-border/20 pt-4">Source: {s.source}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MODUL ────────────────────────────────────────────────────── */}
            <section id="modul" className="py-24 md:py-32 bg-background">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 md:mb-24">
                        <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Modul & Fitur Inti</span>
                        <h2 className="text-5xl md:text-7xl font-black text-foreground leading-[0.9] tracking-tighter mb-8">
                            Tiga Modul. <br className="hidden md:block"/> <span className="font-serif italic text-primary">Satu Ekosistem.</span>
                        </h2>
                        <p className="text-foreground/70 font-medium max-w-2xl mx-auto text-base md:text-lg">
                            Mulai dari memposting lowongan, menguji kandidat dengan proctoring AI, hingga memantau absen dan performa harian. Arvela memutus rantai administrasi HR yang berbelit.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Card 1: Recruitment (Texture Overlay) */}
                        <div className="relative border-2 border-foreground p-8 flex flex-col group overflow-hidden shadow-[6px_6px_0px_0px_rgba(14,13,10,1)] bg-foreground min-h-[320px]">
                            <Image
                                src="/images/texture_overlay.png"
                                alt="Ribbed glass texture"
                                fill
                                className="object-cover opacity-60 mix-blend-overlay"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-foreground to-transparent" />
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-12 h-12 border border-primary/50 bg-background/10 backdrop-blur-sm flex items-center justify-center text-primary">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <span className="bg-primary text-background text-[8px] font-black uppercase tracking-widest px-2 py-1">Job Portal</span>
                                </div>
                                <h4 className="text-2xl font-black text-background mb-4 tracking-tighter uppercase">Smart ATS Pipeline</h4>
                                <p className="text-background/80 text-base font-medium leading-relaxed flex-grow">
                                    Otomatisasi info status kandidat via email setiap perpindahan stage. Drag-and-drop kandidat ala Kanban.
                                </p>
                            </div>
                        </div>

                        {/* Card 2: Assessment */}
                        <div className="border-2 border-border bg-background p-8 flex flex-col group hover:border-foreground transition-colors">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-12 h-12 border border-border flex items-center justify-center text-foreground group-hover:border-primary group-hover:text-primary transition-colors">
                                    <MonitorPlay className="w-6 h-6" />
                                </div>
                                <span className="border border-foreground text-foreground text-[8px] font-black uppercase tracking-widest px-2 py-1">Asesmen</span>
                            </div>
                            <h4 className="text-2xl font-black text-foreground mb-4 tracking-tighter uppercase">AI Proctoring</h4>
                            <p className="text-foreground/80 text-base font-medium leading-relaxed flex-grow">
                                Uji kandidat dengan tes kustom (PG/Essay). Dilengkapi sistem deteksi joki kamera dan penilaian skor instan.
                            </p>
                        </div>

                        {/* Card 3: Transition / Onboarding */}
                        <div className="border-2 border-border bg-background p-8 flex flex-col group hover:border-foreground transition-colors">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-12 h-12 border border-border flex items-center justify-center text-foreground group-hover:border-primary group-hover:text-primary transition-colors">
                                    <FileSignature className="w-6 h-6" />
                                </div>
                                <span className="border border-foreground text-foreground text-[8px] font-black uppercase tracking-widest px-2 py-1">HRIS & Ops</span>
                            </div>
                            <h4 className="text-2xl font-black text-foreground mb-4 tracking-tighter uppercase">1-Click Onboarding</h4>
                            <p className="text-foreground/80 text-base font-medium leading-relaxed flex-grow">
                                Satu klik 'Hired', kandidat langsung memiliki E-File karyawan aktif dan terhubung ke sistem presensi.
                            </p>
                        </div>

                        {/* Card 4: Attendance */}
                        <div className="border-2 border-border bg-background p-8 flex flex-col group hover:border-foreground transition-colors">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-12 h-12 border border-border flex items-center justify-center text-foreground group-hover:border-primary group-hover:text-primary transition-colors">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <span className="border border-foreground text-foreground text-[8px] font-black uppercase tracking-widest px-2 py-1">HRIS & Ops</span>
                            </div>
                            <h4 className="text-2xl font-black text-foreground mb-4 tracking-tighter uppercase">Presensi GPS Presisi</h4>
                            <p className="text-foreground/80 text-base font-medium leading-relaxed flex-grow">
                                Pantau kehadiran dengan Geofencing radius ketat, verifikasi foto selfie, dan deteksi Fake GPS.
                            </p>
                        </div>

                        {/* Card 5: Employer Branding */}
                        <div className="border-2 border-border bg-background p-8 flex flex-col group hover:border-foreground transition-colors">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-12 h-12 border border-border flex items-center justify-center text-foreground group-hover:border-primary group-hover:text-primary transition-colors">
                                    <Layout className="w-6 h-6" />
                                </div>
                                <span className="border border-foreground text-foreground text-[8px] font-black uppercase tracking-widest px-2 py-1">Job Portal</span>
                            </div>
                            <h4 className="text-2xl font-black text-foreground mb-4 tracking-tighter uppercase">Career Page Builder</h4>
                            <p className="text-foreground/80 text-base font-medium leading-relaxed flex-grow">
                                Bangun halaman karir perusahaan yang elegan dan profesional dalam hitungan menit untuk menarik top talent.
                            </p>
                        </div>

                        {/* Card 6: Performance */}
                        <div className="border-2 border-foreground bg-primary p-8 flex flex-col group shadow-[6px_6px_0px_0px_rgba(14,13,10,1)]">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-12 h-12 border border-foreground bg-background flex items-center justify-center text-foreground">
                                    <LineChart className="w-6 h-6" />
                                </div>
                                <span className="border border-foreground bg-background text-foreground text-[8px] font-black uppercase tracking-widest px-2 py-1">HRIS & Ops</span>
                            </div>
                            <h4 className="text-2xl font-black text-foreground mb-4 tracking-tighter uppercase">Continuous OKR & KPI</h4>
                            <p className="text-foreground/90 text-base font-medium leading-relaxed flex-grow">
                                Evaluasi kinerja berbasis data. Hubungkan target perusahaan dengan pencapaian harian karyawan secara transparan.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <ComparisonTable />

            {/* ── PRICING ──────────────────────────────────────────────────── */}
            <section id="harga" className="py-24 border-b border-border bg-background relative overflow-hidden">
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-3 bg-foreground text-background px-5 py-2.5 mb-8 shadow-[4px_4px_0px_0px_rgba(238,117,34,1)]">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                            <span className="text-[11px] font-black uppercase tracking-widest">12 dari 20 Kuota Pilot Terisi</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6 tracking-tighter italic text-center leading-[1.1]">Ekosistem Terintegrasi.<br className="hidden md:block"/> Harga Terjangkau.</h2>
                        <p className="text-foreground/70 font-medium text-base md:text-lg max-w-3xl mx-auto">
                            Job Portal, Asesmen, dan HRIS kini menyatu tanpa batasan data. Akses CV kandidat 100% transparan tanpa biaya <em>"unlock"</em> tersembunyi.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {PRICING.map((p) => (
                            <div key={p.name} className={`p-8 md:p-10 border-2 transition-all duration-300 ${p.popular ? 'border-primary bg-background shadow-[8px_8px_0px_0px_rgba(238,117,34,1)] scale-105 z-10' : 'border-border bg-background hover:border-foreground'}`}>
                                {p.popular && (
                                    <div className="inline-block bg-primary text-background text-[9px] font-black uppercase tracking-widest px-4 py-1.5 mb-6 shadow-[2px_2px_0px_0px_rgba(14,13,10,1)]">The Best Value</div>
                                )}
                                <h3 className={`text-2xl font-black mb-1 uppercase tracking-tight text-foreground`}>{p.name}</h3>
                                <p className="text-foreground/50 text-xs font-bold mb-8 uppercase tracking-widest">{p.sub}</p>
                                <div className="mb-10 overflow-hidden border-t border-border pt-6">
                                    {p.originalPrice && <span className="text-foreground/40 text-xl font-serif italic line-through mb-1 block">{p.originalPrice}</span>}
                                    <span className={`text-3xl md:text-5xl font-serif italic tracking-tighter block text-foreground leading-none`}>{p.price}</span>
                                    {p.period && <span className="text-foreground/50 text-sm font-bold block mt-2">{p.period}</span>}
                                </div>
                                <ul className="space-y-4 mb-10">
                                    {p.features.map((f, j) => (
                                        <li key={j} className="flex items-start gap-3 text-sm font-medium leading-tight text-foreground/80">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <a href="#pilot" className={`block w-full py-4 font-black text-sm text-center transition-all border-2 border-foreground ${p.popular ? 'bg-primary text-foreground hover:bg-primary/90 shadow-[4px_4px_0px_0px_rgba(14,13,10,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(14,13,10,1)]' : 'bg-background text-foreground hover:bg-foreground hover:text-background'}`}>
                                    Klaim Promo Pilot
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PILOT CTA ────────────────────────────────────────────────── */}
            <section id="pilot" className="py-24 md:py-32 bg-foreground relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <p className="text-primary text-xs font-black uppercase tracking-widest mb-6 block">Pilot Terbatas</p>
                    <h2 className="text-5xl md:text-7xl font-black text-background leading-[1] mb-8 tracking-tighter uppercase">
                        15 Hari Gratis.<br className="hidden md:block" />
                        <span className="font-serif italic text-primary normal-case">Setup Hanya 30 Menit.</span>
                    </h2>
                    <p className="text-background/70 text-base md:text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                        Arvela sedang dalam fase pilot terbatas. Kamu mendapat akses penuh — bukan versi demo, bukan fitur terbatas. Direct WhatsApp ke founder dengan respons sekejap.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="mailto:hey.aicareer[at]gmail.com" className="bg-primary hover:bg-primary/90 text-foreground font-black text-lg px-10 py-5 transition-all flex items-center gap-3 justify-center border-2 border-primary shadow-[6px_6px_0px_0px_rgba(250,247,241,1)]">
                            Claim Akses Pilot <ArrowRight className="w-5 h-5" />
                        </a>
                        <a href="https://wa.me/6285727627146?text=halo%20kak%20mau%20coba%2015%20hari%20pilot%20project%20bareng%20Arvela" target="_blank" rel="noopener noreferrer" className="border-2 border-background text-background hover:bg-background hover:text-foreground font-black text-lg px-10 py-5 transition-all">
                            WhatsApp Us
                        </a>
                    </div>
                    <p className="text-background/50 text-sm font-bold mt-12 font-serif italic">hey.aicareer [at] gmail.com</p>
                </div>
            </section>

            {/* ── FOOTER ───────────────────────────────────────────────────── */}
            <PublicFooter />
        </div>
    )
}
