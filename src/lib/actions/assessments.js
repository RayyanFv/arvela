'use server'

import { getAuthProfile, assertSameCompany } from '@/lib/actions/auth-helpers'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email/resend'

/**
 * Log a proctoring event (candidate-facing)
 */
export async function logProctoringEvent({ assignment_id, event_type, details, screenshot_url = null }) {
    const supabase = createAdminSupabaseClient()
    
    const { error } = await supabase
        .insert({
            assignment_id,
            type: event_type, 
            details: typeof details === 'string' ? { message: details } : details,
            screenshot_url,
            timestamp: new Date().toISOString()
        })

    if (error) {
        console.error('Failed to log proctoring event:', error)
        return { error: error.message }
    }
    return { success: true }
}

/**
 * Upload proctoring screenshot to storage
 */
export async function uploadProctoringSnapshot(assignmentId, base64Data) {
    const supabase = createAdminSupabaseClient()
    
    // Clean base64
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Content, 'base64')
    
    const fileName = `${assignmentId}/${Date.now()}.jpg`
    const { data: uploadData, error: uploadErr } = await supabase
        .storage
        .from('proctoring-captures')
        .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: true
        })

    if (uploadErr) throw uploadErr

    const { data: publicUrl } = supabase
        .storage
        .from('proctoring-captures')
        .getPublicUrl(fileName)

    return publicUrl.publicUrl
}

/**
 * Mark assignment as started and record session info
 */
export async function startAssignment(id, metadata = {}) {
    const supabase = createAdminSupabaseClient()
    
    // Check current status
    const { data: current } = await supabase
        .from('assessment_assignments')
        .select('status, metadata')
        .eq('id', id)
        .single()

    if (!current) return { error: 'ASSIGNMENT_NOT_FOUND' }

    // If already started, we allow resuming ONLY if the session_id matches
    if (current.status === 'started' || current.status === 'completed') {
        const currentSession = current.metadata?.session_id
        if (currentSession && currentSession !== metadata.session_id) {
            return { error: 'SESSION_LOCKED', message: "Maaf, akses ditolak. Assessment ini sudah dimulai di perangkat/browser lain. Satu link hanya bisa digunakan oleh satu sesi pengerjaan demi keamanan." }
        }
        return { success: true, resuming: true }
    }

    const { data, error } = await supabase
        .from('assessment_assignments')
        .update({ 
            status: 'started',
            started_at: new Date().toISOString(),
            metadata: metadata 
        })
        .eq('id', id)
        .eq('status', 'sent')
        .select()

    if (error) return { error: error.message }
    if (!data || data.length === 0) return { error: 'ALREADY_STARTED' }
    
    await logProctoringEvent({
        assignment_id: id,
        event_type: 'test_started',
        details: {
            message: 'Kandidat memulai pengerjaan tes.',
            browser: metadata.browser,
            platform: metadata.platform,
            session_id: metadata.session_id
        }
    })

    return { success: true }
}


/**
 * Fetch all assessments for the current user's company
 */
export async function getAssessments() {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    const { data: assessments, error } = await admin
        .from('assessments')
        .select(`*, questions (count)`)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return assessments
}

/**
 * Create or Update an assessment (company-scoped)
 */
export async function saveAssessment(payload) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    const assessmentData = {
        title: payload.title,
        description: payload.description,
        duration_minutes: payload.duration_minutes,
        show_score: payload.show_score,
        assessment_type: payload.assessment_type || 'custom',
        dimension_config: payload.dimension_config || null,
        proctoring_enabled: payload.proctoring_enabled || false,
        company_id: profile.company_id
    }

    let id = payload.id
    if (id) {
        // Update — with company check
        const { error } = await admin
            .from('assessments')
            .update(assessmentData)
            .eq('id', id)
            .eq('company_id', profile.company_id)
        if (error) throw new Error(error.message)
    } else {
        const { data, error } = await admin
            .from('assessments')
            .insert(assessmentData)
            .select()
            .single()
        if (error) throw new Error(error.message)
        id = data.id
    }

    revalidatePath('/dashboard/assessments')
    return { success: true, id }
}

/**
 * Delete an assessment (company-scoped)
 */
export async function deleteAssessment(id) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    const { error } = await admin
        .from('assessments')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/assessments')
    return { success: true }
}

/**
 * Save questions for an assessment (company-scoped)
 */
export async function saveQuestions(assessmentId, questions) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    // Verify the assessment belongs to caller's company
    const { data: assessment } = await admin
        .from('assessments')
        .select('id')
        .eq('id', assessmentId)
        .eq('company_id', profile.company_id)
        .single()

    if (!assessment) throw new Error('Assessment not found or access denied')

    // Delete existing and insert new
    const { error: deleteError } = await admin
        .from('questions')
        .delete()
        .eq('assessment_id', assessmentId)

    if (deleteError) throw new Error(deleteError.message)

    if (questions.length > 0) {
        const formattedQuestions = questions.map((q, idx) => ({
            assessment_id: assessmentId,
            type: q.type,
            prompt: q.prompt,
            options: q.options || null,
            correct_answer: q.correct_answer || null,
            points: q.points || 10,
            sort_order: idx
        }))

        const { error: insertError } = await admin
            .from('questions')
            .insert(formattedQuestions)

        if (insertError) throw new Error(insertError.message)
    }

    revalidatePath(`/dashboard/assessments/${assessmentId}`)
    return { success: true }
}

/**
 * Assign an assessment to a candidate (company-scoped)
 */
export async function assignAssessment({ assessment_id, application_id }) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    // Verify assessment belongs to this company
    const { data: assessment } = await admin
        .from('assessments').select('id').eq('id', assessment_id).eq('company_id', profile.company_id).single()
    if (!assessment) throw new Error('Assessment not found or access denied')

    // Verify application belongs to this company
    const { data: application } = await admin
        .from('applications').select('id').eq('id', application_id).eq('company_id', profile.company_id).single()
    if (!application) throw new Error('Application not found or access denied')

    const token = crypto.randomUUID()

    const { data: assignment, error } = await admin
        .from('assessment_assignments')
        .insert({
            assessment_id,
            application_id,
            token,
            status: 'sent'
        })
        .select(`
            *,
            assessments (title, duration_minutes),
            applications (full_name, email)
        `)
        .single()

    if (error) {
        if (error.code === '23505') throw new Error('Kandidat sudah pernah diberikan assessment ini.')
        throw new Error(error.message)
    }

    // Send email invitation
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://arvela.id'
        const assessmentLink = `${baseUrl}/assessment/${token}`

        await sendEmail({
            to: assignment.applications.email,
            subject: `[Assessment] ${assignment.assessments.title} — Arvela HR`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
                    <h2 style="color: #ea580c;">Undangan Assessment Online</h2>
                    <p>Halo <strong>${assignment.applications.full_name}</strong>,</p>
                    <p>Terima kasih telah melamar. Sebagai bagian dari tahapan seleksi, kami mengundang Anda untuk mengikuti assessment online berikut:</p>
                    
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: bold; letter-spacing: 0.1em;">Nama Assessment</p>
                        <p style="margin: 5px 0 15px; font-size: 18px; font-weight: bold;">${assignment.assessments.title}</p>
                        
                        <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: bold; letter-spacing: 0.1em;">Durasi</p>
                        <p style="margin: 5px 0 0; font-size: 18px; font-weight: bold;">${assignment.assessments.duration_minutes} Menit</p>
                    </div>

                    <p>Silakan klik tombol di bawah ini untuk memulai pengerjaan.</p>
                    
                    <a href="${assessmentLink}" style="display: inline-block; background-color: #111827; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 10px;">Mulai Kerjakan Sekarang</a>
                    
                    <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">Atau salin link ini ke browser Anda: <br/> ${assessmentLink}</p>
                    <hr style="margin: 40px 0; border: 0; border-top: 1px solid #e5e7eb;" />
                    <p style="font-size: 12px; color: #9ca3af; text-align: center;">&copy; ${new Date().getFullYear()} Arvela HR System. All rights reserved.</p>
                </div>
            `
        })
    } catch (emailError) {
        console.error('Failed to send assessment email:', emailError)
    }

    revalidatePath(`/dashboard/candidates/${assignment.application_id}`)
    return { success: true, assignment }
}

/**
 * Bulk assign an assessment to multiple candidates
 */
export async function bulkAssignAssessment({ assessment_id, application_ids }) {
    // Auth & company check happens inside assignAssessment for each call
    const results = { success: 0, failed: 0, errors: [] }

    for (const app_id of application_ids) {
        try {
            await assignAssessment({ assessment_id, application_id: app_id })
            results.success++
        } catch (error) {
            results.failed++
            results.errors.push({ id: app_id, message: error.message })
        }
    }

    revalidatePath(`/dashboard/assessments/${assessment_id}`)
    return results
}

/**
 * Update score for a specific answer (company-scoped via assignment)
 */
export async function updateAnswerScore({ answer_id, points, notes, assignment_id }) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    // Verify assignment belongs to this company (via the assessment)
    const { data: asgn } = await admin
        .from('assessment_assignments')
        .select('id, assessments(company_id)')
        .eq('id', assignment_id)
        .single()
    if (!asgn || asgn.assessments?.company_id !== profile.company_id) {
        throw new Error('Assignment not found or access denied')
    }

    const { error: answerError } = await admin
        .from('answers')
        .update({ points_earned: points, reviewer_notes: notes, is_reviewed: true })
        .eq('id', answer_id)

    if (answerError) throw new Error(answerError.message)

    const { data: allAnswers, error: fetchError } = await admin
        .from('answers')
        .select('points_earned')
        .eq('assignment_id', assignment_id)

    if (fetchError) throw new Error(fetchError.message)

    const newTotal = allAnswers.reduce((sum, a) => sum + (a.points_earned || 0), 0)

    const { error: updateError } = await admin
        .from('assessment_assignments')
        .update({ total_score: newTotal })
        .eq('id', assignment_id)

    if (updateError) throw new Error(updateError.message)

    revalidatePath(`/dashboard/assessments`)
    return { success: true }
}

/**
 * Update total score for an assignment (manual override, company-scoped)
 */
export async function updateAssignmentScore({ assignment_id, points, notes }) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    // Verify assignment belongs to this company
    const { data: asgn } = await admin
        .from('assessment_assignments')
        .select('id, assessments(company_id)')
        .eq('id', assignment_id)
        .single()
    if (!asgn || asgn.assessments?.company_id !== profile.company_id) {
        throw new Error('Assignment not found or access denied')
    }

    const { error } = await admin
        .from('assessment_assignments')
        .update({ total_score: points, reviewer_notes: notes })
        .eq('id', assignment_id)

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/assessments`)
    return { success: true }
}

/**
 * Fetch a single assignment result with full details
 */
export async function getAssignmentResult(id) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    const { data: assignment, error } = await admin
        .from('assessment_assignments')
        .select(`
            *,
            assessments (*, questions (*)),
            applications (id, full_name, email, job_id, jobs (title)),
            answers (*, questions (*)),
            proctoring_logs (*)
        `)
        .eq('id', id)
        .single()

    if (error) throw new Error(error.message)
    
    // Safety check company
    if (assignment.assessments.company_id !== profile.company_id) {
        throw new Error('Access denied')
    }

    return assignment
}
