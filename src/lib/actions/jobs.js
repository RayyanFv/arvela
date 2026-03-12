'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAuthProfile } from '@/lib/actions/auth-helpers'

async function getHRProfile() {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })
    return { profile, supabase: admin }
}

export async function createJob(formData) {
    const { profile, supabase } = await getHRProfile()

    const title = formData.get('title')
    const description = formData.get('description')
    const requirements = formData.get('requirements')
    const location = formData.get('location')
    const workType = formData.get('work_type')
    const employmentType = formData.get('employment_type')
    const deadline = formData.get('deadline') || null
    const shouldPublish = formData.get('publish') === '1'

    // Generate slug via DB function
    const { data: slug } = await supabase.rpc('generate_job_slug', {
        title,
        company_id: profile.company_id,
    })

    const payload = {
        company_id: profile.company_id,
        created_by: profile.id,
        title,
        slug,
        description,
        requirements,
        location,
        work_type: workType || null,
        employment_type: employmentType,
        deadline,
        status: shouldPublish ? 'published' : 'draft',
        published_at: shouldPublish ? new Date().toISOString() : null,
    }

    const { data: job, error } = await supabase
        .from('jobs')
        .insert(payload)
        .select('id')
        .single()

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/jobs')
    redirect('/dashboard/jobs')
}

export async function updateJob(jobId, formData) {
    const { profile, supabase } = await getHRProfile()

    const title = formData.get('title')
    const description = formData.get('description')
    const requirements = formData.get('requirements')
    const location = formData.get('location')
    const workType = formData.get('work_type')
    const employmentType = formData.get('employment_type')
    const deadline = formData.get('deadline') || null
    const newStatus = formData.get('status')

    // Ambil job lama untuk cek status transition
    const { data: existing } = await supabase
        .from('jobs')
        .select('status, published_at, closed_at')
        .eq('id', jobId)
        .eq('company_id', profile.company_id)
        .single()

    if (!existing) throw new Error('Job not found')

    const payload = {
        title,
        description,
        requirements,
        location,
        work_type: workType || null,
        employment_type: employmentType,
        deadline,
        status: newStatus,
    }

    if (newStatus === 'published' && !existing.published_at) {
        payload.published_at = new Date().toISOString()
    }
    if (newStatus === 'closed' && !existing.closed_at) {
        payload.closed_at = new Date().toISOString()
    }

    const { error } = await supabase
        .from('jobs')
        .update(payload)
        .eq('id', jobId)
        .eq('company_id', profile.company_id)

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/jobs')
    revalidatePath(`/dashboard/jobs/${jobId}`)
    redirect('/dashboard/jobs')
}

export async function deleteJob(jobId) {
    const { profile, supabase } = await getHRProfile()

    const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('company_id', profile.company_id)
        .eq('status', 'draft')

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/jobs')
    redirect('/dashboard/jobs')
}
