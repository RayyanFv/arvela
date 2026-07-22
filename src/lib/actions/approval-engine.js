'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { getAuthProfile } from '@/lib/actions/auth-helpers'

/**
 * Initialize a multi-tier approval workflow for a request (leave, attendance, resignation).
 */
export async function submitForApproval({ entity_type, entity_id, employee_id, company_id }) {
    const supabase = createAdminSupabaseClient()

    // Fetch employee details to find direct manager or unit head
    const { data: emp } = await supabase
        .from('employees')
        .select(`
            id, profile_id, manager_id,
            work_unit:work_unit_id ( head_id ),
            home_unit:home_unit_id ( head_id )
        `)
        .eq('id', employee_id)
        .single()

    if (!emp) throw new Error('Karyawan tidak ditemukan.')

    // Determine Step 1 Approver Profile ID
    let managerProfileId = emp.manager_id || null
    if (!managerProfileId) {
        const unitHeadId = emp.work_unit?.head_id || emp.home_unit?.head_id
        if (unitHeadId) {
            const { data: headEmp } = await supabase.from('employees').select('profile_id').eq('id', unitHeadId).single()
            managerProfileId = headEmp?.profile_id || null
        }
    }

    // Create approval_requests record
    const hasStep1 = !!managerProfileId
    const initialStatus = hasStep1 ? 'pending_manager' : 'pending_hr'
    const initialStep = hasStep1 ? 1 : 2

    const { data: appReq, error: reqErr } = await supabase
        .from('approval_requests')
        .insert({
            company_id,
            employee_id,
            entity_type,
            entity_id,
            current_step: initialStep,
            status: initialStatus,
        })
        .select('*')
        .single()

    if (reqErr) throw new Error('Gagal membuat alur persetujuan: ' + reqErr.message)

    // Insert Step 1 (Manager/Head) if exists
    if (hasStep1) {
        await supabase.from('approval_steps').insert({
            request_id: appReq.id,
            step_number: 1,
            approver_id: managerProfileId,
            status: 'pending',
        })
    }

    // Insert Step 2 (HR Admin / Owner)
    await supabase.from('approval_steps').insert({
        request_id: appReq.id,
        step_number: 2,
        approver_id: null, // Any HR Admin/Owner in company
        status: hasStep1 ? 'pending' : 'pending',
    })

    return appReq
}

/**
 * Process (Approve/Reject) a step in the multi-tier approval workflow.
 */
export async function processApprovalStep({ requestId, stepNumber, status, notes }) {
    const { profile } = await getAuthProfile({ requireAdmin: false })
    const supabase = createAdminSupabaseClient()

    const { data: req } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (!req) throw new Error('Permintaan persetujuan tidak ditemukan.')

    // Update current step
    const { error: stepErr } = await supabase
        .from('approval_steps')
        .update({
            approver_id: profile.id,
            status,
            notes: notes || null,
            action_at: new Date().toISOString(),
        })
        .eq('request_id', requestId)
        .eq('step_number', stepNumber)

    if (stepErr) throw new Error('Gagal memperbarui status: ' + stepErr.message)

    if (status === 'rejected') {
        // Set request status to rejected
        await supabase.from('approval_requests').update({
            status: 'rejected',
            updated_at: new Date().toISOString()
        }).eq('id', requestId)

        // Update target entity status to rejected
        await updateEntityStatus(supabase, req.entity_type, req.entity_id, 'rejected')
        return { success: true, status: 'rejected' }
    }

    if (status === 'approved') {
        if (stepNumber === 1 && req.status === 'pending_manager') {
            // Advance to Step 2 (HR Admin)
            await supabase.from('approval_requests').update({
                current_step: 2,
                status: 'pending_hr',
                updated_at: new Date().toISOString()
            }).eq('id', requestId)

            return { success: true, status: 'pending_hr' }
        } else {
            // Final Approval (Step 2 or HR override)
            await supabase.from('approval_requests').update({
                current_step: 2,
                status: 'approved',
                updated_at: new Date().toISOString()
            }).eq('id', requestId)

            await updateEntityStatus(supabase, req.entity_type, req.entity_id, 'approved')
            return { success: true, status: 'approved' }
        }
    }
}

/**
 * Update target entity status (leave_requests, attendance_requests, offboardings).
 */
async function updateEntityStatus(supabase, entityType, entityId, newStatus) {
    if (entityType === 'leave' || entityType === 'leave_request') {
        await supabase.from('leave_requests').update({ status: newStatus }).eq('id', entityId)
    } else if (entityType === 'attendance') {
        await supabase.from('attendance_requests').update({ status: newStatus }).eq('id', entityId)
    } else if (entityType === 'resignation' || entityType === 'offboarding') {
        await supabase.from('offboardings').update({ status: newStatus }).eq('id', entityId)

        // If offboarding approved, set employee status to resigned/inactive on effective_date
        if (newStatus === 'approved') {
            const { data: off } = await supabase.from('offboardings').select('employee_id, effective_date').eq('id', entityId).single()
            if (off) {
                const isTodayOrPast = new Date(off.effective_date) <= new Date()
                if (isTodayOrPast) {
                    await supabase.from('employees').update({ status: 'inactive' }).eq('id', off.employee_id)
                }
            }
        }
    }
}

/**
 * Fetch approval timeline steps for a specific request entity.
 */
export async function getApprovalTimeline(entityType, entityId) {
    const supabase = createAdminSupabaseClient()

    const { data: req } = await supabase
        .from('approval_requests')
        .select(`
            *,
            approval_steps (
                id, step_number, status, notes, action_at,
                approver:approver_id ( full_name, email )
            )
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single()

    return req || null
}
