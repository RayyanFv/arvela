'use client'

// ──────────────────────────────────────────────────
// MODULE  : Staff OKR Page (Mod 5 — Employee)
// FILE    : app/staff/okrs/page.jsx
// TABLES  : employees, okrs, key_results, initiatives
// ACCESS  : PROTECTED — employee
// SKILL   : baca Arvela/SKILL.md sebelum edit file ini
// ──────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Target, Info, ChevronDown, ChevronUp, Zap, KeyRound, ListChecks } from 'lucide-react'
import { OKRTable } from '@/components/staff/OKRTable'
import { Card } from '@/components/ui/card'

// ─── Penjelasan OKR ───────────────────────────────────────────────────────────
const OKR_CONCEPTS = [
    {
        tag: 'SU',
        tagColor: 'bg-emerald-100 text-emerald-800',
        icon: Target,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50',
        title: 'Sasaran Utama',
        short: 'Tujuan besar yang ingin kita capai',
        detail: 'Sasaran Utama adalah arah yang ingin dituju dalam periode tertentu (misal: 1 kuartal). Ini menjawab pertanyaan "Apa pencapaian terbesar kita periode ini?". Contoh: "Menjadi pilihan utama pelanggan di Jakarta."',
    },
    {
        tag: 'IK',
        tagColor: 'bg-blue-100 text-blue-800',
        icon: KeyRound,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-50',
        title: 'Indikator Keberhasilan',
        short: 'Ukuran angka yang membuktikan sasaran tercapai',
        detail: 'Indikator adalah angka nyata untuk mengukur progres. Setiap sasaran biasanya punya 2-3 indikator. Jika angka ini tercapai, maka Sasaran Utama otomatis dianggap sukses. Contoh: "Skor kepuasan pelanggan mencapai 90" atau "Menyelesaikan 10 project tepat waktu."',
    },
    {
        tag: 'RA',
        tagColor: 'bg-slate-100 text-slate-600',
        icon: ListChecks,
        iconColor: 'text-slate-500',
        iconBg: 'bg-slate-50',
        title: 'Rencana Aksi',
        short: 'Langkah nyata atau tugas yang harus dikerjakan',
        detail: 'Rencana aksi adalah daftar pekerjaan konkret untuk menggerakkan angka indikator. Jika Indikator adalah "Hasil", maka Rencana Aksi adalah "Usaha". Contoh: "Memperbaiki fitur pembayaran", "Melakukan survei ke 20 orang", atau "Riset teknologi baru."',
    },
]

export default function StaffOKRsPage() {
    const [okrs, setOkrs] = useState([])
    const [loading, setLoading] = useState(true)
    const [showGuide, setShowGuide] = useState(false)
    const supabase = createClient()

    async function fetchOKRs() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: emp } = await supabase
            .from('employees')
            .select('id')
            .eq('profile_id', user.id)
            .single()

        if (emp) {
            const { data } = await supabase
                .from('okrs')
                .select('*, key_results(*), initiatives(*)')
                .eq('employee_id', emp.id)
            setOkrs(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchOKRs()

        const channel = supabase.channel('okr-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'key_results' }, fetchOKRs)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'initiatives' }, fetchOKRs)
            .subscribe()

        return () => { channel.unsubscribe() }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (loading) return (
        <div className="p-20 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">Menyiapkan target kinerja...</p>
        </div>
    )

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">
                            Target & <span className="text-primary italic">Rencana Kerja</span>
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm mt-1 max-w-xl">
                            Pantau target kuartal dan update progres indikator secara berkala untuk menjaga performa kerja.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowGuide(v => !v)}
                    className="flex items-center gap-2 px-4 h-9 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-brand-50 transition-all shrink-0"
                >
                    <Info className="w-4 h-4" />
                    Panduan Target
                    {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
            </div>

            {/* ── OKR Guide Panel ── */}
            {showGuide && (
                <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                    {/* Title bar */}
                    <div className="bg-gradient-to-r from-primary/5 to-transparent px-6 py-4 border-b border-border flex items-center justify-between">
                        <div>
                            <h2 className="font-black text-foreground">Sistem Pengukuran Kinerja (Target & Indikator)</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Kami menggunakan sistem pengukuran hasil nyata untuk memastikan setiap usaha memberikan dampak bagi perusahaan.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowGuide(false)}
                            className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground transition-colors"
                        >
                            <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Concept cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                        {OKR_CONCEPTS.map((c) => (
                            <div key={c.tag} className="p-6 space-y-3">
                                {/* Tag + title */}
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded font-black text-xs ${c.tagColor}`}>{c.tag}</span>
                                    <h3 className="font-black text-foreground text-sm">{c.title}</h3>
                                </div>
                                {/* Icon + short */}
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                                        <c.icon className={`w-4 h-4 ${c.iconColor}`} />
                                    </div>
                                    <p className="text-sm font-semibold text-foreground leading-snug">{c.short}</p>
                                </div>
                                {/* Detail */}
                                <p className="text-xs text-muted-foreground leading-relaxed">{c.detail}</p>
                            </div>
                        ))}
                    </div>

                    {/* How it works */}
                    <div className="px-6 py-4 bg-muted/30 border-t border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <Zap className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-black text-foreground">Cara kerja:</span>{' '}
                            Progres <span className="font-bold text-blue-600">Indikator</span> dihitung dari{' '}
                            <code className="bg-muted px-1 rounded text-[10px]">aktual / target × 100%</code>.{' '}
                            Progres <span className="font-bold text-emerald-600">Sasaran Utama</span> dihitung otomatis dari rata-rata seluruh indikator di dalamnya.{' '}
                            <span className="font-bold text-slate-500">Rencana Aksi</span> adalah aktivitas pendukung — tandai SELESAI jika tugas sudah dilakukan.
                        </p>
                    </div>
                </Card>
            )}

            {/* ── Table ── */}
            <OKRTable okrs={okrs} onUpdate={fetchOKRs} />

            {/* ── Cara Kerja (selalu visible, ringkas) ── */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border flex items-start gap-3">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                    <p className="text-xs font-black text-foreground">Cara Kerja Perhitungan Progres</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Progres Sasaran Utama dihitung otomatis dari rata-rata pencapaian seluruh Indikator Keberhasilan.
                        Update nilai <strong>Aktual</strong> pada baris indikator dengan klik angkanya — progres Sasaran akan ikut berubah.
                        Rencana Aksi tidak mempengaruhi persentase, namun mencerminkan usaha nyata Anda di lapangan.
                    </p>
                </div>
            </div>
        </div>
    )
}
