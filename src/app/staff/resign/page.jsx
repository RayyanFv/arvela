import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResignClient from './ResignClient'

export const metadata = { title: 'Pengajuan Resign Mandiri — Portal Karyawan' }

export default async function StaffResignPage() {
    const authClient = await createServerSupabaseClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) redirect('/login')

    const supabase = createAdminSupabaseClient()

    const { data: emp } = await supabase
        .from('employees')
        .select(`
            id, company_id, job_title, department, joined_at,
            profiles!employees_profile_id_fkey(full_name, email, avatar_url)
        `)
        .eq('profile_id', user.id)
        .single()

    if (!emp) redirect('/staff')

    // Fetch existing offboarding requests for this employee
    const { data: offboardings } = await supabase
        .from('offboardings')
        .select('*')
        .eq('employee_id', emp.id)
        .order('created_at', { ascending: false })

    // Fetch approval steps for employee's offboardings
    const offboardingIds = (offboardings || []).map(o => o.id)
    let approvalRequests = []
    if (offboardingIds.length > 0) {
        const { data: appReqs } = await supabase
            .from('approval_requests')
            .select(`
                *,
                approval_steps (
                    id, step_number, status, notes, action_at,
                    approver:approver_id ( full_name, email )
                )
            `)
            .eq('entity_type', 'resignation')
            .in('entity_id', offboardingIds)

        approvalRequests = appReqs || []
    }

    return (
        <ResignClient
            employee={emp}
            initialOffboardings={offboardings || []}
            approvalRequests={approvalRequests}
        />
    )
}
