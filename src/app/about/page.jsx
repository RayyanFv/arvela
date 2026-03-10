'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
    Briefcase, FileText, BarChart3, Users,
    ArrowRight, CheckCircle2, Building, Shield,
    HeadphonesIcon, Calculator, ChevronRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// ─── Navbar ────────────────────────────────────────────────────────────────
function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                    <img src="/arvela-logo.png" alt="Arvela HR Logo" className="w-9 h-9 md:w-11 md:h-11 object-contain drop-shadow-md" />
                    <span className="text-slate-900 font-black text-lg md:text-xl tracking-tighter">Arvela<span className="text-primary">HR</span></span>
                </div>
                <div className="hidden md:flex items-center gap-10 text-[13px] font-bold text-slate-500">
                    <Link href="/#modul" className="hover:text-primary transition-colors">Solusi</Link>
                    <Link href="/about" className="text-primary transition-colors">Company Profile</Link>
                    <Link href="/#bandingkan" className="hover:text-primary transition-colors">Perbandingan</Link>
                    <Link href="/#harga" className="hover:text-primary transition-colors">Harga</Link>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                    <Link href="/login" className="text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                        Login
                    </Link>
                    <a href="/#pilot" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                        Mulai Pilot
                    </a>
                </div>
            </div>
        </nav>
    )
}

// ─── Footer ────────────────────────────────────────────────────────────────
function Footer() {
    return (
        <footer className="bg-white border-t border-slate-100 py-20 px-6 mt-20">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-20">
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <img src="/arvela-logo.png" alt="Arvela HR Logo" className="w-10 h-10 object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all" />
                        <span className="text-slate-900 font-black text-xl tracking-tighter">Arvela<span className="text-primary">HR</span></span>
                    </div>
                    <p className="text-slate-500 font-bold text-sm max-w-sm mb-6 leading-relaxed">Platform Talent Management untuk Tim HR Modern yang ingin bergerak cepat dan berbasis data.</p>
                    <p className="text-slate-400 text-xs italic font-medium leading-relaxed border-l-2 border-primary/20 pl-4 py-1">
                        "Kami tidak hanya membangun software. Kami membangun standar baru pengelolaan talenta."
                    </p>
                    <p className="text-slate-400 text-[10px] font-black uppercase mt-3 tracking-widest">— Dian Kusumawati, Founder</p>
                </div>
                <div>
                    <p className="text-slate-900 font-black text-[11px] mb-6 uppercase tracking-[0.2em]">Ikuti Kami</p>
                    <div className="flex gap-4">
                        <a href="https://instagram.com/aicareer.id" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center hover:bg-white hover:shadow-lg transition-all border border-slate-100 group" title="Instagram">
                            <img src="https://cdn.simpleicons.org/instagram/94a3b8" alt="Instagram" className="w-5 h-5 group-hover:hidden" />
                            <img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram" className="w-5 h-5 hidden group-hover:block" />
                        </a>
                        <a href="https://tiktok.com/@aicareer.id" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center hover:bg-white hover:shadow-lg transition-all border border-slate-100 group" title="TikTok">
                            <img src="https://cdn.simpleicons.org/tiktok/94a3b8" alt="TikTok" className="w-5 h-5 group-hover:hidden" />
                            <img src="https://cdn.simpleicons.org/tiktok/000000" alt="TikTok" className="w-5 h-5 hidden group-hover:block" />
                        </a>
                        <a href="https://wa.me/6285727627146" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center hover:bg-white hover:shadow-lg transition-all border border-slate-100 group" title="WhatsApp">
                            <img src="https://cdn.simpleicons.org/whatsapp/94a3b8" alt="WhatsApp" className="w-5 h-5 group-hover:hidden" />
                            <img src="https://cdn.simpleicons.org/whatsapp/25D366" alt="WhatsApp" className="w-5 h-5 hidden group-hover:block" />
                        </a>
                    </div>
                    <div className="mt-8">
                        <p className="text-slate-900 font-black text-[11px] mb-4 uppercase tracking-[0.2em]">Kontak</p>
                        <a href="mailto:hey.aicareer@gmail.com" className="text-slate-500 hover:text-primary text-sm font-bold block transition-colors">hey.aicareer [at] gmail.com</a>
                        <p className="text-slate-500 text-sm font-bold mt-2">arvela.id · aicareer.id</p>
                    </div>
                </div>
                <div>
                    <p className="text-slate-900 font-black text-[11px] mb-6 uppercase tracking-[0.2em]">Navigasi & Legal</p>
                    <div className="space-y-4">
                        <Link href="/about" className="text-slate-500 hover:text-primary text-sm font-bold block transition-colors">Company Profile & Pitch</Link>
                        <Link href="/#modul" className="text-slate-500 hover:text-primary text-sm font-bold block transition-colors">Modul Solusi</Link>
                        <Link href="#" className="text-slate-500 hover:text-primary text-sm font-bold block transition-colors">Kebijakan Privasi</Link>
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
                <span className="font-black text-sm whitespace-nowrap tracking-tight">
                    <span className="md:hidden">WhatsApp</span>
                    <span className="hidden md:inline">Hubungi Kami via WhatsApp</span>
                </span>
            </a>
        </footer>
    )
}

// ─── Professional ROI Calculator ───────────────────────────────────────────
function EnterpriseROICalculator() {
    const [employees, setEmployees] = useState(15)
    const [avgSalary, setAvgSalary] = useState(3000000)

    // Asumsi: Waktu administratif HR (manual) memakan waktu 1.5 jam / karyawan / bulan
    const hoursSavedPerEmployee = 1.5
    const hourlyRate = (avgSalary / 160) // 160 jam kerja / bulan
    const timeSavedValue = employees * hoursSavedPerEmployee * hourlyRate
    const arvelaCost = employees * 10000 // Rp 10.000 / karyawan

    const netSavings = timeSavedValue - arvelaCost

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
            <div className="p-10 lg:p-14 lg:w-3/5">
                <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold text-slate-900">Kalkulator Efisiensi Investasi</h3>
                </div>
                <p className="text-slate-500 font-medium text-sm mb-10 leading-relaxed">
                    Estimasi potensi penghematan dari pengurangan jam administratif manual dan konversi ke produktivitas strategis.
                </p>

                <div className="space-y-10">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Jumlah Karyawan (Pengguna)</label>
                            <span className="text-xl font-bold text-slate-900">{employees} Orang</span>
                        </div>
                        <input
                            type="range" min="5" max="500" step="5"
                            value={employees}
                            onChange={(e) => setEmployees(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary hover:bg-slate-300 transition-colors"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Rata-rata Gaji per Karyawan / Bulan</label>
                            <span className="text-xl font-bold text-slate-900">Rp {avgSalary.toLocaleString('id-ID')}</span>
                        </div>
                        <input
                            type="range" min="1000000" max="30000000" step="500000"
                            value={avgSalary}
                            onChange={(e) => setAvgSalary(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary hover:bg-slate-300 transition-colors"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 p-10 lg:p-14 lg:w-2/5 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-center">
                <div className="space-y-8">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Investasi Arvela / Bulan</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-slate-900">Rp {(arvelaCost).toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 mt-2">
                            Flat Rp 10.000 per pengguna
                        </p>
                    </div>

                    <div className="h-px bg-slate-200" />

                    <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Potensi Penghematan Nilai Waktu</p>
                        <span className="text-4xl font-extrabold text-emerald-600">Rp {Math.round(timeSavedValue).toLocaleString('id-ID')}</span>
                        <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                                Anda berpotensi menyelamatkan nilai ekuivalen <strong>Rp {Math.round(netSavings).toLocaleString('id-ID')}</strong> dengan memangkas {(timeSavedValue / hourlyRate).toFixed(0)} jam kerja manual per bulan.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PitchDeckPage() {
    return (
        <div className="bg-white text-slate-900 font-sans selection:bg-primary/20 selection:text-primary min-h-screen">
            <Navbar />

            {/* ── Section 1: The Hook (Time & Profit Leak) ── */}
            <section className="pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <Badge className="bg-slate-100 text-slate-600 border-transparent px-4 py-1.5 font-bold tracking-widest text-[10px] uppercase mb-8">
                        Untuk CEO & Business Owner
                    </Badge>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-8">
                        Berapa jam produktif yang <span className="text-primary italic">bocor</span> setiap bulan untuk urusan admin HR?
                    </h1>
                    <p className="text-slate-600 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed mb-12">
                        Kami mengerti. Merekap absensi dari WhatsApp ke Excel, lalu sinkronisasi data pelamar secara manual bukan hanya melelahkan—tapi membakar profit dan waktu strategis Anda.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="#solusi" className="bg-primary hover:scale-[1.05] shadow-xl text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-300 flex items-center justify-center hover:shadow-primary/40 group">
                            Hentikan Kebocoran Ini <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a href="https://wa.me/6285727627146" className="bg-white border-2 border-slate-200 text-slate-700 font-bold text-lg px-8 py-4 rounded-2xl hover:bg-slate-50 hover:scale-[1.05] hover:border-primary/30 transition-all duration-300 flex items-center justify-center">
                            Diskusi Singkat (WhatsApp)
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Section 2: The Fragmentation Problem ── */}
            <section className="py-24 bg-slate-900 text-white relative">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">
                            Akar Masalahnya: <br /><span className="text-primary">Data yang "Putus"</span>
                        </h2>
                        <p className="text-slate-400 font-medium leading-relaxed mb-8 text-lg">
                            Ketika data kandidat saat interview tidak tersambung dengan performa mereka setelah masuk, Anda kehilangan kendali. Sistem yang terpisah-pisah membuat tim HR Anda berubah menjadi "robot copy-paste".
                        </p>
                        <ul className="space-y-6">
                            <li className="flex gap-4 items-start">
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-slate-300" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1 text-white">CV & Form Berceceran</h4>
                                    <p className="text-slate-400 text-sm">Pelamar via email dan form terpisah membuat tracking lambat.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                    <Users className="w-5 h-5 text-slate-300" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1 text-white">Onboarding Manual</h4>
                                    <p className="text-slate-400 text-sm">Karyawan baru bingung di hari pertama karena tidak ada checklist terpusat.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                    <BarChart3 className="w-5 h-5 text-slate-300" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1 text-white">Absen vs Kinerja</h4>
                                    <p className="text-slate-400 text-sm">Catatan kehadiran fisik ada, tapi pencapaian target (OKR) tidak terlacak.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Visual Chaos */}
                    <div className="relative h-[400px] w-full bg-slate-800/50 rounded-3xl border border-slate-700 p-8 flex flex-col justify-center items-center overflow-hidden">
                        <div className="absolute w-[80%] h-20 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl flex items-center px-6 gap-4 -rotate-6 translate-y-[-60px] translate-x-[-20px] hover:rotate-0 hover:scale-105 hover:bg-white/10 hover:z-50 transition-all duration-500 cursor-pointer">
                            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-green-400" /></div>
                            <div>
                                <p className="text-xs font-bold text-white">Excel Absensi Final.xlsx</p>
                                <p className="text-[10px] text-slate-400">Dimodifikasi 2 hari lalu</p>
                            </div>
                        </div>
                        <div className="absolute w-[75%] h-20 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl flex items-center px-6 gap-4 rotate-3 translate-y-[20px] translate-x-[30px] z-10 hover:rotate-0 hover:scale-105 hover:bg-white/10 hover:z-50 transition-all duration-500 cursor-pointer">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center"><Users className="w-4 h-4 text-blue-400" /></div>
                            <div>
                                <p className="text-xs font-bold text-white">Grup WA Tim Sales</p>
                                <p className="text-[10px] text-slate-400">"Tolong rekap absen hari ini..."</p>
                            </div>
                        </div>
                        <div className="absolute w-[85%] h-20 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl flex items-center px-6 gap-4 -rotate-2 translate-y-[100px] translate-x-[-10px] hover:rotate-0 hover:scale-105 hover:bg-white/10 hover:z-50 transition-all duration-500 cursor-pointer">
                            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-red-400" /></div>
                            <div>
                                <p className="text-xs font-bold text-white">Email Lamaran Masuk</p>
                                <p className="text-[10px] text-slate-400">14 belum dibaca</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 3: The Concept (The Arvela Bridge) ── */}
            <section id="solusi" className="py-24 bg-white">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <Badge className="bg-primary/10 text-primary border-transparent px-4 py-1.5 font-bold tracking-widest text-[10px] uppercase mb-6">
                        Solusi Kami
                    </Badge>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-8">
                        The Arvela Bridge
                    </h2>
                    <p className="text-slate-600 font-medium text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed mb-16">
                        Kami membangun satu jembatan mulus. Hari pertama kandidat melamar (ATS), langsung tersambung menjadi checklist orientasi (Onboarding), dan berakhir sebagai profil pantauan harian (Absensi & OKR). <strong>Satu aliran data.</strong>
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-[45%] left-[10%] right-[10%] h-1 bg-gradient-to-r from-slate-200 via-primary to-slate-200 opacity-50 z-0" />

                        {[
                            { step: '01', title: 'Rekrutmen Cerdas (ATS)', desc: 'Sebar loker, terima aplikasi via satu link, dan tracking status kandidat otomatis.' },
                            { step: '02', title: 'Transisi Checklist', desc: 'Ubah kandidat lolos jadi karyawan resmi dengan otomatisasi modul orientasi.' },
                            { step: '03', title: 'Absensi Presisi', desc: 'Kehadiran di mana saja tervalidasi dengan GPS Geofencing & verifikasi foto.' },
                            { step: '04', title: 'Pemantauan OKR', desc: 'Target terukur yang dinilai langsung oleh manajer dalam satu dashboard.' }
                        ].map((m, i) => (
                            <div key={i} className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-lg shadow-slate-100 relative z-10 hover:-translate-y-4 hover:shadow-2xl hover:border-primary/40 hover:shadow-primary/10 transition-all duration-500 cursor-default group">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xl mb-6 mx-auto group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    {m.step}
                                </div>
                                <h4 className="font-extrabold text-slate-900 text-lg mb-3 group-hover:text-primary transition-colors">{m.title}</h4>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">{m.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Section 4: ROI Simulator & Pricing ── */}
            <section className="py-24 bg-slate-50 border-y border-slate-200 relative overflow-hidden">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Investasi yang Membayar Dirinya Sendiri</h2>
                        <p className="text-slate-600 font-medium text-lg leading-relaxed">
                            Coba simulasikan berapa biaya waktu yang terbuang saat ini, dan bandingkan dengan investasi transparan di Arvela (Hanya Rp 10.000 / karyawan).
                        </p>
                    </div>
                    <EnterpriseROICalculator />
                </div>
            </section>

            {/* ── Section 5: The Dedication (Closing) ── */}
            <section id="pilot" className="py-24 bg-slate-900 text-white relative flex flex-col items-center text-center px-6">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(252,126,18,0.15),transparent_70%)] pointer-events-none" />
                <div className="max-w-3xl mx-auto relative z-10">
                    <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                        <Building className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-8 drop-shadow-md">
                        Kami Mencari <span className="text-primary italic drop-shadow-lg">Mitra</span>, Bukan Sekadar Fitur.
                    </h2>
                    <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed mb-6">
                        Bisnis Anda unik, dan kami memahaminya. Lewat program <strong>Pilot Gratis 15 Hari</strong> ini, Anda bukan "kelinci percobaan". Anda adalah klien berharga yang masukan dan alur kerjanya akan menjadi prioritas tim pengembang kami.
                    </p>
                    <p className="text-slate-400 font-medium text-base mb-12">
                        Butuh integrasi khusus? Kami melayani pengembangan sistem <strong>kustom</strong> yang selaras dengan data yang sudah Anda miliki saat ini, dengan biaya yang tetap terjangkau.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a href="https://wa.me/6285727627146" className="bg-primary hover:bg-orange-600 text-white font-bold text-lg px-10 py-5 rounded-2xl transition-all shadow-xl shadow-primary/30 flex items-center justify-center">
                            Mulai 15 Hari Pilot Gratis <ArrowRight className="w-5 h-5 ml-2" />
                        </a>
                        <a href="mailto:hey.aicareer@gmail.com" className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-lg px-10 py-5 rounded-2xl transition-all flex items-center justify-center">
                            Tanya Solusi Kustom
                        </a>
                    </div>
                    <p className="text-slate-500 text-sm font-semibold mt-8 italic">Tanpa kartu kredit. Setup instalasi dibantu penuh oleh tim kami.</p>
                </div>
            </section>

            <Footer />
        </div>
    )
}
