'use server'

import { getAuthProfile, assertSameCompany } from '@/lib/actions/auth-helpers'
import { sendEmail } from '@/lib/email/resend'
import { getInterviewInvitationTemplate } from '@/lib/email/templates'

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
        const { data: interview, error: insertError } = await admin
            .from('interviews')
            .insert({
                application_id: app.id,
                company_id: app.company_id,
                scheduled_date: payload.date,
                scheduled_time: payload.time,
                duration_mins: parseInt(payload.duration) || 60,
                format: payload.format,
                location_link: payload.link,
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
                linkUrl: payload.link
            })
        }).catch(err => console.error("Email API failed:", err))

        return { success: true }
    } catch (error) {
        console.error("scheduleInterview Error:", error)
        throw new Error(error.message)
    }
}
