'use client'

/**
 * Gets the active effective user ID (returns impersonated user ID if Login As is active, else real auth user ID).
 * @param {Object} user - Supabase auth user object
 * @returns {string|null}
 */
export function getEffectiveUserId(user) {
    if (typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|; )impersonate_target_id=([^;]*)/)
        if (match && match[1]) {
            return decodeURIComponent(match[1])
        }
    }
    return user?.id || null
}
