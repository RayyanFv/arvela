import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import InterviewSessionInterface from './InterviewSessionInterface'

export default async function InterviewSessionPage({ params }) {
    const { id } = await params
    const supabase = await createAdminSupabaseClient()

    // 1. Get current HR user
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: hrProfile } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', authUser?.id)
        .single()

    // 2. Fetch interview with candidate/application info
    const { data: interview, error } = await supabase
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

    if (error || !interview) notFound()

    return (
        <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
            <InterviewSessionInterface interview={interview} hrProfile={hrProfile} />
        </div>
    )
}
