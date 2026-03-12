import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useProfile() {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchProfile() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Try DB profile first (with company join)
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, role, company_id, full_name, avatar_url, companies(name, slug, logo_url)')
                    .eq('id', user.id)
                    .single()

                if (data && !error) {
                    setProfile(data)
                } else {
                    // Fallback to auth metadata if DB query fails (RLS issue)
                    console.warn('Profile query failed, using auth metadata fallback:', error?.message)
                    setProfile({
                        id: user.id,
                        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                        email: user.email,
                        role: user.user_metadata?.role || 'user',
                        company_id: user.user_metadata?.company_id || null,
                        avatar_url: user.user_metadata?.avatar_url || null,
                        companies: null, // Not available in fallback
                    })
                }
            }
            setLoading(false)
        }

        fetchProfile()
    }, [])

    return { profile, loading }
}
