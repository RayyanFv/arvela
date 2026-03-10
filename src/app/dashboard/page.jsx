'use client'

// ──────────────────────────────────────────────────
// MODULE  : Dashboard Overview (Mod 0)
// FILE    : app/dashboard/page.jsx
// TABLES  : profiles, companies, jobs, applications, employees, okrs, lms_courses
// ACCESS  : PROTECTED — hr, super_admin
// SKILL   : baca Arvela/SKILL.md sebelum edit file ini
// ──────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Users, Briefcase, Trophy, TrendingUp,
    ArrowUpRight, GraduationCap, Target,
    CheckCircle2, MapPin, BarChart2, Clock
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { StageBadge } from '@/components/candidates/StageBadge'
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart'
import {
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
    Cell, PieChart, Pie, Tooltip
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

// ─── Chart Configs ────────────────────────────────────────────────────────────
const weeklyChartConfig = {
    value: { label: 'Pelamar', color: 'hsl(var(--primary))' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HRDashboardOverview() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState(null)
    const [stats, setStats] = useState({ totalJobs: 0, totalApplicants: 0, totalEmployees: 0, totalHired: 0 })
    const [recentApps, setRecentApps] = useState([])
    const [activeJobs, setActiveJobs] = useState([])
    const [stageCounts, setStageCounts] = useState({})
    const [weeklyApps, setWeeklyApps] = useState([])
    const [okrStats, setOkrStats] = useState({ total: 0, avgProgress: 0 })
    const [lmsStats, setLmsStats] = useState({ courses: 0, published: 0 })
    const [jobApplicantCounts, setJobApplicantCounts] = useState({})
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, early_leave: 0, leave: 0, sick: 0, absent: 0, holiday_present: 0 })

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            const { data: prof } = await supabase
                .from('profiles').select('*, companies(name)').eq('id', user.id).single()
            setProfile(prof)
            const cid = prof?.company_id
            if (!cid) { setLoading(false); return }

            const [jobsRes, appsRes, empRes, okrsRes, coursesRes, attRes] = await Promise.all([
                supabase.from('jobs')
                    .select('id, title, work_type, location')
                    .eq('company_id', cid).eq('status', 'published')
                    .order('created_at', { ascending: false }),
                supabase.from('applications')
                    .select('id, job_id, stage, created_at, full_name, jobs(id, title, company_id)')
                    .order('created_at', { ascending: false }),
                supabase.from('employees')
                    .select('id', { count: 'exact', head: true }).eq('company_id', cid),
                supabase.from('okrs')
                    .select('id, total_progress, employees(company_id)'),
                supabase.from('lms_courses')
                    .select('id, status').eq('company_id', cid),
                supabase.from('attendances')
                    .select('status')
                    .eq('company_id', cid)
                    .eq('date', new Date().toLocaleDateString('en-CA')),
            ])

            const jobs = jobsRes.data || []
            const allApps = (appsRes.data || []).filter(a => a.jobs?.company_id === cid)

            setStats({
                totalJobs: jobs.length,
                totalApplicants: allApps.length,
                totalEmployees: empRes.count || 0,
                totalHired: allApps.filter(a => a.stage === 'hired').length,
            })
            setRecentApps(allApps.slice(0, 6))

            // Stage counts
            const stageMap = {}
            STAGES.forEach(s => { stageMap[s.key] = 0 })
            allApps.forEach(a => { if (stageMap[a.stage] !== undefined) stageMap[a.stage]++ })
            setStageCounts(stageMap)

            // Applicants per job
            const jobCounts = {}
            jobs.forEach(j => { jobCounts[j.id] = 0 })
            allApps.forEach(a => {
                const jid = a.jobs?.id || a.job_id
                if (jid) jobCounts[jid] = (jobCounts[jid] || 0) + 1
            })
            setJobApplicantCounts(jobCounts)
            setActiveJobs(jobs.slice(0, 5))

            // Weekly (last 7 days)
            const now = new Date()
            const weekly = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(now)
                d.setDate(d.getDate() - (6 - i))
                return {
                    label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
                    value: allApps.filter(a => new Date(a.created_at).toDateString() === d.toDateString()).length
                }
            })
            setWeeklyApps(weekly)

            // OKR
            const companyOkrs = (okrsRes.data || []).filter(o => o.employees?.company_id === cid)
            const avgProgress = companyOkrs.length
                ? Math.round(companyOkrs.reduce((a, o) => a + (o.total_progress || 0), 0) / companyOkrs.length) : 0
            setOkrStats({ total: companyOkrs.length, avgProgress })

            // LMS
            const courses = coursesRes.data || []
            setLmsStats({ courses: courses.length, published: courses.filter(c => c.status === 'published').length })

            // Attendance
            const atts = attRes.data || []
            const attMap = { present: 0, early_leave: 0, leave: 0, sick: 0, absent: 0, holiday_present: 0 }
            atts.forEach(a => { if (attMap[a.status] !== undefined) attMap[a.status]++ })
            setAttendanceStats(attMap)

            setLoading(false)
        }
        load()
    }, [])

    // Derived
    const totalWeekly = weeklyApps.reduce((a, d) => a + d.value, 0)
    const funnelMax = Math.max(...STAGES.map(s => stageCounts[s.key] ?? 0), 1)

    const donutData = [
        { name: 'Hired', value: stageCounts.hired || 0, color: DONUT_COLORS.hired },
        { name: 'Interview / Offer', value: (stageCounts.interview || 0) + (stageCounts.offered || 0), color: DONUT_COLORS.active },
        { name: 'Proses', value: (stageCounts.screening || 0) + (stageCounts.assessment || 0), color: DONUT_COLORS.process },
        { name: 'Applied', value: stageCounts.applied || 0, color: DONUT_COLORS.applied },
    ]

    const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    return (
        <div className="space-y-8 pb-24">

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

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: 'Lowongan Aktif', value: stats.totalJobs, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50', href: '/dashboard/jobs' },
                    { label: 'Total Pelamar', value: stats.totalApplicants, icon: Users, color: 'text-primary', bg: 'bg-brand-50', href: '/dashboard/candidates' },
                    { label: 'Karyawan Aktif', value: stats.totalEmployees, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', href: '/dashboard/employees' },
                    { label: 'Total Hired', value: stats.totalHired, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50', href: '/dashboard/candidates' },
                ].map((s, i) => (
                    <Link key={i} href={s.href}>
                        <Card className="p-5 border-none shadow-sm rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-4">
                            <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                                <s.icon className={`w-5 h-5 ${s.color}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1.5">{s.label}</p>
                                {loading
                                    ? <Skeleton className="h-7 w-12" />
                                    : <p className="text-2xl font-black text-foreground">{s.value}</p>
                                }
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Weekly Bar — Shadcn Chart */}
                <Card className="p-6 border-none shadow-sm rounded-2xl lg:col-span-1 !overflow-visible">
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Pelamar 7 Hari Terakhir</p>
                            {loading
                                ? <Skeleton className="h-8 w-16" />
                                : <p className="text-3xl font-black text-foreground">{totalWeekly}</p>
                            }
                        </div>
                        <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center">
                            <BarChart2 className="w-4 h-4 text-primary" />
                        </div>
                    </div>
                    {loading
                        ? <Skeleton className="h-[120px] w-full" />
                        : (
                            <ChartContainer config={weeklyChartConfig} className="h-[120px] w-full">
                                <BarChart data={weeklyApps} barSize={22} margin={{ top: 8, right: 0, left: -32, bottom: 0 }}>
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
                                        {weeklyApps.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fillOpacity={0.3 + (i / (weeklyApps.length - 1)) * 0.7}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        )
                    }
                </Card>

                {/* Pipeline Donut — Shadcn Chart */}
                <Card className="p-6 border-none shadow-sm rounded-2xl lg:col-span-1 !overflow-visible">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-5">Distribusi Pipeline</p>
                    {loading
                        ? <div className="flex gap-6 items-center"><Skeleton className="w-28 h-28 rounded-full" /><Skeleton className="flex-1 h-24" /></div>
                        : (
                            <div className="flex items-center gap-4">
                                {/* Donut */}
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
                                            <Tooltip
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
                                        <p className="text-xl font-black text-foreground leading-none">{stats.totalApplicants}</p>
                                        <p className="text-[9px] text-muted-foreground font-bold mt-0.5">total</p>
                                    </div>
                                </div>
                                {/* Legend */}
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

                {/* OKR + LMS */}
                <div className="space-y-4 lg:col-span-1">
                    <Link href="/dashboard/performance">
                        <Card className="p-5 border-none shadow-sm rounded-2xl hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Target className="w-4 h-4 text-amber-500" />
                                </div>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Target & Performa</p>
                            </div>
                            {loading ? <Skeleton className="h-12 w-full" /> : (
                                <>
                                    <p className="text-xl font-black text-foreground mb-3">
                                        {okrStats.total} <span className="text-sm font-semibold text-muted-foreground">sasaran aktif</span>
                                    </p>
                                    <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1.5">
                                        <span>Progres Rata-rata</span><span>{Math.round(okrStats.avgProgress)}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${okrStats.avgProgress}%` }} />
                                    </div>
                                </>
                            )}
                        </Card>
                    </Link>
                    <Link href="/dashboard/attendance">
                        <Card className="p-5 border-none shadow-sm rounded-2xl hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Clock className="w-4 h-4 text-rose-500" />
                                </div>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Kehadiran Hari Ini</p>
                            </div>
                            {loading ? <Skeleton className="h-12 w-full" /> : (
                                <div className="flex items-end gap-6">
                                    <div>
                                        <p className="text-2xl font-black text-emerald-500">{attendanceStats.present + attendanceStats.early_leave + attendanceStats.holiday_present}</p>
                                        <p className="text-xs font-bold text-muted-foreground">Hadir</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-amber-500">{attendanceStats.leave + attendanceStats.sick}</p>
                                        <p className="text-xs font-bold text-muted-foreground">Cuti</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-rose-500">{attendanceStats.absent}</p>
                                        <p className="text-xs font-bold text-muted-foreground">Alpa</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </Link>
                    <Link href="/dashboard/lms">
                        <Card className="p-5 border-none shadow-sm rounded-2xl hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                                    <GraduationCap className="w-4 h-4 text-violet-500" />
                                </div>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">LMS</p>
                            </div>
                            {loading ? <Skeleton className="h-12 w-full" /> : (
                                <div className="flex items-end gap-6">
                                    <div>
                                        <p className="text-2xl font-black text-foreground">{lmsStats.courses}</p>
                                        <p className="text-xs font-bold text-muted-foreground">Total Kursus</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-emerald-500">{lmsStats.published}</p>
                                        <p className="text-xs font-bold text-muted-foreground">Published</p>
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
                            const count = stageCounts[stage.key] ?? 0
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
                        ) : recentApps.length === 0 ? (
                            <div className="py-16 text-center">
                                <Users className="w-10 h-10 text-muted mx-auto mb-3" />
                                <p className="text-sm font-bold text-muted-foreground">Belum ada pelamar</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {recentApps.map((app) => (
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
                            : activeJobs.length === 0 ? (
                                <Card className="py-12 text-center border-dashed border-2 border-border shadow-none rounded-2xl">
                                    <Briefcase className="w-8 h-8 text-muted mx-auto mb-2" />
                                    <p className="text-sm font-bold text-muted-foreground">Tidak ada lowongan aktif</p>
                                </Card>
                            ) : activeJobs.map(job => (
                                <Link key={job.id} href={`/dashboard/jobs/${job.id}`}>
                                    <Card className="p-4 border-none shadow-sm rounded-2xl hover:-translate-y-0.5 hover:shadow-md transition-all group mb-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors flex-1">{job.title}</h4>
                                            <div className="flex items-center gap-1 bg-brand-50 text-primary rounded-lg px-2 py-1 shrink-0">
                                                <Users className="w-3 h-3" />
                                                <span className="text-[10px] font-black">{jobApplicantCounts[job.id] ?? 0}</span>
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
