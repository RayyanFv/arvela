'use server'

import { cookies } from 'next/headers'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { ADMIN_ROLES } from '@/lib/constants/roles'

/**
 * Gets the authenticated user's profile with company_id and role.
 * Respects impersonation cookie if current real user is an admin.
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

    // Check impersonation cookie if real profile is admin
    let activeProfile = profile
    let isImpersonating = false
    const cookieStore = await cookies()
    const impersonateTargetId = cookieStore.get('impersonate_target_id')?.value

    if (impersonateTargetId && ADMIN_ROLES.includes(profile.role)) {
        const { data: targetProfile } = await admin
            .from('profiles')
            .select('id, company_id, role, full_name, email')
            .eq('id', impersonateTargetId)
            .single()

        if (targetProfile) {
            activeProfile = targetProfile
            isImpersonating = true
        }
    }

    // Role check on active profile (or skip if impersonating for debugging)
    const roles = allowedRoles || (requireAdmin ? ADMIN_ROLES : null)
    if (!isImpersonating && roles && !roles.includes(activeProfile.role)) {
        throw new Error('Unauthorized: insufficient role')
    }

    return { user, profile: activeProfile, realProfile: profile, isImpersonating, admin }
}

export async function assertSameCompany(recordCompanyId, userCompanyId) {
    if (recordCompanyId !== userCompanyId) {
        throw new Error('Unauthorized: cross-company access denied')
    }
}
