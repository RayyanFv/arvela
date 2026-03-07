import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Client dengan anon key + cookie session → RLS berlaku untuk user biasa
// Gunakan di halaman publik atau saat butuh RLS per-user
export async function createServerSupabaseClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            }
        }
    )
}

// Client dengan service role key → BYPASS RLS sepenuhnya
// Gunakan di Server Components/Actions dashboard (sudah terjamin auth di level Next.js middleware)
// JANGAN gunakan di client-side atau halaman publik
export function createAdminSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
