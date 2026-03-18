'use server'

import { getAuthProfile, assertSameCompany } from '@/lib/actions/auth-helpers'
import { sendEmail } from '@/lib/email/resend'
import { getInterviewInvitationTemplate } from '@/lib/email/templates'
import { revalidatePath } from 'next/cache'

// ─── Interview Templates ──────────────────────────────────────────────────────
export async function getInterviewTemplates() {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })
    const { data, error } = await admin
        .from('interview_templates')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data
}

export async function saveInterviewTemplate(payload) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })
    const data = {
        company_id: profile.company_id,
        title: payload.title,
        questions: payload.questions || [],
        created_by: profile.id
    }
    if (payload.id) {
        const { error } = await admin.from('interview_templates').update(data).eq('id', payload.id).eq('company_id', profile.company_id)
        if (error) throw new Error(error.message)
    } else {
        const { error } = await admin.from('interview_templates').insert(data)
        if (error) throw new Error(error.message)
    }
    revalidatePath('/dashboard/settings/interview-templates')
    return { success: true }
}

export async function deleteInterviewTemplate(id) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })
    const { error } = await admin.from('interview_templates').delete().eq('id', id).eq('company_id', profile.company_id)
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/settings/interview-templates')
    return { success: true }
}

// ─── Scheduling ───────────────────────────────────────────────────────────────
export async function scheduleInterview(payload) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    try {
        // 1. Fetch application — verify it belongs to caller's company
        const { data: app, error: appError } = await admin
            .from('applications')
            .select(`
                id, 
                full_name, 
                email, 
                company_id,
                jobs (title),
                companies (name)
            `)
            .eq('id', payload.application_id)
            .eq('company_id', profile.company_id)
            .single()

        if (appError || !app) throw new Error('Data lamaran tidak ditemukan atau akses ditolak.')

        // 2. Insert interview record
        let locationLink = payload.link
        let jitsiRoomId = null

        if (payload.format === 'online' && !locationLink) {
            // Generate Jitsi Link if not provided
            jitsiRoomId = `arvela-${app.company_id.slice(0,8)}-${Math.random().toString(36).substring(2, 10)}`
            locationLink = `https://meet.jit.si/${jitsiRoomId}`
        }

        const { data: interview, error: insertError } = await admin
            .from('interviews')
            .insert({
                application_id: app.id,
                company_id: app.company_id,
                scheduled_date: payload.date,
                scheduled_time: payload.time,
                duration_mins: parseInt(payload.duration) || 60,
                format: payload.format,
                location_link: locationLink,
                jitsi_room_id: jitsiRoomId,
                template_id: payload.template_id || null,
                status: 'scheduled'
            })
            .select()
            .single()

        if (insertError) {
            console.warn("Failed inserting to interviews:", insertError)
        }

        // 3. Move candidate stage to interview
        await admin
            .from('applications')
            .update({ stage: 'interview', updated_at: new Date().toISOString() })
            .eq('id', app.id)
            .eq('company_id', profile.company_id)

        // 4. Send email invitation
        await sendEmail({
            to: app.email,
            subject: `Undangan Wawancara: ${app.jobs.title} di ${app.companies.name}`,
            html: getInterviewInvitationTemplate({
                candidateName: app.full_name,
                jobTitle: app.jobs.title,
                companyName: app.companies.name,
                date: payload.date,
                time: payload.time,
                format: payload.format,
                linkUrl: locationLink
            })
        }).catch(err => console.error("Email API failed:", err))

        return { success: true }
    } catch (error) {
        console.error("scheduleInterview Error:", error)
        throw new Error(error.message)
    }
}
