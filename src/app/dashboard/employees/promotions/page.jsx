import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/constants/roles'
import PromotionsClient from './PromotionsClient'

export const metadata = { title: 'Manajemen Naik Pangkat — Arvela HR' }

export default async function PromotionsPage() {
    const authClient = await createServerSupabaseClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) redirect('/login')

    const supabase = createAdminSupabaseClient()
    const { data: profile } = await supabase
        .from('profiles').select('company_id, role').eq('id', user.id).single()

    if (!profile) redirect('/login')

    if (!isAdminRole(profile.role)) redirect('/dashboard')

    const PROMOTION_LIST_LIMIT = 500

    const [{ data: promotions }, { data: approvalRequests }, { data: employees }, { data: grades }] = await Promise.all([
        supabase
            .from('promotion_requests')
            .select(`
                *,
                employee:employee_id (
                    id, job_title, department,
                    profiles!employees_profile_id_fkey ( full_name, email, avatar_url )
                ),
                current_grade:current_grade_id ( id, name, code, level ),
                target_grade:target_grade_id ( id, name, code, level )
            `)
            .eq('company_id', profile.company_id)
            .order('created_at', { ascending: false })
            .limit(PROMOTION_LIST_LIMIT),
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
            .eq('entity_type', 'promotion')
            .limit(PROMOTION_LIST_LIMIT),
        supabase
            .from('employees')
            .select('id, job_title, job_grade_id, profiles!employees_profile_id_fkey(full_name)')
            .eq('company_id', profile.company_id)
            .eq('status', 'active')
            .order('created_at', { ascending: false }),
        supabase
            .from('job_grades')
            .select('id, name, code, level')
            .eq('company_id', profile.company_id)
            .order('level', { ascending: false }),
    ])

    return (
        <PromotionsClient
            companyId={profile.company_id}
            initialPromotions={promotions || []}
            initialApprovalRequests={approvalRequests || []}
            employees={employees || []}
            grades={grades || []}
        />
    )
}
