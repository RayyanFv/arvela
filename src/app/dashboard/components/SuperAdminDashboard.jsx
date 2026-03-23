'use client'

// ──────────────────────────────────────────────────
// MODULE  : Dashboard — Super Admin
// FILE    : app/dashboard/components/SuperAdminDashboard.jsx
// OPTIMIZATIONS:
//   ✅ Solusi 1 — Profile diterima sebagai prop (no double fetch)
//   ✅ Solusi 3 — Single RPC call ganti 2 query terpisah
//   ✅ Solusi 5 — useMemo untuk derived data
//   ✅ Solusi 6 — Single consolidated state object
// ──────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    ShieldCheck, Users, Mail, UserPlus,
    Building2, KeyRound
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import Link from 'next/link'
import { ROLE_LABELS, ROLES } from '@/lib/constants/roles'

// ─── Solusi 6: Single consolidated state ─────────────────────────────────────
const INITIAL_STATE = {
    totalProfiles:  0,
    totalEmployees: 0,
    roles:          {},
    recentUsers:    [],
}

// ── Solusi 1: Terima profile + user dari parent (page.jsx) ────────────────────
export function SuperAdminDashboard({ profile, user }) {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)

    // ── Solusi 6: Satu state object ───────────────────────────────────────────
    const [data, setData] = useState(INITIAL_STATE)

    useEffect(() => {
        async function load() {
            // ── Solusi 1: Langsung dari prop ──────────────────────────────────
            const cid = profile?.company_id || user?.user_metadata?.company_id
            if (!cid) { setLoading(false); return }

            // ── Solusi 3: Single RPC call ganti 2 query ───────────────────────
            const { data: stats, error } = await supabase.rpc(
                'get_admin_dashboard_stats',
                { p_company_id: cid }
            )

            if (error || !stats) {
                console.error('SuperAdmin Dashboard RPC error:', error)
                setLoading(false)
                return
            }

            // ── Solusi 6: Single setState → 1 re-render ────────────────────────
            setData({
                totalProfiles:  stats.total_profiles  || 0,
                totalEmployees: stats.total_employees || 0,
                roles:          stats.roles           || {},
                recentUsers:    stats.recent_users    || [],
            })

            setLoading(false)
        }
        load()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Solusi 5: useMemo untuk derived + static data ─────────────────────────
    const statCards = useMemo(() => [
        { label: 'Total Akun Sistem',   value: data.totalProfiles,               icon: Users,       color: 'text-blue-500',    bg: 'bg-blue-50'    },
        { label: 'Karyawan Terhubung',  value: data.totalEmployees,              icon: Building2,   color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'HR Administrator',    value: data.roles[ROLES.HR_ADMIN] ?? 0,  icon: KeyRound,    color: 'text-violet-500',  bg: 'bg-violet-50'  },
        { label: 'Pemilik (Owner)',      value: data.roles[ROLES.OWNER] ?? 0,     icon: ShieldCheck, color: 'text-amber-500',   bg: 'bg-amber-50'   },
    ], [data.totalProfiles, data.totalEmployees, data.roles])

    const getRoleBadgeColor = useMemo(() => (role) => {
        switch (role) {
            case ROLES.SUPER_ADMIN: return 'bg-rose-100 text-rose-700 border-rose-200'
            case ROLES.OWNER:       return 'bg-amber-100 text-amber-700 border-amber-200'
            case ROLES.HR_ADMIN:    return 'bg-violet-100 text-violet-700 border-violet-200'
            case ROLES.EMPLOYEE:    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case ROLES.CANDIDATE:   return 'bg-blue-100 text-blue-700 border-blue-200'
            default:                return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }, [])

    return (
        <div className="space-y-8 pb-24 animate-in slide-in-from-bottom-4 duration-700">
            <Breadcrumbs />

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-rose-500" /> System Control Panel
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1 mb-2 max-w-lg">
                        Pusat kendali hak akses. Daftarkan akun Administrator HR dan Eksekutif untuk <strong className="text-foreground">{profile?.companies?.name ?? 'Perusahaan'}</strong>.
                    </p>
                </div>
                <Link href="/dashboard/settings/users">
                    <Button className="h-10 px-5 rounded-xl bg-foreground hover:bg-slate-800 text-background font-bold gap-2">
                        <UserPlus className="w-4 h-4" /> Daftarkan Pengguna Baru
                    </Button>
                </Link>
            </div>

            {/* ── System Status Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {statCards.map((s, i) => (
                    <Card key={i} className="p-6 border-none shadow-sm rounded-3xl hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 flex flex-col items-center justify-center rounded-xl shrink-0 ${s.bg}`}>
                                <s.icon className={`w-5 h-5 ${s.color}`} />
                            </div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{s.label}</p>
                        </div>
                        {loading
                            ? <Skeleton className="h-8 w-14" />
                            : <p className="text-3xl font-black">{s.value ?? 0}</p>
                        }
                    </Card>
                ))}
            </div>

            {/* ── User Directory ── */}
            <Card className="p-6 md:p-8 border-none shadow-sm rounded-3xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Aktivitas Akun Terbaru</h2>
                        <p className="text-xs font-medium text-muted-foreground mt-1">Daftar profil pengguna yang baru dibuat / terdaftar ke perusahaan ini.</p>
                    </div>
                    <Link href="/dashboard/settings/users">
                        <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-brand-50">Kelola Semua Akses</Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
                    </div>
                ) : data.recentUsers.length === 0 ? (
                    <div className="py-12 text-center border-dashed border-2 border-slate-100 rounded-3xl">
                        <Users className="w-10 h-10 text-muted mx-auto mb-3" />
                        <p className="text-sm font-bold text-muted-foreground">Tidak ada pengguna terdeteksi.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.recentUsers.map(u => (
                            <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-slate-200 transition-all gap-4 group">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:text-primary transition-colors shrink-0">
                                        {u.full_name?.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-foreground text-sm truncate">{u.full_name}</h4>
                                        <p className="text-[10px] font-bold text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                                            <Mail className="w-3 h-3 text-slate-300" /> {u.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 justify-end sm:shrink-0 ml-14 sm:ml-0">
                                    <Badge variant="outline" className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border text-center ${getRoleBadgeColor(u.role)}`}>
                                        {ROLE_LABELS[u.role] || u.role}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}
