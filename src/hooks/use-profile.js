// hooks/use-profile.js
// Optimized: memoize/cache profile in module-level variable
// sehingga multiple components yang pakai hook ini di halaman yang sama
// tidak trigger duplicate getUser() + profiles.select() calls.

import { useState, useEffect } from 'react'
import { getEffectiveProfileServer } from '@/lib/actions/impersonate'

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
            const res = await getEffectiveProfileServer()
            const profile = res?.profile || null
            _cachedProfile = profile
            return profile
        } catch (e) {

            return null
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
