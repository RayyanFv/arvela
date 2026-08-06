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
    ArrowUpRight, Target,
    CheckCircle2, MapPin, Clock,
    Timer, Zap, Info, PlaneTakeoff, CalendarClock
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
import { CompanyQuotaWidget } from '@/components/layout/CompanyQuotaWidget'
import { getPendingApprovals } from '@/lib/actions/notifications'
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
    whosOff: [],
}

// ─── Component ────────────────────────────────────────────────────────────────
// ── Solusi 1: Terima profile + user dari parent (page.jsx) — no double fetch ──
export function HRAdminDashboard({ profile, user }) {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)

    // ── Solusi 6: Satu state object, bukan 12 ────────────────────────────────
    const [data, setData] = useState(INITIAL_STATE)
    const [pendingApprovals, setPendingApprovals] = useState({ items: [], totalCount: 0 })

    useEffect(() => {
        getPendingApprovals({ limit: 4 }).then(setPendingApprovals).catch(() => { })
    }, [])

    useEffect(() => {
        async function load() {
            // ── Solusi 1: company_id langsung dari prop, tidak perlu re-fetch ──
            const cid = profile?.company_id || user?.user_metadata?.company_id
            if (!cid) { setLoading(false); return }

            // ── Solusi 3: Single RPC call ganti 7 query + semua client loops ──
            const { data: stats, error } = await supabase.rpc('get_hr_dashboard_stats', { p_company_id: cid })

            let statsData = stats
            if (error || !statsData) {
                // Graceful fallback to direct queries if RPC is not available
                const [empCountRes, jobsRes, appsRes] = await Promise.all([
                    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('company_id', cid),
                    supabase.from('jobs').select('id, title, work_type, location').eq('company_id', cid).eq('status', 'published').order('created_at', { ascending: false }),
                    supabase.from('applications').select('id, stage, created_at, full_name, job_id').eq('company_id', cid).order('created_at', { ascending: false }).limit(6)
                ])

                statsData = {
                    total_employees: empCountRes.count || 0,
                    active_jobs: jobsRes.data || [],
                    recent_apps: appsRes.data || [],
                    total_applicants: (appsRes.data || []).length,
                    weekly_apps: [],
                    attendance_today: {},
                    stage_counts: {},
                    job_applicant_counts: {},
                    okr_stats: { total: 0, avg_progress: 0 },
                    lms_stats: { courses: 0, published: 0 },
                    overtime_stats: { pending: 0, approved: 0, total_hours: 0 }
                }
            }

            // Parse attendance (RPC returns object keyed by status)
            const att = statsData.attendance_today || {}
            const attendanceStats = {
                present: att.present || 0,
                early_leave: att.early_leave || 0,
                holiday_present: att.holiday_present || 0,
                leave: att.leave || 0,
                sick: att.sick || 0,
                absent: att.absent || 0,
            }

            // Parse weekly apps (DB returns [{date, count}], map to chart format)
            const weeklyApps = (statsData.weekly_apps || []).map(w => ({
                label: ID_WEEKDAY[new Date(w.date).getDay()],
                value: w.count || 0,
            }))

            // ── Solusi 6: Single setState — 1 re-render, bukan 10+ ───────────
            setData({
                activeJobs: (statsData.active_jobs || []).slice(0, 5),
                recentApps: statsData.recent_apps || [],
                stageCounts: statsData.stage_counts || {},
                weeklyApps,
                jobApplicantCounts: statsData.job_applicant_counts || {},
                totalApplicants: statsData.total_applicants || 0,
                totalHired: statsData.total_hired || 0,
                totalEmployees: statsData.total_employees || 0,
                okrStats: {
                    total: statsData.okr_stats?.total || 0,
                    avgProgress: statsData.okr_stats?.avg_progress || 0,
                },
                lmsStats: {
                    courses: statsData.lms_stats?.courses || 0,
                    published: statsData.lms_stats?.published || 0,
                },
                attendanceStats,
                overtimeStats: {
                    pending: statsData.overtime_stats?.pending || 0,
                    approved: statsData.overtime_stats?.approved || 0,
                    totalHours: statsData.overtime_stats?.total_hours || 0,
                },
                whosOff: statsData.whos_off || [],
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
        { name: 'Hired', value: data.stageCounts.hired || 0, color: DONUT_COLORS.hired },
        { name: 'Interview / Offer', value: (data.stageCounts.interview || 0) + (data.stageCounts.offered || 0), color: DONUT_COLORS.active },
        { name: 'Proses', value: (data.stageCounts.screening || 0) + (data.stageCounts.assessment || 0), color: DONUT_COLORS.process },
        { name: 'Applied', value: data.stageCounts.applied || 0, color: DONUT_COLORS.applied },
    ], [data.stageCounts])

    const statCards = useMemo(() => [
        { label: 'Lowongan Aktif', value: data.activeJobs.length, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50', href: '/dashboard/jobs', tooltip: 'Jumlah lowongan pekerjaan yang masih terbuka dan sedang menerima pelamar.' },
        { label: 'Total Pelamar', value: data.totalApplicants, icon: Users, color: 'text-primary', bg: 'bg-brand-50', href: '/dashboard/candidates', tooltip: 'Total seluruh kandidat yang melamar di semua lowongan perusahaan.' },
        { label: 'Karyawan Aktif', value: data.totalEmployees, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', href: '/dashboard/employees', tooltip: 'Jumlah karyawan aktif yang terdaftar di dalam sistem saat ini.' },
        { label: 'Total Hired', value: data.totalHired, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50', href: '/dashboard/candidates', tooltip: 'Jumlah kandidat yang berhasil direkrut dan dipekerjakan melalui platform ini.' },
    ], [data.activeJobs.length, data.totalApplicants, data.totalEmployees, data.totalHired])

    const dateStr = useMemo(
        () => new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        []
    )

    return (
        <div className="space-y-6 pb-24">

            <Breadcrumbs />

            {/* ── Header / Greeting Card ── */}
            <Card className="p-6 rounded-md">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">{dateStr}</p>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                            Selamat datang,{' '}
                            <span className="text-primary">{profile?.full_name?.split(' ')[0] ?? 'HR'}</span>
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">{profile?.companies?.name ?? ''} · Panel HR</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <Link href="/dashboard/attendance">
                            <Button variant="outline" className="h-10 rounded-md font-semibold gap-2">
                                <Clock className="w-4 h-4" /> Pantau Kehadiran
                            </Button>
                        </Link>
                        <Link href="/dashboard/attendance/requests">
                            <Button variant="outline" className="h-10 rounded-md font-semibold gap-2">
                                <PlaneTakeoff className="w-4 h-4" /> Kelola Cuti
                            </Button>
                        </Link>
                        <Link href="/dashboard/overtime">
                            <Button variant="outline" className="h-10 rounded-md font-semibold gap-2">
                                <Timer className="w-4 h-4" /> Kelola Lembur
                            </Button>
                        </Link>
                        <Link href="/dashboard/jobs/new">
                            <Button className="h-10 px-5 rounded-md bg-primary text-primary-foreground font-semibold text-sm gap-2 shrink-0">
                                + Buat Lowongan
                            </Button>
                        </Link>
                    </div>
                </div>
            </Card>

            {/* ── Quota & Subscription Widget ── */}
            <CompanyQuotaWidget companyId={profile?.company_id} />

            {/* ── Perlu Persetujuan (actionable, prioritas tertinggi) ── */}
            {pendingApprovals.totalCount > 0 && (
                <Card className="p-6 rounded-md border-amber-200 bg-amber-50/40">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-bold text-foreground flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" /> Perlu Persetujuan
                            </h2>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5">{pendingApprovals.totalCount} pengajuan karyawan menunggu tindakan Anda</p>
                        </div>
                        <Link href="/dashboard/attendance/requests">
                            <Button variant="ghost" size="sm" className="text-primary font-semibold rounded-md gap-1 hover:bg-white">
                                Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        {pendingApprovals.items.map(item => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="flex items-center gap-3 p-3 bg-white border border-amber-100 rounded-md hover:border-amber-300 transition-colors"
                            >
                                <div className="w-9 h-9 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-foreground truncate">{item.label}</p>
                                    <p className="text-xs text-muted-foreground truncate">{item.employeeName}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </Card>
            )}

            {/* ── Yang Sedang / Akan Cuti Minggu Ini ── */}
            <Card className="p-6 rounded-md">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-foreground flex items-center gap-2">
                        <CalendarClock className="w-4 h-4 text-violet-500" /> Cuti Minggu Ini
                    </h2>
                </div>
                {loading ? (
                    <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                ) : data.whosOff.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Tidak ada karyawan yang cuti minggu ini.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {data.whosOff.map(item => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-md">
                                <div className="w-9 h-9 rounded-full bg-brand-50 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                                    {item.avatar_url ? <img src={item.avatar_url} alt="" className="w-full h-full object-cover" /> : item.employee_name?.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-foreground truncate">{item.employee_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {item.reason_label} · {new Date(item.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        {item.start_date !== item.end_date && ` – ${new Date(item.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* ── Stat Cards (doubles as quick-nav) ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((s, i) => (
                    <Tooltip key={i}>
                        <TooltipTrigger asChild>
                            <Link href={s.href} className="block">
                                <Card className="p-5 rounded-md hover:border-slate-300 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 ${s.bg} rounded-md flex items-center justify-center shrink-0`}>
                                            <s.icon className={`w-5 h-5 ${s.color}`} />
                                        </div>
                                        <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-widest leading-tight">{s.label}</p>
                                    </div>
                                    {loading
                                        ? <Skeleton className="h-7 w-14" />
                                        : <p className="text-2xl font-bold text-foreground">{s.value}</p>
                                    }
                                </Card>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[200px] text-center bg-slate-800 text-white font-medium">
                            <p>{s.tooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>

            {/* ── Ringkasan Operasional: OKR, Kehadiran, Lembur — sejajar dalam satu baris ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/dashboard/performance">
                    <Card className="p-5 rounded-md hover:border-slate-300 transition-colors cursor-pointer relative group h-full">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="absolute top-5 right-5 cursor-help z-10">
                                    <Info className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[200px] text-center p-3 bg-slate-800 text-white font-medium text-xs leading-relaxed">
                                Rata-rata progres penyelesaian dari seluruh target OKR aktif karyawan saat ini.
                            </TooltipContent>
                        </Tooltip>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-amber-50 rounded-md flex items-center justify-center shrink-0">
                                <Target className="w-5 h-5 text-amber-500" />
                            </div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Target & Performa</p>
                        </div>
                        {loading ? <Skeleton className="h-12 w-full" /> : (
                            <>
                                <p className="text-xl font-bold text-foreground mb-3">
                                    {data.okrStats.total} <span className="text-sm font-medium text-muted-foreground">sasaran aktif</span>
                                </p>
                                <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1.5">
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
                    <Card className="p-5 rounded-md hover:border-slate-300 transition-colors cursor-pointer relative group h-full">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="absolute top-5 right-5 cursor-help z-10">
                                    <Info className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition-colors" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[200px] text-center p-3 bg-slate-800 text-white font-medium text-xs leading-relaxed">
                                Rekapitulasi absensi seluruh karyawan aktif pada hari ini.
                            </TooltipContent>
                        </Tooltip>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-rose-50 rounded-md flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-rose-500" />
                            </div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Kehadiran Hari Ini</p>
                        </div>
                        {loading ? <Skeleton className="h-12 w-full" /> : (
                            <div className="flex items-end gap-5">
                                <div>
                                    <p className="text-2xl font-bold text-emerald-500">{data.attendanceStats.present + data.attendanceStats.early_leave + data.attendanceStats.holiday_present}</p>
                                    <p className="text-xs font-medium text-muted-foreground">Hadir</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-amber-500">{data.attendanceStats.leave + data.attendanceStats.sick}</p>
                                    <p className="text-xs font-medium text-muted-foreground">Cuti</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-rose-500">{data.attendanceStats.absent}</p>
                                    <p className="text-xs font-medium text-muted-foreground">Alpa</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </Link>

                <Link href="/dashboard/overtime">
                    <Card className="p-5 rounded-md hover:border-slate-300 transition-colors cursor-pointer relative group h-full">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="absolute top-5 right-5 cursor-help z-10">
                                    <Info className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[200px] text-center p-3 bg-slate-800 text-white font-medium text-xs leading-relaxed">
                                Data pengajuan lembur karyawan yang disetujui beserta ringkasan jam kerja yang belum dibayar/di-review.
                            </TooltipContent>
                        </Tooltip>
                        <div className="flex items-center gap-3 mb-4 z-10 relative">
                            <div className="w-10 h-10 bg-violet-50 rounded-md flex items-center justify-center shrink-0">
                                <Timer className="w-5 h-5 text-violet-500" />
                            </div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Lembur</p>
                            {data.overtimeStats.pending > 0 && (
                                <Badge className="ml-1 bg-amber-100 text-amber-700 border-amber-200 border text-[10px] font-bold rounded-md px-2 py-0.5">
                                    {data.overtimeStats.pending} Pending
                                </Badge>
                            )}
                        </div>
                        {loading ? <Skeleton className="h-12 w-full" /> : (
                            <div className="flex items-end gap-5">
                                <div>
                                    <p className="text-2xl font-bold text-violet-600">{data.overtimeStats.approved}</p>
                                    <p className="text-xs font-medium text-muted-foreground">Disetujui</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{Number(data.overtimeStats.totalHours).toFixed(0)}<span className="text-sm text-muted-foreground font-medium">h</span></p>
                                    <p className="text-xs font-medium text-muted-foreground">Total Jam</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </Link>
            </div>

            {/* ── Pipeline Rekrutmen + Tren Pelamar ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Pipeline Funnel — minimal, thin bars */}
                <Card className="p-6 rounded-md lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="font-bold text-foreground text-sm">Pipeline Rekrutmen</h2>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5">Distribusi kandidat per stage saat ini</p>
                        </div>
                        <Link href="/dashboard/candidates">
                            <Button variant="ghost" size="sm" className="text-primary font-semibold rounded-md gap-1 hover:bg-brand-50">
                                Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4" />)}
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {STAGES.map(stage => {
                                const count = data.stageCounts[stage.key] ?? 0
                                const pct = (count / funnelMax) * 100
                                return (
                                    <div key={stage.key} className="flex items-center gap-3">
                                        <span className="text-[10px] font-semibold text-muted-foreground w-[70px] text-right uppercase tracking-wider shrink-0">{stage.label}</span>
                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${stage.colorClass} rounded-full transition-all duration-700`}
                                                style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-foreground w-5 text-right shrink-0">{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </Card>

                {/* Tren Pelamar — donut + weekly bar, own card with room to breathe */}
                <Card className="p-6 rounded-md">
                    <p className="text-sm font-bold text-foreground mb-1">Tren Pelamar</p>
                    <p className="text-xs font-medium text-muted-foreground mb-5">7 hari terakhir</p>

                    {loading ? (
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-24 h-24 rounded-full shrink-0" />
                            <Skeleton className="flex-1 h-16" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 mb-5">
                            <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
                                <ResponsiveContainer width={96} height={96}>
                                    <PieChart>
                                        <Pie
                                            data={donutData}
                                            cx={44} cy={44}
                                            innerRadius={30}
                                            outerRadius={42}
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
                                                    <div className="bg-background border border-border rounded-md px-3 py-2 shadow-xl text-xs">
                                                        <p className="font-bold text-foreground">{d.name}</p>
                                                        <p className="text-muted-foreground">{d.value} orang</p>
                                                    </div>
                                                )
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-lg font-bold text-foreground leading-none">{data.totalApplicants}</p>
                                    <p className="text-[9px] text-muted-foreground font-medium mt-0.5">total</p>
                                </div>
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-0">
                                {donutData.map((row, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                                        <span className="text-xs font-medium text-muted-foreground flex-1 truncate">{row.name}</span>
                                        <span className="text-xs font-bold text-foreground">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-border">
                        <div className="flex items-baseline justify-between mb-2">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Pelamar Baru</p>
                            {loading
                                ? <Skeleton className="h-5 w-8" />
                                : <p className="text-lg font-bold text-foreground">{totalWeekly}</p>
                            }
                        </div>
                        {loading
                            ? <Skeleton className="h-[70px] w-full" />
                            : (
                                <ChartContainer config={weeklyChartConfig} className="h-[70px] w-full">
                                    <BarChart data={data.weeklyApps} barSize={20} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fontWeight: 600 }}
                                        />
                                        <YAxis hide allowDecimals={false} />
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent hideLabel />}
                                        />
                                        <Bar dataKey="value" radius={[3, 3, 0, 0]} fill="hsl(var(--primary))">
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
                    </div>
                </Card>
            </div>

            {/* ── Bottom: Pelamar + Lowongan ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Pelamar Terbaru */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" /> Pelamar Terbaru
                        </h2>
                        <Link href="/dashboard/candidates">
                            <Button variant="ghost" size="sm" className="text-primary font-semibold rounded-md hover:bg-brand-50">
                                Lihat Semua
                            </Button>
                        </Link>
                    </div>
                    <Card className="rounded-md overflow-hidden">
                        {loading ? (
                            <div className="p-5 space-y-4">
                                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                            </div>
                        ) : data.recentApps.length === 0 ? (
                            <div className="py-16 text-center">
                                <Users className="w-10 h-10 text-muted mx-auto mb-3" />
                                <p className="text-sm font-semibold text-muted-foreground">Belum ada pelamar</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {data.recentApps.map((app) => (
                                    <div key={app.id} className="px-5 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors group">
                                        <div className="w-9 h-9 bg-muted rounded-md flex items-center justify-center font-bold text-muted-foreground text-sm shrink-0 group-hover:bg-brand-50 group-hover:text-primary transition-colors">
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
                                            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0 rounded-md text-muted-foreground hover:text-primary hover:bg-brand-50">
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
                        <h2 className="font-bold text-foreground flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary" /> Lowongan Aktif
                        </h2>
                        <Link href="/dashboard/jobs">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary rounded-md">
                                Semua <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {loading
                            ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)
                            : data.activeJobs.length === 0 ? (
                                <Card className="py-12 text-center border-dashed border-2 border-border shadow-none rounded-md">
                                    <Briefcase className="w-8 h-8 text-muted mx-auto mb-2" />
                                    <p className="text-sm font-semibold text-muted-foreground">Tidak ada lowongan aktif</p>
                                </Card>
                            ) : data.activeJobs.map(job => (
                                <Link key={job.id} href={`/dashboard/jobs/${job.id}`}>
                                    <Card className="p-4 rounded-md hover:border-slate-300 transition-colors group mb-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors flex-1">{job.title}</h4>
                                            <div className="flex items-center gap-1 bg-brand-50 text-primary rounded-md px-2 py-1 shrink-0">
                                                <Users className="w-3 h-3" />
                                                <span className="text-[10px] font-bold">{data.jobApplicantCounts[job.id] ?? 0}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 truncate">
                                                <MapPin className="w-3 h-3 shrink-0" />{job.location}
                                            </span>
                                            <Badge variant="secondary" className="bg-muted text-muted-foreground border-none text-[9px] font-semibold uppercase shrink-0 ml-auto">
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
