import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/constants/roles'
import OffboardingClient from './OffboardingClient'

export const metadata = { title: 'Manajemen Resign & Offboarding — Arvela HR' }

export default async function OffboardingPage() {
    const authClient = await createServerSupabaseClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) redirect('/login')

    const supabase = createAdminSupabaseClient()
    const { data: profile } = await supabase
        .from('profiles').select('company_id, role').eq('id', user.id).single()

    if (!profile) redirect('/login')

    if (!isAdminRole(profile.role)) redirect('/dashboard')

    const OFFBOARDING_LIST_LIMIT = 500

    const [{ data: offboardings }, { data: approvalRequests }] = await Promise.all([
        supabase
            .from('offboardings')
            .select(`
                *,
                employee:employee_id (
                    id, job_title, department,
                    profiles!employees_profile_id_fkey ( full_name, email, avatar_url )
                )
            `)
            .eq('company_id', profile.company_id)
            .order('created_at', { ascending: false })
            .limit(OFFBOARDING_LIST_LIMIT),
        supabase
            .from('approval_requests')
            .select(`
                *,
                approval_steps (
                    id, step_number, status, notes, action_at,
                    approver:approver_id ( full_name, email )
                )
            `)
            .eq('company_id', profile.company_id)
            .eq('entity_type', 'resignation')
            .limit(OFFBOARDING_LIST_LIMIT),
    ])

    return (
        <OffboardingClient
            companyId={profile.company_id}
            initialOffboardings={offboardings || []}
            initialApprovalRequests={approvalRequests || []}
        />
    )
}
