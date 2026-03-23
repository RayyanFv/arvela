// hooks/use-profile.js
// Optimized: memoize/cache profile in module-level variable
// sehingga multiple components yang pakai hook ini di halaman yang sama
// tidak trigger duplicate getUser() + profiles.select() calls.

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Module-level cache — shared across all useProfile() calls in same session ──
let _cachedProfile = null
let _inflightPromise = null  // deduplicate concurrent fetches

async function fetchProfileOnce() {
    // Return cached result immediately if available
    if (_cachedProfile) return _cachedProfile

    // Deduplicate: if already fetching, wait for same promise
    if (_inflightPromise) return _inflightPromise

    _inflightPromise = (async () => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null

            const { data, error } = await supabase
                .from('profiles')
                .select('id, role, company_id, full_name, avatar_url, companies(name, slug, logo_url)')
                .eq('id', user.id)
                .single()

            const profile = (data && !error) ? data : {
                id: user.id,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                email: user.email,
                role: user.user_metadata?.role || 'user',
                company_id: user.user_metadata?.company_id || null,
                avatar_url: user.user_metadata?.avatar_url || null,
                companies: null,
            }

            _cachedProfile = profile
            return profile
        } finally {
            _inflightPromise = null
        }
    })()

    return _inflightPromise
}

// Call this on logout to clear the cache
export function clearProfileCache() {
    _cachedProfile = null
    _inflightPromise = null
}

export function useProfile() {
    const [profile, setProfile] = useState(_cachedProfile) // sync if already cached
    const [loading, setLoading] = useState(!_cachedProfile)

    useEffect(() => {
        if (_cachedProfile) return  // already cached, nothing to do
        fetchProfileOnce().then(p => {
            setProfile(p)
            setLoading(false)
        })
    }, [])

    return { profile, loading }
}
