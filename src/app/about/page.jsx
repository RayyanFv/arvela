'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    Briefcase, FileText, BarChart3, Users,
    ArrowRight, CheckCircle2, Building, Shield,
    HeadphonesIcon, Calculator, ChevronRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PublicNavbar, PublicFooter } from '@/components/PublicLayout'

// ─── Professional ROI Calculator ───────────────────────────────────────────
function EnterpriseROICalculator() {
    const [employees, setEmployees] = useState(15)
    const [avgSalary, setAvgSalary] = useState(3000000)

    // Asumsi: Waktu administratif HR (manual) memakan waktu 1.5 jam / karyawan / bulan
    const hoursSavedPerEmployee = 1.5
    const hourlyRate = (avgSalary / 160) // 160 jam kerja / bulan
    const timeSavedValue = employees * hoursSavedPerEmployee * hourlyRate
    const arvelaCost = employees * 3000 // Rp 3.000 / karyawan (HRIS & Ops Module)

    const netSavings = timeSavedValue - arvelaCost

    return (
        <div className="bg-background border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(14,13,10,1)] flex flex-col lg:flex-row overflow-hidden">
            <div className="p-10 lg:p-14 lg:w-3/5">
                <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Kalkulator ROI</h3>
                </div>
                <p className="text-foreground/70 font-medium text-sm mb-10 leading-relaxed font-serif italic">
                    "Estimasi potensi penghematan dari pengurangan jam administratif manual dan konversi ke produktivitas strategis."
                </p>

                <div className="space-y-10">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-black uppercase tracking-widest text-foreground">Jumlah Karyawan (Pengguna)</label>
                            <span className="text-xl font-bold text-primary">{employees} Orang</span>
                        </div>
                        <input
                            type="range" min="5" max="500" step="5"
                            value={employees}
                            onChange={(e) => setEmployees(parseInt(e.target.value))}
                            className="w-full h-2 bg-border rounded-none appearance-none cursor-pointer accent-primary hover:bg-foreground/20 transition-colors"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-black uppercase tracking-widest text-foreground">Rata-rata Gaji per Karyawan / Bulan</label>
                            <span className="text-xl font-bold text-primary">Rp {avgSalary.toLocaleString('id-ID')}</span>
                        </div>
                        <input
                            type="range" min="1000000" max="30000000" step="500000"
                            value={avgSalary}
                            onChange={(e) => setAvgSalary(parseInt(e.target.value))}
                            className="w-full h-2 bg-border rounded-none appearance-none cursor-pointer accent-primary hover:bg-foreground/20 transition-colors"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-foreground p-10 lg:p-14 lg:w-2/5 border-t-2 lg:border-t-0 lg:border-l-2 border-foreground flex flex-col justify-center">
                <div className="space-y-8">
                    <div>
                        <p className="text-xs font-black text-background/50 uppercase tracking-widest mb-2">Investasi Arvela / Bulan</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-serif italic text-background">Rp {(arvelaCost).toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-xs font-medium text-background/50 mt-2 font-serif italic">
                            Hanya Rp 3.000 per pengguna (Modul HRIS & Ops)
                        </p>
                    </div>

                    <div className="h-[2px] bg-background/20" />

                    <div>
                        <p className="text-xs font-black text-primary uppercase tracking-widest mb-2">Potensi Penghematan Nilai Waktu</p>
                        <span className="text-4xl font-extrabold text-primary">Rp {Math.round(timeSavedValue).toLocaleString('id-ID')}</span>
                        <div className="mt-4 p-4 border border-primary/30 bg-primary/10">
                            <p className="text-xs font-medium text-background leading-relaxed">
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
        <div className="bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary min-h-screen">
            <PublicNavbar />

            {/* ── Section 1: The Hook (Time & Profit Leak) ── */}
            <section className="pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[80vh]">
                <div className="absolute inset-0 z-0">
                    <Image 
                        src="/images/about_hero.png" 
                        alt="Corporate Boardroom" 
                        fill 
                        className="object-cover opacity-20 mix-blend-multiply grayscale"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
                </div>
                
                <div className="max-w-4xl mx-auto relative z-10">
                    <Badge className="bg-foreground text-background rounded-none border-none px-4 py-1.5 font-black tracking-widest text-[10px] uppercase mb-8">
                        Untuk CEO & Business Owner
                    </Badge>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-[1] tracking-tight mb-8">
                        Berapa jam produktif yang <span className="text-primary font-serif italic">bocor</span> setiap bulan untuk urusan admin HR?
                    </h1>
                    <p className="text-foreground/70 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed mb-12">
                        Kami mengerti. Merekap absensi dari WhatsApp ke Excel, lalu sinkronisasi data pelamar secara manual bukan hanya melelahkan—tapi membakar profit dan waktu strategis Anda.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="#solusi" className="bg-primary hover:bg-primary/90 border-2 border-primary text-foreground font-black text-lg px-8 py-4 transition-all shadow-[6px_6px_0px_0px_rgba(14,13,10,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(14,13,10,1)] flex items-center justify-center group">
                            Hentikan Kebocoran Ini <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a href="https://wa.me/6285727627146" className="bg-background border-2 border-foreground text-foreground font-black text-lg px-8 py-4 hover:bg-foreground hover:text-background transition-colors duration-300 flex items-center justify-center">
                            Diskusi Singkat (WhatsApp)
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Section 2: The Fragmentation Problem ── */}
            <section className="py-24 bg-foreground text-background border-y-2 border-foreground relative">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6 uppercase tracking-tighter">
                            Akar Masalahnya: <br /><span className="text-primary font-serif italic normal-case">Data yang "Putus"</span>
                        </h2>
                        <p className="text-background/70 font-medium leading-relaxed mb-8 text-lg">
                            Ketika data kandidat saat interview tidak tersambung dengan performa mereka setelah masuk, Anda kehilangan kendali. Sistem yang terpisah-pisah membuat tim HR Anda berubah menjadi "robot copy-paste".
                        </p>
                        <div className="w-16 h-[2px] bg-primary mb-8" />
                        <ul className="space-y-6">
                            <li className="flex gap-4 items-start">
                                <div className="w-10 h-10 border border-background/20 bg-background/5 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-black text-lg mb-1 text-background uppercase tracking-tight">CV & Form Berceceran</h4>
                                    <p className="text-background/50 text-sm font-serif italic">"Pelamar via email dan form terpisah membuat tracking lambat."</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <div className="w-10 h-10 border border-background/20 bg-background/5 flex items-center justify-center shrink-0">
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-black text-lg mb-1 text-background uppercase tracking-tight">Onboarding Manual</h4>
                                    <p className="text-background/50 text-sm font-serif italic">"Karyawan baru bingung di hari pertama karena tidak ada checklist terpusat."</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <div className="w-10 h-10 border border-background/20 bg-background/5 flex items-center justify-center shrink-0">
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-black text-lg mb-1 text-background uppercase tracking-tight">Absen vs Kinerja</h4>
                                    <p className="text-background/50 text-sm font-serif italic">"Catatan kehadiran fisik ada, tapi pencapaian target (OKR) tidak terlacak."</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Visual Chaos - Editorial Style */}
                    <div className="relative h-[400px] w-full border-2 border-background/20 p-8 flex flex-col justify-center items-center overflow-hidden bg-background/5">
                        <div className="absolute w-[80%] border-2 border-background bg-foreground p-4 flex items-center px-6 gap-4 -rotate-2 translate-y-[-60px] translate-x-[-20px] shadow-[8px_8px_0px_0px_rgba(250,247,241,0.2)]">
                            <div className="w-8 h-8 border border-primary flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-primary" /></div>
                            <div>
                                <p className="text-xs font-black text-background uppercase tracking-widest">Excel Absensi Final.xlsx</p>
                                <p className="text-[10px] text-background/50 font-serif italic">Dimodifikasi 2 hari lalu</p>
                            </div>
                        </div>
                        <div className="absolute w-[75%] border-2 border-primary bg-foreground p-4 flex items-center px-6 gap-4 rotate-1 translate-y-[20px] translate-x-[30px] z-10 shadow-[8px_8px_0px_0px_rgba(238,117,34,1)]">
                            <div className="w-8 h-8 border border-background flex items-center justify-center"><Users className="w-4 h-4 text-background" /></div>
                            <div>
                                <p className="text-xs font-black text-background uppercase tracking-widest">Grup WA Tim Sales</p>
                                <p className="text-[10px] text-primary font-serif italic">"Tolong rekap absen hari ini..."</p>
                            </div>
                        </div>
                        <div className="absolute w-[85%] border-2 border-background bg-foreground p-4 flex items-center px-6 gap-4 -rotate-1 translate-y-[100px] translate-x-[-10px] shadow-[8px_8px_0px_0px_rgba(250,247,241,0.2)]">
                            <div className="w-8 h-8 border border-background flex items-center justify-center"><FileText className="w-4 h-4 text-background" /></div>
                            <div>
                                <p className="text-xs font-black text-background uppercase tracking-widest">Email Lamaran Masuk</p>
                                <p className="text-[10px] text-background/50 font-serif italic">14 belum dibaca</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 3: The Concept (The Arvela Bridge) ── */}
            <section id="solusi" className="py-24 bg-background">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <Badge className="bg-foreground text-background border-transparent px-4 py-1.5 font-black tracking-widest text-[10px] uppercase mb-6 rounded-none">
                        Solusi Kami
                    </Badge>
                    <h2 className="text-4xl md:text-6xl font-black text-foreground leading-[1] mb-8 uppercase tracking-tighter">
                        The Arvela <span className="text-primary font-serif italic normal-case">Bridge</span>
                    </h2>
                    <p className="text-foreground/70 font-medium text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed mb-16">
                        Kami membangun satu jembatan mulus. Hari pertama kandidat melamar (ATS), langsung tersambung menjadi checklist orientasi (Onboarding), dan berakhir sebagai profil pantauan harian (Absensi & OKR). <strong>Satu aliran data.</strong>
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                        {[
                            { step: '01', title: 'Rekrutmen Cerdas (ATS)', desc: 'Sebar loker, terima aplikasi via satu link, dan tracking status kandidat otomatis.' },
                            { step: '02', title: 'Transisi Checklist', desc: 'Ubah kandidat lolos jadi karyawan resmi dengan otomatisasi modul orientasi.' },
                            { step: '03', title: 'Absensi Presisi', desc: 'Kehadiran di mana saja tervalidasi dengan GPS Geofencing & verifikasi foto.' },
                            { step: '04', title: 'Pemantauan OKR', desc: 'Target terukur yang dinilai langsung oleh manajer dalam satu dashboard.' }
                        ].map((m, i) => (
                            <div key={i} className="bg-background border-2 border-border p-8 relative z-10 hover:border-foreground transition-all duration-300 group flex flex-col items-start text-left">
                                <div className="w-12 h-12 border-2 border-foreground bg-primary/10 flex items-center justify-center text-foreground font-black text-xl mb-6 shadow-[4px_4px_0px_0px_rgba(14,13,10,1)]">
                                    {m.step}
                                </div>
                                <h4 className="font-black text-foreground text-lg mb-3 uppercase tracking-tight">{m.title}</h4>
                                <p className="text-foreground/60 text-sm font-serif italic leading-relaxed">"{m.desc}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Section 4: ROI Simulator & Pricing ── */}
            <section className="py-24 bg-background border-y-2 border-foreground relative overflow-hidden">
                <div className="absolute inset-0">
                    <Image 
                        src="/images/texture_overlay.png" 
                        alt="Texture" 
                        fill 
                        className="object-cover opacity-10 mix-blend-multiply"
                    />
                </div>
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6 uppercase tracking-tighter">Investasi yang <span className="font-serif italic text-primary normal-case">Membayar Dirinya Sendiri</span></h2>
                        <p className="text-foreground/70 font-medium text-lg leading-relaxed">
                            Coba simulasikan berapa biaya waktu yang terbuang saat ini, dan bandingkan dengan investasi sangat terjangkau di Arvela (Hanya Rp 3.000 / karyawan untuk manajemen inti).
                        </p>
                    </div>
                    <EnterpriseROICalculator />
                </div>
            </section>

            {/* ── Section 5: The Dedication (Closing) ── */}
            <section id="pilot" className="py-24 bg-primary text-foreground relative flex flex-col items-center text-center px-6">
                <div className="max-w-3xl mx-auto relative z-10">
                    <div className="w-16 h-16 border-2 border-foreground bg-background flex items-center justify-center mx-auto mb-8 shadow-[6px_6px_0px_0px_rgba(14,13,10,1)]">
                        <Building className="w-8 h-8 text-foreground" />
                    </div>
                    <h2 className="text-4xl lg:text-6xl font-black text-foreground leading-[1] mb-8 uppercase tracking-tighter">
                        Kami Mencari <span className="font-serif italic text-background normal-case">Mitra</span>, Bukan Sekadar Fitur.
                    </h2>
                    <p className="text-foreground/80 text-lg md:text-xl font-medium leading-relaxed mb-6 font-serif italic">
                        "Bisnis Anda unik, dan kami memahaminya. Lewat program Pilot Gratis 15 Hari ini, Anda bukan 'kelinci percobaan'. Anda adalah klien berharga yang masukan dan alur kerjanya akan menjadi prioritas tim pengembang kami."
                    </p>
                    <p className="text-foreground/70 font-black uppercase text-sm mb-12 tracking-widest">
                        Butuh integrasi khusus? Kami melayani pengembangan sistem kustom.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a href="https://wa.me/6285727627146" className="bg-foreground text-background font-black text-lg px-10 py-5 transition-all shadow-[6px_6px_0px_0px_rgba(250,247,241,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(250,247,241,1)] flex items-center justify-center">
                            Mulai 15 Hari Pilot Gratis <ArrowRight className="w-5 h-5 ml-2" />
                        </a>
                        <a href="mailto:hey.aicareer@gmail.com" className="bg-transparent border-2 border-foreground text-foreground font-black text-lg px-10 py-5 hover:bg-foreground hover:text-background transition-colors flex items-center justify-center">
                            Tanya Solusi Kustom
                        </a>
                    </div>
                    <p className="text-foreground/60 text-sm font-black mt-8 uppercase tracking-widest">Tanpa kartu kredit. Setup dibantu penuh.</p>
                </div>
            </section>

            <PublicFooter />
        </div>
    )
}
