import { DashboardLayoutWrapper } from '@/components/layout/DashboardLayoutWrapper'
import { getEffectiveProfileServer } from '@/lib/actions/impersonate'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }) {
    const res = await getEffectiveProfileServer()
    if (!res?.user) redirect('/login')

    return (
        <DashboardLayoutWrapper profile={res.profile} permissions={res.permissions}>
            {children}
        </DashboardLayoutWrapper>
    )
}
