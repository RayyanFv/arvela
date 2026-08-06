import { cache } from 'react'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { getAuthProfile } from '@/lib/actions/auth-helpers'
import { notFound, redirect } from 'next/navigation'
import EditJobForm from './EditJobForm'

// Cached per-request — generateMetadata and the page component both need the
// same job row; cache() dedupes them into a single Supabase round trip.
const loadJob = cache(async (id) => {
    const db = createAdminSupabaseClient()
    const { data: job } = await db.from('jobs').select('*').eq('id', id).single()
    return job
})

export async function generateMetadata({ params }) {
    const { id } = await params
    const job = await loadJob(id)
    return { title: job ? `Edit: ${job.title} — Arvela HR` : 'Edit Lowongan' }
}

export default async function EditJobPage({ params }) {
    const { id } = await params
    const [{ profile }, job] = await Promise.all([
        getAuthProfile({ requireAdmin: true }),
        loadJob(id),
    ])

    if (!job || job.company_id !== profile.company_id) notFound()

    const db = createAdminSupabaseClient()
    const [{ data: company }, { data: invites }] = await Promise.all([
        db.from('companies').select('slug').eq('id', profile.company_id).single(),
        db.from('job_invites').select('id, email, token, opened_at, created_at').eq('job_id', id).order('created_at', { ascending: false }),
    ])

    return <EditJobForm job={job} companySlug={company?.slug ?? null} initialInvites={invites || []} />
}
