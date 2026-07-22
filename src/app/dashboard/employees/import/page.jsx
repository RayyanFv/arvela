import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPermissions } from '@/lib/permissions'
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

    const perms = await getUserPermissions(user.id)
    if (!perms.has('employee.manage')) redirect('/dashboard/employees')

    return <ImportClient companyId={profile.company_id} />
}
