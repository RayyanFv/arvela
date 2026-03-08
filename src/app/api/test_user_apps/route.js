import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req) {
    const supabase = await createServerSupabaseClient()

    // get user profile
    const { data: { user } } = await supabase.auth.getUser()
    let profile = null;
    if (user) {
        const p = await supabase.from('profiles').select('*').eq('id', user.id).single()
        profile = p.data
    }

    const { data: q1, error: e1 } = await supabase
        .from('applications')
        .select('id, full_name, email, jobs(title), stage, company_id')
        .in('stage', ['assessment', 'interview'])

    const { data: q2, error: e2 } = await supabase
        .from('applications')
        .select('id, full_name, email, jobs(title), stage, company_id')

    return NextResponse.json({
        user: user?.id,
        profile,
        in_stage_data: q1,
        in_stage_error: e1,
        all_data: q2,
        all_error: e2
    })
}
