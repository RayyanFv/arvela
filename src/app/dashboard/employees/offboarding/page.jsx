import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPermissions } from '@/lib/permissions'
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

    const perms = await getUserPermissions(user.id)
    if (!perms.has('employee.manage')) redirect('/dashboard')

    // Fetch all offboarding requests for this company
    const { data: offboardings } = await supabase
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

    // Fetch approval requests for resignation entity type
    const { data: approvalRequests } = await supabase
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

    return (
        <OffboardingClient
            companyId={profile.company_id}
            initialOffboardings={offboardings || []}
            initialApprovalRequests={approvalRequests || []}
        />
    )
}
