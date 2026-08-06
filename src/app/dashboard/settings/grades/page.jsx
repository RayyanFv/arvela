import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/constants/roles'
import { getEffectiveProfileServer } from '@/lib/actions/impersonate'
import GradesClient from './GradesClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Manajemen Pangkat — Arvela HR' }

export default async function GradesPage() {
    const res = await getEffectiveProfileServer()
    if (!res?.user) redirect('/login')
    const profile = res.profile
    if (!profile) redirect('/login')

    if (profile.role === 'super_admin' || !profile.company_id) {
        redirect('/dashboard/companies')
    }

    const supabase = createAdminSupabaseClient()

    if (!isAdminRole(profile.role)) redirect('/dashboard')

    const { data: grades } = await supabase
        .from('job_grades')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('level', { ascending: true })   // Level 1 (Direktur) di atas, Level N (Staf) di bawah

    return <GradesClient companyId={profile.company_id} initialGrades={grades || []} />
}
