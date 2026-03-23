'use client'

// ──────────────────────────────────────────────────
// MODULE  : Dashboard — Owner / Executive
// FILE    : app/dashboard/components/OwnerDashboard.jsx
// OPTIMIZATIONS:
//   ✅ Solusi 1 — Profile diterima sebagai prop (no double fetch)
//   ✅ Solusi 3 — Single RPC call ganti 3 query terpisah
//   ✅ Solusi 5 — useMemo untuk semua derived data
//   ✅ Solusi 6 — Single consolidated state object
// ──────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Users, TrendingUp, Target,
    Building2, Activity, Clock
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip
} from 'recharts'
import Link from 'next/link'

const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5']

// ─── Solusi 6: Single consolidated state ─────────────────────────────────────
const INITIAL_STATE = {
    totalEmployees: 0,
    byDept: [],
    okrAvg: 0,
    topEmployees: [],
    attendanceToday: { present: 0, absent: 0 },
}

// ── Solusi 1: Terima profile + user dari parent (page.jsx) ────────────────────
export function OwnerDashboard({ profile, user }) {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)

    // ── Solusi 6: Satu state object ───────────────────────────────────────────
    const [data, setData] = useState(INITIAL_STATE)

    useEffect(() => {
        async function load() {
            // ── Solusi 1: Langsung dari prop ──────────────────────────────────
            const cid = profile?.company_id || user?.user_metadata?.company_id
            if (!cid) { setLoading(false); return }

            // ── Solusi 3: Single RPC call ──────────────────────────────────────
            const { data: stats, error } = await supabase.rpc(
                'get_owner_dashboard_stats',
                { p_company_id: cid }
            )

            if (error || !stats) {
                console.error('Owner Dashboard RPC error:', error)
                setLoading(false)
                return
            }

            // ── Solusi 6: Single setState → 1 re-render ────────────────────────
            setData({
                totalEmployees:  stats.total_employees  || 0,
                byDept:          stats.by_department    || [],
                okrAvg:          stats.okr_avg          || 0,
                topEmployees:    stats.top_employees    || [],
                attendanceToday: {
                    present: stats.attendance_today?.present || 0,
                    absent:  stats.attendance_today?.absent  || 0,
                },
            })

            setLoading(false)
        }
        load()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Solusi 5: useMemo untuk derived/static data ───────────────────────────
    const statCards = useMemo(() => [
        { label: 'Total Karyawan',          value: data.totalEmployees,            sub: null,                                          icon: Users,     bg: 'bg-primary/10',   color: 'text-primary'     },
        { label: 'Rata-rata Target Tercapai', value: `${data.okrAvg}%`,            sub: null,                                          icon: Target,    bg: 'bg-emerald-100',  color: 'text-emerald-600' },
        { label: 'Hadir Hari Ini',          value: data.attendanceToday.present,   sub: `dari ${data.totalEmployees}`,                 icon: Clock,     bg: 'bg-blue-100',     color: 'text-blue-600'    },
        { label: 'Departemen Aktif',        value: data.byDept.length,             sub: null,                                          icon: Building2, bg: 'bg-violet-100',   color: 'text-violet-600'  },
    ], [data.totalEmployees, data.okrAvg, data.attendanceToday.present, data.byDept.length])

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
                        Executive Overview,{' '}
                        <span className="text-primary">{profile?.full_name?.split(' ')[0] ?? 'Owner'}</span>
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">{profile?.companies?.name ?? 'Perusahaan'} · Panel Eksekutif</p>
                </div>
            </div>

            {/* ── Main Stats Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {statCards.map((s, i) => (
                    <Card key={i} className="p-6 border-none shadow-sm rounded-3xl hover:shadow-md transition-all flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                                <s.icon className={`w-5 h-5 ${s.color}`} />
                            </div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-tight">{s.label}</p>
                        </div>
                        {loading ? <Skeleton className="h-8 w-16" /> : (
                            <div className="flex items-end gap-2">
                                <p className="text-3xl font-black text-foreground leading-none">{s.value}</p>
                                {s.sub && <p className="text-xs font-bold text-muted-foreground mb-1">{s.sub}</p>}
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

                {/* Distribusi Departemen (Pie Chart) */}
                <Card className="p-8 border-none shadow-sm rounded-3xl flex flex-col justify-between">
                    <div>
                        <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> Distribusi Departemen
                        </h2>
                        <p className="text-sm font-medium text-foreground mb-6">Sebaran tenaga kerja berdasarkan departemen.</p>
                    </div>
                    {loading ? <Skeleton className="h-[200px] w-full" /> : data.byDept.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-8">Belum ada data struktur departemen.</div>
                    ) : (
                        <div className="flex items-center gap-4 flex-1">
                            <ResponsiveContainer width={150} height={150}>
                                <PieChart>
                                    <Pie data={data.byDept} cx="50%" cy="50%" innerRadius={45} outerRadius={60} strokeWidth={0} dataKey="value">
                                        {data.byDept.map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        wrapperClassName="!text-xs !bg-white !border-none !shadow-xl !rounded-xl"
                                        formatter={(value) => [`${value} Karyawan`]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex-1 space-y-2">
                                {data.byDept.map((dept, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <span className="font-bold text-muted-foreground truncate max-w-[100px]">{dept.name}</span>
                                        </div>
                                        <span className="font-black text-foreground">{dept.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Top Performers */}
                <Card className="p-8 border-none shadow-sm rounded-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5" /> Top Performers (OKR)
                            </h2>
                            <p className="text-sm font-medium text-foreground">Karyawan dengan pencapaian OKR tertinggi.</p>
                        </div>
                    </div>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    ) : data.topEmployees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-muted-foreground py-10 h-full">
                            <Activity className="w-8 h-8 md:mb-2 opacity-50" />
                            <p className="text-sm font-medium">Belum ada data OKR yang berjalan bernilai aktif.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.topEmployees.map((emp, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-brand-50 text-primary flex items-center justify-center font-black text-xs shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{emp.name}</p>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{emp.dept || 'General'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${emp.avg}%` }} />
                                        </div>
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-black text-xs min-w-[3rem] justify-center">
                                            {emp.avg}%
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
