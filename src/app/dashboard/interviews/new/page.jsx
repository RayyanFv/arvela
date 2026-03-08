import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import NewInterviewFormClient from './NewInterviewClient'

export const dynamic = 'force-dynamic'

export default async function NewInterviewPage() {
    const supabase = await createServerSupabaseClient()

    const { data: candidates, error } = await supabase
        .from('applications')
        .select(`
            id, 
            full_name, 
            email, 
            stage,
            jobs (title)
        `)
        .in('stage', ['assessment', 'interview'])
        .order('full_name', { ascending: true })

    // In case RLS blocks the joined table "jobs(title)",
    // error will be populated or candidates will be null.
    // If candidates is returned successfully, it will be passed to client.

    const today = new Date().toISOString().split('T')[0]
    const { data: upcomingInterviews, error: interviewsError } = await supabase
        .from('interviews')
        .select(`
            id,
            scheduled_date,
            scheduled_time,
            duration_mins,
            applications (full_name)
        `)
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })

    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat form wawancara...</div>}>
            <NewInterviewFormClient
                candidates={candidates || []}
                dbError={error?.message}
                upcoming={upcomingInterviews || []}
            />
        </Suspense>
    )
}
