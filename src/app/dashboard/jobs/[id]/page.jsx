import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EditJobForm from './EditJobForm'

export async function generateMetadata({ params }) {
    const { id } = await params
    const db = createAdminSupabaseClient()
    const { data: job } = await db.from('jobs').select('title').eq('id', id).single()
    return { title: job ? `Edit: ${job.title} — Arvela HR` : 'Edit Lowongan' }
}

export default async function EditJobPage({ params }) {
    const { id } = await params
    const authClient = await createServerSupabaseClient()
    const { data: { user } } = await authClient.auth.getUser()

    const db = createAdminSupabaseClient()

    const { data: profile } = await db
        .from('profiles')
        .select('company_id, role')
        .eq('id', user.id)
        .single()

    if (!profile || !['hr', 'super_admin'].includes(profile.role)) {
        redirect('/dashboard/jobs')
    }

    const [{ data: job }, { data: company }] = await Promise.all([
        db.from('jobs').select('*').eq('id', id).eq('company_id', profile.company_id).single(),
        db.from('companies').select('slug').eq('id', profile.company_id).single()
    ])

    if (!job) notFound()

    return <EditJobForm job={job} companySlug={company?.slug ?? null} />
}
