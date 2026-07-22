'use client'

// ──────────────────────────────────────────────────
// MODULE  : Dashboard Router
// FILE    : app/dashboard/page.jsx
// FIX     : Dynamic imports (code-split per role) +
//           Single auth fetch — profile passed down as prop
//           No more double getUser() + profiles.select()
// ──────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ROLES } from '@/lib/constants/roles'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { DashboardSkeleton } from './components/DashboardSkeleton'


// ── Solusi 2: Dynamic imports — setiap dashboard hanya di-download
// ketika role user cocok, bukan semua sekaligus ──────────────────
const HRAdminDashboard = dynamic(
    () => import('./components/HRAdminDashboard').then(m => ({ default: m.HRAdminDashboard })),
    { loading: () => <DashboardSkeleton />, ssr: false }
)
const OwnerDashboard = dynamic(
    () => import('./components/OwnerDashboard').then(m => ({ default: m.OwnerDashboard })),
    { loading: () => <DashboardSkeleton />, ssr: false }
)
const SuperAdminDashboard = dynamic(
    () => import('./components/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })),
    { loading: () => <DashboardSkeleton />, ssr: false }
)

import { getEffectiveProfileServer } from '@/lib/actions/impersonate'

export default function DashboardRouter() {
    const supabase = createClient()
    const router = useRouter()
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const [profile, setProfile] = useState(null)
    const [user, setUser] = useState(null)

    useEffect(() => {
        async function fetchRole() {
            try {
                const res = await getEffectiveProfileServer()

                if (!res?.user) {
                    router.push('/login')
                    return
                }

                setUser(res.user)

                if (res.profile?.role) {
                    if (res.profile.role === ROLES.EMPLOYEE) {
                        router.push('/staff')
                        return
                    }
                    setProfile(res.profile)
                    setRole(res.profile.role)
                } else {

                    setError(true)
                }
            } catch (err) {

                setError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchRole()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="font-medium text-sm animate-pulse tracking-widest uppercase">Mempersiapkan Dashboard...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Gagal Akses Dashboard</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-xs">Terjadi kendala saat memvalidasi hak akses Anda. Silakan coba login kembali.</p>
                <button
                    onClick={() => { window.location.reload() }}
                    className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm"
                >
                    Refresh Halaman
                </button>
            </div>
        )
    }

    // ── Role-based rendering — profile & user diteruskan sebagai prop ──
    switch (role) {
        case ROLES.SUPER_ADMIN:
            return <SuperAdminDashboard profile={profile} user={user} />
        case ROLES.OWNER:
            return <OwnerDashboard profile={profile} user={user} />
        case ROLES.HR_ADMIN:
            return <HRAdminDashboard profile={profile} user={user} />
        default:
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <p className="text-slate-400 font-bold">Role tidak dikenali: {role}</p>
                    <Link href="/login" className="text-primary font-bold mt-2">Kembali ke Login</Link>
                </div>
            )
    }
}
