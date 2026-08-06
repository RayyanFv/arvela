import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/constants/roles'
import { getEffectiveProfileServer } from '@/lib/actions/impersonate'
import ContractTypesClient from './ContractTypesClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Manajemen Tipe Kontrak — Arvela HR' }

export default async function ContractTypesPage() {
    const res = await getEffectiveProfileServer()
    if (!res?.user) redirect('/login')
    const profile = res.profile
    if (!profile) redirect('/login')

    if (profile.role === 'super_admin' || !profile.company_id) {
        redirect('/dashboard/companies')
    }

    const supabase = createAdminSupabaseClient()

    if (!isAdminRole(profile.role)) redirect('/dashboard')

    const { data: contractTypes } = await supabase
        .from('contract_types')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: true })

    return <ContractTypesClient companyId={profile.company_id} initialContractTypes={contractTypes || []} />
}
