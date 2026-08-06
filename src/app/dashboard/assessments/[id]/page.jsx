import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { getEffectiveProfileServer } from '@/lib/actions/impersonate'
import { notFound, redirect } from 'next/navigation'
import AssessmentEditor from './AssessmentEditor'

const MAX_BULK_ASSIGN_CANDIDATES = 200

export async function generateMetadata({ params }) {
    return { title: `Manage Assessment — Arvela HR` }
}

export default async function AssessmentDetailPage({ params }) {
    const { id } = await params
    const res = await getEffectiveProfileServer()
    if (!res?.user) redirect('/login')
    const profile = res.profile
    if (!profile) redirect('/login')

    const admin = createAdminSupabaseClient()

    // Assessment detail and the candidates list are independent of each
    // other — both only need profile.company_id — so fetch in parallel.
    const [{ data: assessment, error }, { data: candidates }] = await Promise.all([
        admin
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
            .single(),

        // Candidates for bulk assignment — capped to keep the dropdown/list
        // from growing unbounded for companies with a large applicant pool.
        admin
            .from('applications')
            .select(`
                id, full_name, email, stage,
                jobs (title)
            `)
            .eq('company_id', profile.company_id)
            .order('created_at', { ascending: false })
            .limit(MAX_BULK_ASSIGN_CANDIDATES),
    ])

    if (error || !assessment) notFound()

    return <AssessmentEditor assessment={assessment} candidates={candidates || []} />
}
