import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AssessmentEditor from './AssessmentEditor'

export async function generateMetadata({ params }) {
    return { title: `Manage Assessment — Arvela HR` }
}

export default async function AssessmentDetailPage({ params }) {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const admin = createAdminSupabaseClient()

    // Get current user's company_id
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await admin
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

    // Fetch assessment details with assignments and questions — scoped to company
    const { data: assessment, error } = await admin
        .from('assessments')
        .select(`
            *,
            questions (*),
            assessment_assignments (
                *,
                applications (full_name, email)
            )
        `)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .single()

    if (error || !assessment) notFound()

    // Fetch candidates for bulk assignment
    const { data: candidates } = await admin
        .from('applications')
        .select(`
            id, full_name, email, stage,
            jobs (title)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    return <AssessmentEditor assessment={assessment} candidates={candidates || []} />
}
