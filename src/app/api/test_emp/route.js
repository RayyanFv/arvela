import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req) {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase.from('employees').select('*, profiles!employees_profile_id_fkey(full_name)')
    return NextResponse.json({ data, error })
}
