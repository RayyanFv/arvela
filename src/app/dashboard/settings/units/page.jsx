import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPermissions } from '@/lib/permissions'
import UnitsClient from './UnitsClient'

export const metadata = { title: 'Manajemen Unit — Arvela HR' }

export default async function UnitsPage() {
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
    if (!perms.isAdmin) redirect('/dashboard')

    const companyId = profile.company_id

    const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single()

    // Fetch all units (departments) for this company - flat list, tree built client-side
    const { data: units } = await supabase
        .from('departments')
        .select(`
            id, name, code, description, level, parent_id, created_at,
            head:head_id ( id, profiles!employees_profile_id_fkey(full_name) )
        `)
        .eq('company_id', companyId)
        .order('level', { ascending: true })
        .order('name', { ascending: true })

    // Fetch level configs (label per level)
    const { data: levelConfigs } = await supabase
        .from('unit_level_configs')
        .select('level, label')
        .eq('company_id', companyId)
        .order('level', { ascending: true })

    // Fetch employees for head selection
    const { data: employees } = await supabase
        .from('employees')
        .select('id, profiles!employees_profile_id_fkey(full_name)')
        .eq('company_id', companyId)

    return (
        <UnitsClient
            companyId={companyId}
            companyName={company?.name || 'Perusahaan'}
            initialUnits={units || []}
            initialLevelConfigs={levelConfigs || []}
            employees={employees || []}
        />
    )
}
