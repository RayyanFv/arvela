'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { getInterviewInvitationTemplate } from '@/lib/email/templates'

export async function scheduleInterview(payload) {
    const supabase = createAdminSupabaseClient()

    try {
        // 1. Ambil data kandidat & company
        const { data: app, error: appError } = await supabase
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
            .single()

        if (appError) throw new Error('Data lamaran tidak ditemukan: ' + appError.message)

        // 2. Insert ke tabel interviews
        const { data: interview, error: insertError } = await supabase
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

        // Abaikan error jika tabel interviews belum dibikin (fallback)
        if (insertError) {
            console.warn("Failed inserting to interviews:", insertError)
            // Jangan throw error keras jika tabel belum ada agar alur tetap jalan
        }

        // 3. Pindah stage kandidat ke interview
        await supabase
            .from('applications')
            .update({ stage: 'interview', updated_at: new Date().toISOString() })
            .eq('id', app.id)

        // 4. Kirim email undangan
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
