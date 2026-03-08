import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createAdminSupabaseClient()
    const { data: all_apps, error: e1 } = await supabase.from('applications').select('id, full_name, stage')

    // Test with matching what new/page.js is doing
    const { data: query_apps, error: e2 } = await supabase
        .from('applications')
        .select('id, full_name, email, jobs(title)')
        .in('stage', ['assessment', 'interview'])

    return NextResponse.json({ all_apps, query_apps, e1, e2 })
}
