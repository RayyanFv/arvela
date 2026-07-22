'use server'

import { cookies } from 'next/headers'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { ADMIN_ROLES } from '@/lib/constants/roles'
import { revalidatePath } from 'next/cache'

const IMPERSONATE_COOKIE = 'impersonate_target_id'

/**
 * Impersonate (Login As) a target user.
 * Automatically provisions an employee record if not yet created.
 */
export async function impersonateUser(targetUserId) {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error('Not authenticated')

    const admin = createAdminSupabaseClient()
    const { data: realProfile } = await admin
        .from('profiles')
        .select('id, role, company_id, full_name')
        .eq('id', user.id)
        .single()

    if (!realProfile || !ADMIN_ROLES.includes(realProfile.role)) {
        throw new Error('Hanya Admin/Owner yang dapat menggunakan fitur Login As.')
    }

    const { data: targetProfile } = await admin
        .from('profiles')
        .select('id, full_name, email, role, company_id')
        .eq('id', targetUserId)
        .single()

    if (!targetProfile) throw new Error('User target tidak ditemukan.')

    // Super admin can impersonate anyone; others must be same company
    if (realProfile.role !== 'super_admin' && realProfile.company_id !== targetProfile.company_id) {
        throw new Error('Akses lintas perusahaan ditolak.')
    }

    // Auto-provision employee record if not present
    const { data: existingEmp } = await admin
        .from('employees')
        .select('id')
        .eq('profile_id', targetUserId)
        .maybeSingle()

    if (!existingEmp) {
        await admin.from('employees').insert({
            profile_id: targetUserId,
            company_id: targetProfile.company_id,
            job_title: 'Team Member',
            status: 'active',
        })
    }

    const cookieStore = await cookies()
    cookieStore.set(IMPERSONATE_COOKIE, targetUserId, {
        path: '/',
        httpOnly: false, // Accessible by client JS for smooth client-side fetch
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 4 // 4 hours
    })

    revalidatePath('/')
    return { success: true, targetUser: targetProfile }
}

/**
 * Stop impersonation and revert to original admin session.
 */
export async function stopImpersonation() {
    const cookieStore = await cookies()
    cookieStore.delete(IMPERSONATE_COOKIE)
    revalidatePath('/')
    return { success: true }
}

/**
 * Get current impersonation state.
 */
export async function getImpersonationState() {
    const cookieStore = await cookies()
    const targetId = cookieStore.get(IMPERSONATE_COOKIE)?.value

    if (!targetId) return { isImpersonating: false }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { isImpersonating: false }

    const admin = createAdminSupabaseClient()
    const { data: realProfile } = await admin.from('profiles').select('id, full_name, role, company_id').eq('id', user.id).single()
    const { data: targetProfile } = await admin.from('profiles').select('id, full_name, email, role, company_id').eq('id', targetId).single()

    if (!realProfile || !targetProfile) return { isImpersonating: false }

    return {
        isImpersonating: true,
        targetUser: targetProfile,
        realUser: realProfile
    }
}
