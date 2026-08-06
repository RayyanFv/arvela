import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/constants/roles'
import ImportClient from './ImportClient'

export const metadata = { title: 'Import Karyawan — Arvela HR' }

export default async function EmployeeImportPage() {
    const authClient = await createServerSupabaseClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) redirect('/login')

    const supabase = createAdminSupabaseClient()
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/login')

    if (!isAdminRole(profile.role)) redirect('/dashboard/employees')

    return <ImportClient companyId={profile.company_id} />
}
