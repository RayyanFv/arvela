'use server'

import { getAuthProfile } from '@/lib/actions/auth-helpers'
import { revalidatePath } from 'next/cache'

/**
 * Issues a completion certificate for the calling employee, if eligible.
 * Idempotent: returns the existing certificate if one was already issued.
 */
export async function issueCourseCertificate(courseId) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: false })

    const { data: employee } = await admin
        .from('employees')
        .select('id, company_id')
        .eq('profile_id', profile.id)
        .single()

    if (!employee) throw new Error('Data karyawan tidak ditemukan.')

    const { data: course } = await admin
        .from('lms_courses')
        .select('id, has_certificate')
        .eq('id', courseId)
        .eq('company_id', employee.company_id)
        .single()

    if (!course) throw new Error('Kursus tidak ditemukan.')
    if (!course.has_certificate) throw new Error('Kursus ini tidak menyediakan sertifikat.')

    // Already issued — return it instead of erroring, callers can retry safely.
    const { data: existing } = await admin
        .from('lms_certificates')
        .select('*')
        .eq('course_id', courseId)
        .eq('employee_id', employee.id)
        .maybeSingle()

    if (existing) return existing

    // Verify actual completion server-side (never trust client-computed progress).
    const { data: sections } = await admin
        .from('lms_course_sections')
        .select('id')
        .eq('course_id', courseId)

    const sectionIds = (sections || []).map(s => s.id)
    let totalContents = 0
    let completedContents = 0

    if (sectionIds.length > 0) {
        const { data: contents } = await admin
            .from('lms_course_contents')
            .select('id')
            .in('section_id', sectionIds)
        const contentIds = (contents || []).map(c => c.id)
        totalContents = contentIds.length

        if (totalContents > 0) {
            const { count } = await admin
                .from('lms_content_progress')
                .select('*', { count: 'exact', head: true })
                .eq('employee_id', employee.id)
                .in('content_id', contentIds)
                .eq('is_completed', true)
            completedContents = count || 0
        }
    }

    if (totalContents === 0 || completedContents < totalContents) {
        throw new Error('Kursus belum diselesaikan sepenuhnya.')
    }

    const certificateNo = `ARV-${new Date().getFullYear()}-${courseId.slice(0, 4).toUpperCase()}-${employee.id.slice(0, 6).toUpperCase()}`

    const { data: cert, error } = await admin
        .from('lms_certificates')
        .insert({
            course_id: courseId,
            employee_id: employee.id,
            certificate_no: certificateNo,
            issued_at: new Date().toISOString(),
        })
        .select()
        .single()

    if (error) throw new Error('Gagal menerbitkan sertifikat: ' + error.message)

    revalidatePath('/dashboard/lms')
    return cert
}
