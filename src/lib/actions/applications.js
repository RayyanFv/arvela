'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Bypass RLS using service role key explicitly for CV uploads
export async function uploadCVFile(formData, path) {
    const file = formData.get('file')
    if (!file) return { error: 'No file provided' }

    // Use service role to bypass RLS since unauthenticated users cannot usually insert to storage without a strict policy
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            cookies: {
                getAll: () => [],
                setAll: () => { }
            }
        }
    )

    const { error: uploadError } = await supabaseAdmin.storage
        .from('cvs')
        .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) {
        return { error: uploadError.message }
    }

    const { data: urlData } = supabaseAdmin.storage.from('cvs').getPublicUrl(path)
    return { url: urlData?.publicUrl }
}

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export async function updateStage(id, stage) {
    const supabase = createAdminSupabaseClient()
    const { error } = await supabase
        .from('applications')
        .update({ stage })
        .eq('id', id)

    if (error) throw new Error(error.message)
}

export async function updateNotes(id, internal_notes) {
    const supabase = createAdminSupabaseClient()
    const { error } = await supabase
        .from('applications')
        .update({ internal_notes })
        .eq('id', id)

    if (error) throw new Error(error.message)
}
