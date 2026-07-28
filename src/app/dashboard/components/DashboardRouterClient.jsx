'use client'

import { ROLES } from '@/lib/constants/roles'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { DashboardSkeleton } from './DashboardSkeleton'

// ── Dynamic imports — setiap dashboard hanya di-download
// ketika role user cocok, bukan semua sekaligus ──────────────────
const HRAdminDashboard = dynamic(
    () => import('./HRAdminDashboard').then(m => ({ default: m.HRAdminDashboard })),
    { loading: () => <DashboardSkeleton />, ssr: false }
)
const OwnerDashboard = dynamic(
    () => import('./OwnerDashboard').then(m => ({ default: m.OwnerDashboard })),
    { loading: () => <DashboardSkeleton />, ssr: false }
)
const SuperAdminDashboard = dynamic(
    () => import('./SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })),
    { loading: () => <DashboardSkeleton />, ssr: false }
)

export function DashboardRouterClient({ profile, user, role }) {
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
