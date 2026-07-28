// ──────────────────────────────────────────────────
// MODULE  : Dashboard Router (Server Component)
// FILE    : app/dashboard/page.jsx
// FIX     : Profile resolved server-side before first paint —
//           removes the client-side profile fetch round trip
//           that used to block dashboard rendering.
// ──────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { ROLES } from '@/lib/constants/roles'
import { getEffectiveProfileServer } from '@/lib/actions/impersonate'
import { DashboardRouterClient } from './components/DashboardRouterClient'

export default async function DashboardPage() {
    const res = await getEffectiveProfileServer()

    if (!res?.user) redirect('/login')
    if (!res.profile?.role) redirect('/login')
    if (res.profile.role === ROLES.EMPLOYEE) redirect('/staff')

    return <DashboardRouterClient profile={res.profile} user={res.user} role={res.profile.role} />
}
