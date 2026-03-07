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
                const { data } = await supabase
                    .from('profiles')
                    .select('id, role, company_id, full_name, avatar_url, companies(name, slug, logo_url)')
                    .eq('id', user.id)
                    .single()

                setProfile(data)
            }
            setLoading(false)
        }

        fetchProfile()
    }, [])

    return { profile, loading }
}
