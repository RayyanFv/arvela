'use server'

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email/resend'
import { getInterviewInvitationTemplate } from '@/lib/email/templates'
import { format as formatDate } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

/**
 * Get all interview templates for the company
 */
export async function getInterviewTemplates() {
    const authSupabase = await createServerSupabaseClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const admin = createAdminSupabaseClient()
    const { data: profile } = await admin
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

    const { data, error } = await admin
        .from('interview_templates')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

/**
 * Get a single interview template
 */
export async function getInterviewTemplate(id) {
    const admin = createAdminSupabaseClient()
    const { data, error } = await admin
        .from('interview_templates')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw new Error(error.message)
    return data
}

/**
 * Create/Update interview template
 */
export async function saveInterviewTemplate(params) {
    const authSupabase = await createServerSupabaseClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const admin = createAdminSupabaseClient()
    const { data: profile } = await admin
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

    const { data, error } = await admin
        .from('interview_templates')
        .upsert({
            id: params.id || undefined,
            company_id: profile.company_id,
            title: params.title,
            questions: params.questions, // array of strings or objects
            scorecard_criteria: params.scorecard_criteria || [], // array of objects { key, label, desc, max_score }
            created_by: user.id
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/settings/interview-templates')
    return data
}

/**
 * Delete interview template
 */
export async function deleteInterviewTemplate(id) {
    const admin = createAdminSupabaseClient()
    const { error } = await admin
        .from('interview_templates')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/settings/interview-templates')
    return { success: true }
}

/**
 * Schedule an interview
 */
export async function scheduleInterview(params) {
    const authSupabase = await createServerSupabaseClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Universal Parameter Mapping (Merge old and new styles)
    const application_id = params.application_id || params.get?.('application_id')
    const scheduled_date = params.scheduled_date || params.date || params.get?.('date')
    const scheduled_time = params.scheduled_time || params.time || params.get?.('time')
    const template_id = params.template_id || null
    const raw_format = params.format || params.get?.('format') || 'online'
    const location_link = params.location_link || params.link || params.get?.('link')

    const admin = createAdminSupabaseClient()
    const { data: profile } = await admin
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

    // Create unique jitsi room id if online_internal
    let jitsi_room_id = null
    let final_link = location_link

    if (raw_format === 'online_internal' || raw_format === 'online') {
        jitsi_room_id = `arvela-${application_id.substring(0, 8)}-${Date.now()}`
    }

    const { data, error } = await admin
        .from('interviews')
        .insert({
            application_id,
            company_id: profile.company_id,
            scheduled_date,
            scheduled_time,
            template_id: (!template_id || template_id === '' || template_id === 'none') ? null : template_id,
            format: (raw_format === 'online_internal' || raw_format === 'online') ? 'online' : (raw_format === 'online_external' ? 'online' : 'offline'),
            location_link: final_link,
            jitsi_room_id,
            status: 'scheduled'
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    // Send Email Invitation
    try {
        const { data: appData } = await admin
            .from('applications')
            .select(`full_name, email, jobs(title), companies(name)`)
            .eq('id', application_id)
            .single()

        if (appData) {
            const displayFormat = (raw_format === 'online_internal' || raw_format === 'online') ? 'online' : 'offline'
            const emailLink = displayFormat === 'online' 
                ? (jitsi_room_id ? `${process.env.NEXT_PUBLIC_SITE_URL}/portal/interview/${data.id}` : final_link)
                : final_link

            await sendEmail({
                to: appData.email,
                subject: `Undangan Wawancara: ${appData.jobs.title} - ${appData.companies.name}`,
                html: getInterviewInvitationTemplate({
                    candidateName: appData.full_name,
                    jobTitle: appData.jobs.title,
                    companyName: appData.companies.name,
                    date: formatDate(new Date(scheduled_date), 'EEEE, d MMMM yyyy', { locale: localeID }),
                    time: scheduled_time,
                    format: displayFormat,
                    linkUrl: emailLink
                })
            })
        }
    } catch (emailErr) {
        console.error('Failed to send interview email:', emailErr)
    }

    revalidatePath(`/dashboard/candidates/${application_id}`)
    revalidatePath(`/dashboard/interviews`)
    return data
}

/**
 * Start/Prepare interview session (clones questions from template to session_questions)
 */
export async function startInterviewSession(interviewId) {
    const supabase = await createAdminSupabaseClient()
    
    // We get current interview to check if session_questions is already set
    const { data: interview, error: fetchErr } = await supabase
        .from('interviews')
        .select(`
            *, 
            applications (id, full_name, email, jobs (title)), 
            interview_templates (*)
        `)
        .eq('id', interviewId)
        .single()

    if (fetchErr) throw new Error(fetchErr.message)

    if (!interview.session_questions || interview.session_questions.length === 0) {
        const templateQuestions = interview.interview_templates?.questions || []
        const initialQuestions = templateQuestions.map(q => ({
            id: crypto.randomUUID(),
            text: typeof q === 'string' ? q : (q.question || q.text),
            answer: '',
            is_incidental: false
        }))

        const templateScorecard = interview.interview_templates?.scorecard_criteria || [
            { key: 'score_communication', label: 'Komunikasi', desc: 'Kejelasan, listening, dsb.', max_score: 5 },
            { key: 'score_technical', label: 'Kompetensi Teknis', desc: 'Skill relevan dengan posisi', max_score: 5 },
            { key: 'score_culture_fit', label: 'Culture Fit', desc: 'Alignment nilai perusahaan', max_score: 5 }
        ]

        const initialScorecard = {
            scores: {}, 
            recommendation: '', 
            criteria: templateScorecard
        }
        templateScorecard.forEach(c => initialScorecard.scores[c.key] = 0)

        const { error: updateErr } = await supabase
            .from('interviews')
            .update({ 
                session_questions: initialQuestions,
                session_scorecard: (interview.session_scorecard && Object.keys(interview.session_scorecard).length > 0)
                    ? interview.session_scorecard 
                    : initialScorecard,
                status: 'scheduled'
            })
            .eq('id', interviewId)

        if (updateErr) throw new Error(updateErr.message)
        return { 
            ...interview, 
            session_questions: initialQuestions,
            session_scorecard: (interview.session_scorecard && Object.keys(interview.session_scorecard).length > 0)
                ? interview.session_scorecard 
                : initialScorecard
        }
    }

    return interview
}

/**
 * Reset and pull latest questions + scorecard from template
 */
export async function resetInterviewSession(interviewId) {
    const supabase = await createAdminSupabaseClient()
    
    // Force set to null first to trigger re-init in startInterviewSession 
    // OR just fetch and init right here.
    const { data: interview, error: fetchErr } = await supabase
        .from('interviews')
        .select(`
            *, 
            applications (id, full_name, email, jobs (title)), 
            interview_templates (*)
        `)
        .eq('id', interviewId)
        .single()

    if (fetchErr) throw new Error(fetchErr.message)

    const templateQuestions = interview.interview_templates?.questions || []
    const initialQuestions = templateQuestions.map(q => ({
        id: crypto.randomUUID(),
        text: typeof q === 'string' ? q : (q.question || q.text),
        answer: '',
        is_incidental: false
    }))

    const templateScorecard = interview.interview_templates?.scorecard_criteria || [
        { key: 'score_communication', label: 'Komunikasi', desc: 'Kejelasan, listening, dsb.', max_score: 5 },
        { key: 'score_technical', label: 'Kompetensi Teknis', desc: 'Skill relevan dengan posisi', max_score: 5 },
        { key: 'score_culture_fit', label: 'Culture Fit', desc: 'Alignment nilai perusahaan', max_score: 5 }
    ]

    const initialScorecard = {
        scores: {}, 
        recommendation: '', 
        criteria: templateScorecard
    }
    templateScorecard.forEach(c => initialScorecard.scores[c.key] = 0)

    const { error: updateErr } = await supabase
        .from('interviews')
        .update({ 
            session_questions: initialQuestions,
            session_scorecard: initialScorecard
        })
        .eq('id', interviewId)

    if (updateErr) throw new Error(updateErr.message)
    return { ...interview, session_questions: initialQuestions, session_scorecard: initialScorecard }
}

/**
 * Update session questions and scorecard real-time
 */
export async function updateInterviewSession(interviewId, sessionQuestions, sessionScorecard) {
    const supabase = await createAdminSupabaseClient()
    
    const { error } = await supabase
        .from('interviews')
        .update({ 
            session_questions: sessionQuestions,
            session_scorecard: sessionScorecard 
        })
        .eq('id', interviewId)

    if (error) throw new Error(error.message)
    revalidatePath(`/dashboard/interviews/${interviewId}/session`)
    return { success: true }
}

/**
 * Complete the interview
 */
export async function completeInterview(interviewId, finalNotes = '') {
    const supabase = await createAdminSupabaseClient()
    
    const { error } = await supabase
        .from('interviews')
        .update({ 
            status: 'done',
            notes: finalNotes
        })
        .eq('id', interviewId)

    if (error) throw new Error(error.message)
    revalidatePath(`/dashboard/interviews`)
    revalidatePath(`/dashboard/interviews/${interviewId}/session`)
    return { success: true }
}

/**
 * Get session result
 */
export async function getInterviewSession(id) {
    const admin = createAdminSupabaseClient()
    const { data, error } = await admin
        .from('interviews')
        .select(`
            *,
            applications (
                id, full_name, email,
                jobs (title)
            ),
            interview_templates (*)
        `)
        .eq('id', id)
        .single()

    if (error) throw new Error(error.message)
    return data
}

/**
 * Get all interviews for the company
 */
export async function getAllInterviews() {
    const authSupabase = await createServerSupabaseClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const admin = createAdminSupabaseClient()
    const { data: profile } = await admin
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

    const { data, error } = await admin
        .from('interviews')
        .select(`
            *,
            applications (
                id, full_name, email,
                jobs (title)
            ),
            interview_templates (title)
        `)
        .eq('company_id', profile.company_id)
        .order('scheduled_date', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

/**
 * Publicly fetch interview session info (minimal)
 */
export async function getPublicInterview(id) {
    const admin = createAdminSupabaseClient()
    const { data, error } = await admin
        .from('interviews')
        .select(`
            id,
            jitsi_room_id,
            company_id,
            companies (
                slug
            ),
            applications (
                full_name,
                email,
                jobs (title)
            )
        `)
        .eq('id', id)
        .single()

    if (error) throw new Error(error.message)
    
    return {
        id: data.id,
        jitsi_room_id: data.jitsi_room_id,
        candidate_name: data.applications.full_name,
        candidate_email: data.applications.email,
        job_title: data.applications.jobs.title,
        company_slug: data.companies?.slug || 'arvela'
    }
}
