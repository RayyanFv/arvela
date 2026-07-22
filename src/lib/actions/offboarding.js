'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { getAuthProfile } from '@/lib/actions/auth-helpers'
import { submitForApproval } from '@/lib/actions/approval-engine'
import { revalidatePath } from 'next/cache'

/**
 * Submit employee resignation request.
 */
export async function submitResignation(payload) {
    const { profile, supabase } = await getAuthProfile({ requireAdmin: false })

    const { effective_date, reason, handover_notes, employee_id: targetEmployeeId } = payload

    if (!effective_date || !reason) {
        throw new Error('Tanggal efektif dan alasan resign wajib diisi.')
    }

    // Resolve employee_id
    let empId = targetEmployeeId
    if (!empId) {
        const { data: emp } = await supabase.from('employees').select('id, company_id').eq('profile_id', profile.id).single()
        if (!emp) throw new Error('Data karyawan Anda tidak ditemukan.')
        empId = emp.id
    }

    const { data: empData } = await supabase.from('employees').select('company_id').eq('id', empId).single()
    const companyId = empData?.company_id || profile.company_id

    // Default asset checklist template
    const defaultAssets = [
        { item: 'Laptop & Charger Kantor', returned: false },
        { item: 'Kartu Akses / ID Card', returned: false },
        { item: 'Akun Email & Software', returned: false },
        { item: 'Kunci Kantor / Loker', returned: false },
    ]

    const { data: offboard, error } = await supabase
        .from('offboardings')
        .insert({
            company_id: companyId,
            employee_id: empId,
            effective_date,
            reason: reason.trim(),
            handover_notes: handover_notes?.trim() || null,
            asset_checklist: defaultAssets,
            status: 'pending_manager',
        })
        .select('*')
        .single()

    if (error) throw new Error('Gagal mengajukan resign: ' + error.message)

    // Trigger multi-tier approval workflow
    await submitForApproval({
        entity_type: 'resignation',
        entity_id: offboard.id,
        employee_id: empId,
        company_id: companyId,
    })

    revalidatePath('/dashboard/employees/offboarding')
    revalidatePath('/staff/resign')
    return offboard
}

/**
 * Update asset return checklist or exit interview notes for an offboarding record.
 */
export async function updateOffboardingChecklist({ offboarding_id, asset_checklist, exit_interview_notes }) {
    const { supabase } = await getAuthProfile({ requireAdmin: true })

    const updatePayload = {}
    if (asset_checklist) updatePayload.asset_checklist = asset_checklist
    if (exit_interview_notes !== undefined) updatePayload.exit_interview_notes = exit_interview_notes
    updatePayload.updated_at = new Date().toISOString()

    const { data, error } = await supabase
        .from('offboardings')
        .update(updatePayload)
        .eq('id', offboarding_id)
        .select('*')
        .single()

    if (error) throw new Error('Gagal memperbarui checklist: ' + error.message)

    revalidatePath('/dashboard/employees/offboarding')
    return data
}

/**
 * Fetch all offboardings for the current company (HR Admin / Manager view).
 */
export async function getCompanyOffboardings() {
    const { profile, supabase } = await getAuthProfile({ requireAdmin: true })

    const { data } = await supabase
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

    return data || []
}
