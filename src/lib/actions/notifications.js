'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { getAuthProfile } from '@/lib/actions/auth-helpers'

const ENTITY_LABELS = {
    leave: 'Pengajuan Cuti/Izin',
    leave_request: 'Pengajuan Cuti/Izin',
    attendance: 'Pengajuan Absensi',
    resignation: 'Pengajuan Resign',
    offboarding: 'Pengajuan Resign',
}

/**
 * Fetch pending approval items for the current HR Admin/Owner — unified
 * `approval_requests` workflow plus standalone `overtime_requests`.
 * Used by the Topbar notification bell and the dashboard approvals widget.
 */
export async function getPendingApprovals({ limit = 10 } = {}) {
    const { profile } = await getAuthProfile({ requireAdmin: true })
    const supabase = createAdminSupabaseClient()

    const [{ data: approvals, count: approvalsCount }, { data: overtime, count: overtimeCount }] = await Promise.all([
        supabase
            .from('approval_requests')
            .select('id, entity_type, entity_id, status, created_at, employees(profile_id, profiles!employees_profile_id_fkey(full_name))', { count: 'exact' })
            .eq('company_id', profile.company_id)
            .in('status', ['pending_manager', 'pending_hr'])
            .order('created_at', { ascending: false })
            .limit(limit),
        supabase
            .from('overtime_requests')
            .select('id, overtime_date, created_at, employees(profile_id, profiles!employees_profile_id_fkey(full_name))', { count: 'exact' })
            .eq('company_id', profile.company_id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(limit),
    ])

    const items = [
        ...(approvals || []).map(a => ({
            id: `approval-${a.id}`,
            type: a.entity_type,
            label: ENTITY_LABELS[a.entity_type] || 'Pengajuan',
            employeeName: a.employees?.profiles?.full_name || 'Karyawan',
            createdAt: a.created_at,
            href: '/dashboard/attendance/requests',
        })),
        ...(overtime || []).map(o => ({
            id: `overtime-${o.id}`,
            type: 'overtime',
            label: 'Pengajuan Lembur',
            employeeName: o.employees?.profiles?.full_name || 'Karyawan',
            createdAt: o.created_at,
            href: '/dashboard/overtime',
        })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit)

    return {
        items,
        totalCount: (approvalsCount || 0) + (overtimeCount || 0),
    }
}
