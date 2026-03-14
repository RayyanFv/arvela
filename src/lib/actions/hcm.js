'use server'

import { getAuthProfile } from '@/lib/actions/auth-helpers'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ROLES } from '@/lib/constants/roles'
import { revalidatePath } from 'next/cache'

/**
 * Update the completion status of an onboarding task
 * (Employee can toggle their own tasks — uses RLS-respecting client)
 */
export async function toggleOnboardingTask({ progressId, completed }) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
        .from('onboarding_progress')
        .update({
            is_completed: completed,
            completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', progressId)

    if (error) throw new Error(error.message)
    revalidatePath('/staff')
    return { success: true }
}

/**
 * Create a new OKR for an employee (Admin only + company check)
 */
export async function createOKR({ employeeId, companyId, title, period, description }) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    // Verify companyId matches the caller's company
    if (companyId !== profile.company_id) {
        throw new Error('Unauthorized: cross-company access denied')
    }

    // Verify the employee belongs to this company
    const { data: employee } = await admin
        .from('employees')
        .select('id')
        .eq('id', employeeId)
        .eq('company_id', profile.company_id)
        .single()

    if (!employee) throw new Error('Employee not found or access denied')

    const { data, error } = await admin
        .from('okrs')
        .insert({
            employee_id: employeeId,
            company_id: profile.company_id,
            title,
            period,
            description,
            status: 'active'
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath(`/dashboard/employees/${employeeId}`)
    return { success: true, data }
}

/**
 * Update Key Result value 
 * (Employee can update their own — uses RLS-respecting client)
 */
export async function updateKeyResult({ krId, currentValue }) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
        .from('key_results')
        .update({ current_value: currentValue, updated_at: new Date().toISOString() })
        .eq('id', krId)

    if (error) throw new Error(error.message)
    return { success: true }
}

/**
 * LMS: Enroll employee in a course (Admin only + company check)
 */
export async function enrollInCourse({ employeeId, courseId, companyId, dueDate }) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    // Verify companyId matches caller's company
    if (companyId !== profile.company_id) {
        throw new Error('Unauthorized: cross-company access denied')
    }

    // Verify employee belongs to this company
    const { data: employee } = await admin
        .from('employees')
        .select('id')
        .eq('id', employeeId)
        .eq('company_id', profile.company_id)
        .single()

    if (!employee) throw new Error('Employee not found or access denied')

    const { error } = await admin
        .from('lms_course_assignments')
        .insert({
            employee_id: employeeId,
            course_id: courseId,
            company_id: profile.company_id,
            due_date: dueDate || null,
            status: 'enrolled'
        })

    if (error) throw new Error(error.message)
    revalidatePath(`/dashboard/employees/${employeeId}`)
    return { success: true }
}

/**
 * Assign an onboarding template to an employee (Admin only)
 */
export async function assignOnboardingTemplate({ employeeId, templateId, companyId }) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    if (companyId !== profile.company_id) {
        throw new Error('Unauthorized: cross-company access denied')
    }

    // 1. Get tasks for the template
    const { data: tasks, error: taskError } = await admin
        .from('onboarding_tasks')
        .select('id')
        .eq('template_id', templateId)

    if (taskError) throw new Error(taskError.message)
    if (!tasks || tasks.length === 0) throw new Error('Template has no tasks')

    // 2. Prepare progress entries
    const progressData = tasks.map(task => ({
        employee_id: employeeId,
        task_id: task.id
    }))

    // 3. Upsert into onboarding_progress
    const { error: insertError } = await admin
        .from('onboarding_progress')
        .upsert(progressData, { onConflict: 'employee_id, task_id' })

    if (insertError) throw new Error(insertError.message)

    revalidatePath(`/dashboard/employees/${employeeId}`)
    return { success: true }
}
