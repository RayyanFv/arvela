'use server'

import { getAuthProfile } from '@/lib/actions/auth-helpers'
import { revalidatePath } from 'next/cache'

/**
 * Add invite-only recipients for a job. Each email gets a unique access token.
 * Safe to call repeatedly — existing emails are left untouched (unique constraint).
 */
export async function addJobInvites(jobId, emails) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    const { data: job } = await admin.from('jobs').select('id, company_id').eq('id', jobId).eq('company_id', profile.company_id).single()
    if (!job) throw new Error('Lowongan tidak ditemukan.')

    const cleanEmails = [...new Set(
        emails.map(e => e.trim().toLowerCase()).filter(Boolean)
    )]
    if (cleanEmails.length === 0) throw new Error('Masukkan minimal satu email.')

    const rows = cleanEmails.map(email => ({ job_id: jobId, email }))
    const { error } = await admin.from('job_invites').upsert(rows, { onConflict: 'job_id,email', ignoreDuplicates: true })
    if (error) throw new Error('Gagal menambahkan undangan: ' + error.message)

    revalidatePath(`/dashboard/jobs/${jobId}`)
    return { success: true, count: cleanEmails.length }
}

export async function removeJobInvite(inviteId) {
    const { admin } = await getAuthProfile({ requireAdmin: true })

    const { data: invite } = await admin.from('job_invites').select('job_id').eq('id', inviteId).single()
    const { error } = await admin.from('job_invites').delete().eq('id', inviteId)
    if (error) throw new Error(error.message)

    if (invite) revalidatePath(`/dashboard/jobs/${invite.job_id}`)
    return { success: true }
}
