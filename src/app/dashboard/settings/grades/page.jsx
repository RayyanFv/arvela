import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPermissions } from '@/lib/permissions'
import GradesClient from './GradesClient'

export const metadata = { title: 'Manajemen Pangkat — Arvela HR' }

export default async function GradesPage() {
    const authClient = await createServerSupabaseClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) redirect('/login')

    const supabase = createAdminSupabaseClient()
    const { data: profile } = await supabase
        .from('profiles').select('company_id, role').eq('id', user.id).single()

    if (!profile) redirect('/login')

    const perms = await getUserPermissions(user.id)
    if (!perms.isAdmin) redirect('/dashboard')

    const { data: grades } = await supabase
        .from('job_grades')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('level', { ascending: true })   // Level 1 (Direktur) di atas, Level N (Staf) di bawah

    return <GradesClient companyId={profile.company_id} initialGrades={grades || []} />
}
