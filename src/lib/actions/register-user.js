'use server'

import { getAuthProfile } from '@/lib/actions/auth-helpers'
import { canRegisterRole, ROLES, ROLE_LABELS } from '@/lib/constants/roles'
import { revalidatePath } from 'next/cache'

/**
 * Register a new user (admin-only).
 *
 * Hierarchy enforcement:
 *   super_admin → can create owner, hr_admin, employee
 *   owner       → can create hr_admin, employee
 *   hr_admin    → can create employee
 *
 * @param {Object} payload
 * @param {string} payload.email
 * @param {string} payload.full_name
 * @param {string} payload.role        - Target role for the new user
 * @param {string} [payload.department] - Optional department
 */
export async function registerUser(payload) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    const { email, full_name, role: targetRole, department } = payload

    // ─── Validate inputs ──────────────────────
    if (!email || !full_name || !targetRole) {
        throw new Error('Email, nama lengkap, dan role wajib diisi.')
    }

    // ─── Hierarchy check ──────────────────────
    if (!canRegisterRole(profile.role, targetRole)) {
        throw new Error(
            `Role ${ROLE_LABELS[profile.role] || profile.role} tidak bisa mendaftarkan ${ROLE_LABELS[targetRole] || targetRole}.`
        )
    }

    // ─── Create auth user ─────────────────────
    const tempPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 12) + 'Aa1!'

    const { data: newAuth, error: authError } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
            full_name,
            role: targetRole,
        },
    })

    if (authError) {
        if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
            throw new Error('Email sudah terdaftar di sistem.')
        }
        throw new Error('Gagal membuat akun: ' + authError.message)
    }

    const userId = newAuth.user.id

    // Wait for DB trigger to create profile, then ensure it has correct data
    await new Promise(r => setTimeout(r, 800))

    await admin.from('profiles').upsert({
        id: userId,
        email,
        full_name,
        role: targetRole,
        company_id: profile.company_id,
        department: department || null,
    }, { onConflict: 'id' })

    // ─── If employee, also create employee record ─────
    if (targetRole === ROLES.EMPLOYEE) {
        const { error: empError } = await admin.from('employees').insert({
            profile_id: userId,
            company_id: profile.company_id,
            job_title: department ? `Staff ${department}` : 'Team Member',
            department: department || 'General',
            status: 'active',
        })

        if (empError && empError.code !== '23505') {
            console.warn('Employee record creation failed:', empError.message)
        }
    }

    // ─── Generate password reset link for the new user ────
    let resetUrl = null
    try {
        const { data: resetLink } = await admin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://arvela.id'}/reset-password` }
        })
        resetUrl = resetLink?.properties?.action_link || null
    } catch (e) {
        console.warn('Failed to generate reset link:', e.message)
    }

    revalidatePath('/dashboard')
    return {
        success: true,
        userId,
        resetUrl,
        message: `Akun ${ROLE_LABELS[targetRole]} berhasil dibuat untuk ${email}.`,
    }
}

/**
 * Get the list of roles that the current user can register.
 */
export async function getRegisterableRoles() {
    const { profile } = await getAuthProfile({ requireAdmin: true })

    const roles = []
    const registrable = (() => {
        switch (profile.role) {
            case ROLES.SUPER_ADMIN:
                return [ROLES.OWNER, ROLES.HR_ADMIN, ROLES.EMPLOYEE]
            case ROLES.OWNER:
                return [ROLES.HR_ADMIN, ROLES.EMPLOYEE]
            case ROLES.HR_ADMIN:
                return [ROLES.EMPLOYEE]
            default:
                return []
        }
    })()

    for (const r of registrable) {
        roles.push({ value: r, label: ROLE_LABELS[r] })
    }

    return roles
}
