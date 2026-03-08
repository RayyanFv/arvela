'use server'

import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Update the completion status of an onboarding task
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
 * Create a new OKR for an employee
 */
export async function createOKR({ employeeId, companyId, title, period, description }) {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
        .from('okrs')
        .insert({
            employee_id: employeeId,
            company_id: companyId,
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
 * Update Key Result value and auto-triggers OKR progress change via DB Trigger
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
 * LMS: Enroll employee in a course
 */
export async function enrollInCourse({ employeeId, courseId, companyId, dueDate }) {
    const supabase = createAdminSupabaseClient()
    const { error } = await supabase
        .from('lms_course_assignments')
        .insert({
            employee_id: employeeId,
            course_id: courseId,
            company_id: companyId,
            due_date: dueDate || null,
            status: 'enrolled'
        })

    if (error) throw new Error(error.message)
    revalidatePath(`/dashboard/employees/${employeeId}`)
    return { success: true }
}
