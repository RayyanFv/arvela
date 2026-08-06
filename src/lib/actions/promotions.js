'use server'

import { getAuthProfile } from '@/lib/actions/auth-helpers'
import { submitForApproval } from '@/lib/actions/approval-engine'
import { revalidatePath } from 'next/cache'

/**
 * Submit a promotion (naik pangkat) request for an employee.
 * HR/admin-initiated — routes through the standard multi-tier approval workflow.
 */
export async function submitPromotionRequest(payload) {
    const { profile, supabase } = await getAuthProfile({ requireAdmin: true })

    const { employee_id, target_grade_id, effective_date, reason } = payload

    if (!employee_id || !target_grade_id || !effective_date || !reason) {
        throw new Error('Karyawan, pangkat tujuan, tanggal efektif, dan alasan wajib diisi.')
    }

    const { data: emp } = await supabase
        .from('employees')
        .select('id, company_id, job_grade_id')
        .eq('id', employee_id)
        .eq('company_id', profile.company_id)
        .single()

    if (!emp) throw new Error('Karyawan tidak ditemukan.')

    if (emp.job_grade_id === target_grade_id) {
        throw new Error('Pangkat tujuan sama dengan pangkat saat ini.')
    }

    const { data: promo, error } = await supabase
        .from('promotion_requests')
        .insert({
            company_id: emp.company_id,
            employee_id: emp.id,
            current_grade_id: emp.job_grade_id || null,
            target_grade_id,
            effective_date,
            reason: reason.trim(),
            status: 'pending_manager',
        })
        .select('*')
        .single()

    if (error) throw new Error('Gagal mengajukan promosi: ' + error.message)

    await submitForApproval({
        entity_type: 'promotion',
        entity_id: promo.id,
        employee_id: emp.id,
        company_id: emp.company_id,
    })

    revalidatePath('/dashboard/employees/promotions')
    revalidatePath(`/dashboard/employees/${emp.id}`)
    return promo
}
