'use client'

// ──────────────────────────────────────────────────
// MODULE  : Dashboard Overview — HR Admin
// FILE    : app/dashboard/components/HRAdminDashboard.jsx
// OPTIMIZATIONS:
//   ✅ Solusi 1 — Profile diterima sebagai prop (no double fetch)
//   ✅ Solusi 3 — Single RPC call ganti 7 query terpisah
//   ✅ Solusi 5 — useMemo untuk semua derived data
//   ✅ Solusi 6 — Single consolidated state object
// ──────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Users, Briefcase, Trophy, TrendingUp,
    ArrowUpRight, GraduationCap, Target,
    CheckCircle2, MapPin, BarChart2, Clock,
    Timer, CalendarDays, Zap, ArrowRight, Info
} from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { StageBadge } from '@/components/candidates/StageBadge'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart'
import {
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
    Cell, PieChart, Pie, Tooltip as RechartsTooltip
} from 'recharts'

// ─── Constants ────────────────────────────────────────────────────────────────
const STAGES = [
    { key: 'applied', label: 'Applied', colorClass: 'bg-slate-300' },
    { key: 'screening', label: 'Screening', colorClass: 'bg-blue-400' },
    { key: 'assessment', label: 'Assessment', colorClass: 'bg-violet-400' },
    { key: 'interview', label: 'Interview', colorClass: 'bg-amber-400' },
    { key: 'offered', label: 'Offered', colorClass: 'bg-orange-400' },
    { key: 'hired', label: 'Hired', colorClass: 'bg-emerald-500' },
]

const DONUT_COLORS = {
    hired: '#10b981',
    process: '#a78bfa',
    active: 'hsl(var(--primary))',
    applied: '#cbd5e1',
}

const weeklyChartConfig = {
    value: { label: 'Pelamar', color: 'hsl(var(--primary))' },
}

// ── Hari dalam bahasa Indonesia sesuai urutan generate_series DB ──────────────
const ID_WEEKDAY = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

// ─── Solusi 6: Single consolidated state, bukan 12 useState terpisah ──────────
const INITIAL_STATE = {
    activeJobs: [],
    recentApps: [],
    stageCounts: {},
    weeklyApps: [],
    jobApplicantCounts: {},
    totalApplicants: 0,
    totalHired: 0,
    totalEmployees: 0,
    okrStats: { total: 0, avgProgress: 0 },
    lmsStats: { courses: 0, published: 0 },
    attendanceStats: { present: 0, early_leave: 0, leave: 0, sick: 0, absent: 0, holiday_present: 0 },
    overtimeStats: { pending: 0, approved: 0, totalHours: 0 },
}

// ─── Component ────────────────────────────────────────────────────────────────
// ── Solusi 1: Terima profile + user dari parent (page.jsx) — no double fetch ──
export function HRAdminDashboard({ profile, user }) {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)

    // ── Solusi 6: Satu state object, bukan 12 ────────────────────────────────
    const [data, setData] = useState(INITIAL_STATE)

    useEffect(() => {
        async function load() {
            // ── Solusi 1: company_id langsung dari prop, tidak perlu re-fetch ──
            const cid = profile?.company_id || user?.user_metadata?.company_id
            if (!cid) { setLoading(false); return }

            // ── Solusi 3: Single RPC call ganti 7 query + semua client loops ──
            const { data: stats, error } = await supabase.rpc(
                'get_hr_dashboard_stats',
                { p_company_id: cid }
            )

            if (error || !stats) {
                console.error('Dashboard RPC error:', error)
                setLoading(false)
                return
            }

            // Parse attendance (RPC returns object keyed by status)
            const att = stats.attendance_today || {}
            const attendanceStats = {
                present:         att.present         || 0,
                early_leave:     att.early_leave     || 0,
                holiday_present: att.holiday_present || 0,
                leave:           att.leave           || 0,
                sick:            att.sick            || 0,
                absent:          att.absent          || 0,
            }

            // Parse weekly apps (DB returns [{date, count}], map to chart format)
            const weeklyApps = (stats.weekly_apps || []).map(w => ({
                label: ID_WEEKDAY[new Date(w.date).getDay()],
                value: w.count || 0,
            }))

            // ── Solusi 6: Single setState — 1 re-render, bukan 10+ ───────────
            setData({
                activeJobs:         (stats.active_jobs || []).slice(0, 5),
                recentApps:         stats.recent_apps  || [],
                stageCounts:        stats.stage_counts || {},
                weeklyApps,
                jobApplicantCounts: stats.job_applicant_counts || {},
                totalApplicants:    stats.total_applicants  || 0,
                totalHired:         stats.total_hired        || 0,
                totalEmployees:     stats.total_employees    || 0,
                okrStats: {
                    total:       stats.okr_stats?.total       || 0,
                    avgProgress: stats.okr_stats?.avg_progress || 0,
                },
                lmsStats: {
                    courses:   stats.lms_stats?.courses   || 0,
                    published: stats.lms_stats?.published  || 0,
                },
                attendanceStats,
                overtimeStats: {
                    pending:    stats.overtime_stats?.pending     || 0,
                    approved:   stats.overtime_stats?.approved    || 0,
                    totalHours: stats.overtime_stats?.total_hours || 0,
                },
            })

            setLoading(false)
        }
        load()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Solusi 5: useMemo — tidak recompute setiap render ────────────────────
    const totalWeekly = useMemo(
        () => data.weeklyApps.reduce((a, d) => a + d.value, 0),
        [data.weeklyApps]
    )

    const funnelMax = useMemo(
        () => Math.max(...STAGES.map(s => data.stageCounts[s.key] ?? 0), 1),
        [data.stageCounts]
    )

    const donutData = useMemo(() => [
        { name: 'Hired',             value: data.stageCounts.hired || 0,                                           color: DONUT_COLORS.hired   },
        { name: 'Interview / Offer', value: (data.stageCounts.interview || 0) + (data.stageCounts.offered || 0),   color: DONUT_COLORS.active  },
        { name: 'Proses',            value: (data.stageCounts.screening || 0) + (data.stageCounts.assessment || 0), color: DONUT_COLORS.process },
        { name: 'Applied',           value: data.stageCounts.applied || 0,                                          color: DONUT_COLORS.applied },
    ], [data.stageCounts])

    const statCards = useMemo(() => [
        { label: 'Lowongan Aktif',  value: data.activeJobs.length,    icon: Briefcase,    color: 'text-blue-500',    bg: 'bg-blue-50',    href: '/dashboard/jobs',       tooltip: 'Jumlah lowongan pekerjaan yang masih terbuka dan sedang menerima pelamar.' },
        { label: 'Total Pelamar',   value: data.totalApplicants,       icon: Users,        color: 'text-primary',     bg: 'bg-brand-50',   href: '/dashboard/candidates', tooltip: 'Total seluruh kandidat yang melamar di semua lowongan perusahaan.' },
        { label: 'Karyawan Aktif',  value: data.totalEmployees,        icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', href: '/dashboard/employees',  tooltip: 'Jumlah karyawan aktif yang terdaftar di dalam sistem saat ini.' },
        { label: 'Total Hired',     value: data.totalHired,            icon: Trophy,       color: 'text-amber-500',   bg: 'bg-amber-50',   href: '/dashboard/candidates', tooltip: 'Jumlah kandidat yang berhasil direkrut dan dipekerjakan melalui platform ini.' },
    ], [data.activeJobs.length, data.totalApplicants, data.totalEmployees, data.totalHired])

    const dateStr = useMemo(
        () => new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        []
    )

    return (
        <div className="space-y-8 pb-24">

            <Breadcrumbs />

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1">{dateStr}</p>
                    <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                        Selamat datang,{' '}
                        <span className="text-primary">{profile?.full_name?.split(' ')[0] ?? 'HR'}</span>
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">{profile?.companies?.name ?? ''} · Panel HR</p>
                </div>
                <Link href="/dashboard/jobs/new">
                    <Button className="h-10 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm gap-2 shadow-sm shrink-0">
                        + Buat Lowongan
                    </Button>
                </Link>
            </div>

            {/* ── Quick Actions ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Buat Lowongan',      href: '/dashboard/jobs/new',    icon: Briefcase, gradient: 'from-blue-500 to-indigo-600' },
                    { label: 'Lihat Kandidat',      href: '/dashboard/candidates',  icon: Users,     gradient: 'from-primary to-orange-500' },
                    { label: 'Kelola Lembur',       href: '/dashboard/overtime',    icon: Timer,     gradient: 'from-violet-500 to-purple-600' },
                    { label: 'Monitor Kehadiran',   href: '/dashboard/attendance',  icon: Clock,     gradient: 'from-emerald-500 to-teal-600' },
                ].map(action => (
                    <Link key={action.href} href={action.href}>
                        <div className="group relative overflow-hidden rounded-2xl p-4 bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                            <div className={`absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br ${action.gradient} rounded-full opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all`} />
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3`}>
                                <action.icon className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{action.label}</p>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 absolute top-4 right-4 group-hover:translate-x-0.5 transition-all" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                {statCards.map((s, i) => (
                    <Tooltip key={i}>
                        <TooltipTrigger asChild>
                            <Link href={s.href} className="block">
                                <Card className="p-6 border-none shadow-sm rounded-3xl hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-5">
                                    <div className={`w-14 h-14 ${s.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                                        <s.icon className={`w-6 h-6 ${s.color}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none truncate">{s.label}</p>
                                        </div>
                                        {loading
                                            ? <Skeleton className="h-8 w-14" />
                                            : <p className="text-3xl font-black text-foreground">{s.value}</p>
                                        }
                                    </div>
                                </Card>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[200px] text-center bg-slate-800 text-white font-medium">
                            <p>{s.tooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                {/* Weekly Bar */}
                <Card className="p-8 border-none shadow-sm rounded-3xl lg:col-span-1 !overflow-visible relative">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="absolute top-8 right-8 cursor-help">
                                <Info className="w-4 h-4 text-slate-300 hover:text-primary transition-colors" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px] text-center p-3 bg-slate-800 text-white font-medium text-xs leading-relaxed">
                            Grafik jumlah pelamar baru yang mendaftar ke lowongan perusahaan Anda dalam 7 hari terakhir.
                        </TooltipContent>
                    </Tooltip>

                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Pelamar 7 Hari Terakhir</p>
                            {loading
                                ? <Skeleton className="h-10 w-20" />
                                : <p className="text-4xl font-black text-foreground">{totalWeekly}</p>
                            }
                        </div>
                        <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center mr-6">
                            <BarChart2 className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    {loading
                        ? <Skeleton className="h-[120px] w-full" />
                        : (
                            <ChartContainer config={weeklyChartConfig} className="h-[120px] w-full">
                                <BarChart data={data.weeklyApps} barSize={22} margin={{ top: 8, right: 0, left: -32, bottom: 0 }}>
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fontWeight: 700 }}
                                    />
                                    <YAxis hide allowDecimals={false} />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))">
                                        {data.weeklyApps.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fillOpacity={data.weeklyApps.length > 1 ? 0.3 + (i / (data.weeklyApps.length - 1)) * 0.7 : 1}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        )
                    }
                </Card>

                {/* Pipeline Donut */}
                <Card className="p-8 border-none shadow-sm rounded-3xl lg:col-span-1 !overflow-visible relative">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="absolute top-8 right-8 cursor-help">
                                <Info className="w-4 h-4 text-slate-300 hover:text-primary transition-colors" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px] text-center p-3 bg-slate-800 text-white font-medium text-xs leading-relaxed">
                            Proporsi kandidat di berbagai tahap seleksi rekrutmen saat ini.
                        </TooltipContent>
                    </Tooltip>

                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Distribusi Pipeline</p>
                    {loading
                        ? <div className="flex gap-6 items-center"><Skeleton className="w-28 h-28 rounded-full" /><Skeleton className="flex-1 h-24" /></div>
                        : (
                            <div className="flex items-center gap-4">
                                <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
                                    <ResponsiveContainer width={120} height={120}>
                                        <PieChart>
                                            <Pie
                                                data={donutData}
                                                cx={55} cy={55}
                                                innerRadius={38}
                                                outerRadius={52}
                                                dataKey="value"
                                                strokeWidth={0}
                                                paddingAngle={2}
                                            >
                                                {donutData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null
                                                    const d = payload[0]
                                                    return (
                                                        <div className="bg-background border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
                                                            <p className="font-bold text-foreground">{d.name}</p>
                                                            <p className="text-muted-foreground">{d.value} orang</p>
                                                        </div>
                                                    )
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <p className="text-xl font-black text-foreground leading-none">{data.totalApplicants}</p>
                                        <p className="text-[9px] text-muted-foreground font-bold mt-0.5">total</p>
                                    </div>
                                </div>
                                <div className="space-y-3 flex-1">
                                    {donutData.map((row, i) => (
                                        <div key={i} className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                                            <span className="text-sm font-medium text-muted-foreground flex-1 truncate">{row.name}</span>
                                            <span className="text-sm font-black text-foreground">{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    }
                </Card>

                {/* Quick Stats Cards */}
                <div className="space-y-6 lg:col-span-1">
                    <Link href="/dashboard/performance">
                        <Card className="p-6 border-none shadow-sm rounded-3xl hover:shadow-md transition-all cursor-pointer relative group">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute top-6 right-6 cursor-help z-10">
                                        <Info className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[200px] text-center p-3 bg-slate-800 text-white font-medium text-xs leading-relaxed">
                                    Rata-rata progres penyelesaian dari seluruh target OKR aktif karyawan saat ini.
                                </TooltipContent>
                            </Tooltip>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Target className="w-5 h-5 text-amber-500" />
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target & Performa</p>
                            </div>
                            {loading ? <Skeleton className="h-12 w-full" /> : (
                                <>
                                    <p className="text-xl font-black text-foreground mb-3">
                                        {data.okrStats.total} <span className="text-sm font-semibold text-muted-foreground">sasaran aktif</span>
                                    </p>
                                    <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1.5">
                                        <span>Progres Rata-rata</span><span>{data.okrStats.avgProgress}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${data.okrStats.avgProgress}%` }} />
                                    </div>
                                </>
                            )}
                        </Card>
                    </Link>

                    <Link href="/dashboard/attendance">
                        <Card className="p-6 border-none shadow-sm rounded-3xl hover:shadow-md transition-all cursor-pointer relative group">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute top-6 right-6 cursor-help z-10">
                                        <Info className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition-colors" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[200px] text-center p-3 bg-slate-800 text-white font-medium text-xs leading-relaxed">
                                    Rekapitulasi absensi seluruh karyawan aktif pada hari ini.
                                </TooltipContent>
                            </Tooltip>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Clock className="w-5 h-5 text-rose-500" />
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Kehadiran Hari Ini</p>
                            </div>
                            {loading ? <Skeleton className="h-12 w-full" /> : (
                                <div className="flex items-end gap-6">
                                    <div>
                                        <p className="text-2xl font-black text-emerald-500">{data.attendanceStats.present + data.attendanceStats.early_leave + data.attendanceStats.holiday_present}</p>
                                        <p className="text-xs font-bold text-muted-foreground">Hadir</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-amber-500">{data.attendanceStats.leave + data.attendanceStats.sick}</p>
                                        <p className="text-xs font-bold text-muted-foreground">Cuti</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-rose-500">{data.attendanceStats.absent}</p>
                                        <p className="text-xs font-bold text-muted-foreground">Alpa</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </Link>

                    <Link href="/dashboard/overtime">
                        <Card className="p-6 border-none shadow-sm rounded-3xl hover:shadow-md transition-all cursor-pointer relative overflow-hidden group">
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full opacity-5 group-hover:opacity-10 transition-opacity" />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute top-6 right-6 cursor-help z-10">
                                        <Info className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[200px] text-center p-3 bg-slate-800 text-white font-medium text-xs leading-relaxed">
                                    Data pengajuan lembur karyawan yang disetujui beserta ringkasan jam kerja yang belum dibayar/di-review.
                                </TooltipContent>
                            </Tooltip>
                            <div className="flex items-center gap-3 mb-4 z-10 relative">
                                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Timer className="w-5 h-5 text-violet-500" />
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Lembur</p>
                                {data.overtimeStats.pending > 0 && (
                                    <Badge className="ml-2 bg-amber-100 text-amber-700 border-amber-200 border text-[10px] font-black rounded-lg px-2 py-0.5">
                                        {data.overtimeStats.pending} Pending
                                    </Badge>
                                )}
                            </div>
                            {loading ? <Skeleton className="h-12 w-full" /> : (
                                <div className="flex items-end gap-6">
                                    <div>
                                        <p className="text-2xl font-black text-violet-600">{data.overtimeStats.approved}</p>
                                        <p className="text-xs font-bold text-muted-foreground">Disetujui</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-foreground">{Number(data.overtimeStats.totalHours).toFixed(0)}<span className="text-sm text-muted-foreground font-semibold">h</span></p>
                                        <p className="text-xs font-bold text-muted-foreground">Total Jam</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </Link>
                </div>
            </div>

            {/* ── Pipeline Funnel ── */}
            <Card className="p-6 border-none shadow-sm rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="font-black text-foreground">Pipeline Rekrutmen</h2>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">Distribusi kandidat per stage saat ini</p>
                    </div>
                    <Link href="/dashboard/candidates">
                        <Button variant="ghost" size="sm" className="text-primary font-bold rounded-xl gap-1 hover:bg-brand-50">
                            Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                    </Link>
                </div>
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-7" />)}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {STAGES.map(stage => {
                            const count = data.stageCounts[stage.key] ?? 0
                            const pct = (count / funnelMax) * 100
                            return (
                                <div key={stage.key} className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-muted-foreground w-20 text-right uppercase tracking-wider shrink-0">{stage.label}</span>
                                    <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden">
                                        <div
                                            className={`h-full ${stage.colorClass} rounded-lg transition-all duration-700`}
                                            style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-black text-foreground w-8 text-right shrink-0">{count}</span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </Card>

            {/* ── Bottom: Pelamar + Lowongan ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Pelamar Terbaru */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-black text-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" /> Pelamar Terbaru
                        </h2>
                        <Link href="/dashboard/candidates">
                            <Button variant="ghost" size="sm" className="text-primary font-bold rounded-xl hover:bg-brand-50">
                                Lihat Semua
                            </Button>
                        </Link>
                    </div>
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                        {loading ? (
                            <div className="p-5 space-y-4">
                                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                            </div>
                        ) : data.recentApps.length === 0 ? (
                            <div className="py-16 text-center">
                                <Users className="w-10 h-10 text-muted mx-auto mb-3" />
                                <p className="text-sm font-bold text-muted-foreground">Belum ada pelamar</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {data.recentApps.map((app) => (
                                    <div key={app.id} className="px-5 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors group">
                                        <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center font-black text-muted-foreground text-sm shrink-0 group-hover:bg-brand-50 group-hover:text-primary transition-colors">
                                            {app.full_name?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-foreground text-sm truncate">{app.full_name}</h4>
                                            <p className="text-xs text-muted-foreground truncate">{app.jobs?.title}</p>
                                        </div>
                                        <div className="hidden sm:block shrink-0">
                                            <StageBadge stage={app.stage} />
                                        </div>
                                        <Link href={`/dashboard/candidates/${app.id}`}>
                                            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0 rounded-xl text-muted-foreground hover:text-primary hover:bg-brand-50">
                                                <ArrowUpRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Lowongan Aktif */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-black text-foreground flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary" /> Lowongan Aktif
                        </h2>
                        <Link href="/dashboard/jobs">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary rounded-xl">
                                Semua <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {loading
                            ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
                            : data.activeJobs.length === 0 ? (
                                <Card className="py-12 text-center border-dashed border-2 border-border shadow-none rounded-2xl">
                                    <Briefcase className="w-8 h-8 text-muted mx-auto mb-2" />
                                    <p className="text-sm font-bold text-muted-foreground">Tidak ada lowongan aktif</p>
                                </Card>
                            ) : data.activeJobs.map(job => (
                                <Link key={job.id} href={`/dashboard/jobs/${job.id}`}>
                                    <Card className="p-4 border-none shadow-sm rounded-2xl hover:-translate-y-0.5 hover:shadow-md transition-all group mb-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors flex-1">{job.title}</h4>
                                            <div className="flex items-center gap-1 bg-brand-50 text-primary rounded-lg px-2 py-1 shrink-0">
                                                <Users className="w-3 h-3" />
                                                <span className="text-[10px] font-black">{data.jobApplicantCounts[job.id] ?? 0}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 truncate">
                                                <MapPin className="w-3 h-3 shrink-0" />{job.location}
                                            </span>
                                            <Badge variant="secondary" className="bg-muted text-muted-foreground border-none text-[9px] font-black uppercase shrink-0 ml-auto">
                                                {job.work_type}
                                            </Badge>
                                        </div>
                                    </Card>
                                </Link>
                            ))
                        }
                    </div>
                    <Link href="/dashboard/jobs/new" className="block pt-1">
                        <Button className="w-full h-11 rounded-xl bg-foreground hover:bg-foreground/90 text-background font-bold">
                            + Buat Lowongan Baru
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
