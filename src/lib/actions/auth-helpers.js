'use server'

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { ADMIN_ROLES } from '@/lib/constants/roles'

/**
 * Gets the authenticated user's profile with company_id and role.
 * Uses the server (RLS-respecting) client for auth, and admin client to
 * read the profile (which might be restricted by RLS in some configurations).
 *
 * @param {Object} options
 * @param {boolean} options.requireAdmin  – Throw if user is not an admin role (default: true)
 * @param {string[]} options.allowedRoles – Override: only these roles are allowed (optional)
 * @returns {{ user, profile: { id, company_id, role, full_name }, admin: SupabaseClient }}
 */
export async function getAuthProfile({ requireAdmin = true, allowedRoles } = {}) {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        throw new Error('Not authenticated')
    }

    const admin = createAdminSupabaseClient()
    const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('id, company_id, role, full_name, email')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        throw new Error('Profile not found')
    }

    if (!profile.company_id) {
        throw new Error('User has no company assigned')
    }

    // Role check
    const roles = allowedRoles || (requireAdmin ? ADMIN_ROLES : null)
    if (roles && !roles.includes(profile.role)) {
        throw new Error('Unauthorized: insufficient role')
    }

    return { user, profile, admin }
}

/**
 * Verifies that a given record belongs to the user's company.
 * Useful as an additional guard after fetching data.
 *
 * @param {string} recordCompanyId - company_id from the fetched record
 * @param {string} userCompanyId   - company_id from user's profile
 */
export async function assertSameCompany(recordCompanyId, userCompanyId) {
    if (recordCompanyId !== userCompanyId) {
        throw new Error('Unauthorized: cross-company access denied')
    }
}
