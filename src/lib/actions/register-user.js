'use server'

import { getAuthProfile } from '@/lib/actions/auth-helpers'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { canRegisterRole, ROLES, ROLE_LABELS } from '@/lib/constants/roles'
import { revalidatePath } from 'next/cache'
import { checkEmployeeQuota } from '@/lib/quota-enforcement'

/**
 * Register a new user (admin-only).
 * Supports: Unit Induk, Unit Penugasan, Pangkat, Jabatan Fungsional
 */
export async function registerUser(payload) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    const {
        email, full_name, role: targetRole,
        company_id,
        // Employee-specific fields
        job_title,
        home_unit_id,
        work_unit_id,
        job_grade_id,
        manager_id,
        application_id,
        password,
        // Legacy department text field (kept for backward compat)
        department,
    } = payload

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

    // ─── Quota check ──────────────────────────
    const companyIdForQuota = profile.role === ROLES.SUPER_ADMIN && company_id ? company_id : (profile?.company_id || company_id)
    if (companyIdForQuota) {
        await checkEmployeeQuota(companyIdForQuota, admin, 1)
    }

    // ─── Create auth user ─────────────────────
    const finalPassword = password || (crypto.randomUUID().replace(/-/g, '').slice(0, 12) + 'Aa1!')

    const { data: newAuth, error: authError } = await admin.auth.admin.createUser({
        email,
        password: finalPassword,
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

    const targetCompanyId = profile.role === ROLES.SUPER_ADMIN && company_id ? company_id : profile.company_id

    await admin.from('profiles').upsert({
        id: userId,
        email,
        full_name,
        role: targetRole,
        company_id: targetCompanyId,
        department: department || null,
    }, { onConflict: 'id' })

    // ─── If employee, also create employee record with unit + grade ─────
    if (targetRole === ROLES.EMPLOYEE) {
        const { error: empError } = await admin.from('employees').upsert({
            profile_id:     userId,
            company_id:     targetCompanyId,
            application_id: application_id || null,
            job_title:      job_title || (department ? `Staff ${department}` : 'Team Member'),
            department:     department || 'General',
            home_unit_id:   home_unit_id || null,
            work_unit_id:   work_unit_id || null,
            job_grade_id:   job_grade_id || null,
            manager_id:     manager_id || null,
            status:         'active',
        }, { onConflict: 'profile_id' })

        if (empError) {

        }

        // ─── If linked to application, update application stage ─────
        if (application_id) {
            await admin.from('applications')
                .update({ stage: 'hired', updated_at: new Date().toISOString() })
                .eq('id', application_id)
                .eq('company_id', targetCompanyId)
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
 * Get the list of roles, units, and grades that the current user can use when registering.
 */
export async function getRegisterableRoles() {
    let profile = null
    let admin = createAdminSupabaseClient()
    try {
        const auth = await getAuthProfile({ requireAdmin: false })
        profile = auth.profile
        admin = auth.admin
    } catch (e) {}

    const userRole = profile?.role || ROLES.HR_ADMIN

    // Strict role hierarchy:
    // hr_admin -> employee only
    // owner -> hr_admin, employee
    // super_admin -> owner, hr_admin, employee, super_admin
    const registrable = (() => {
        switch (userRole) {
            case ROLES.SUPER_ADMIN: return [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.HR_ADMIN, ROLES.EMPLOYEE]
            case ROLES.OWNER:       return [ROLES.HR_ADMIN, ROLES.EMPLOYEE]
            case ROLES.HR_ADMIN:    
            default:                return [ROLES.EMPLOYEE]
        }
    })()

    const roles = registrable.map(r => ({ value: r, label: ROLE_LABELS[r] || r }))

    let companyId = profile?.company_id
    if (!companyId) {
        const { data: firstComp } = await admin.from('companies').select('id').limit(1).single()
        companyId = firstComp?.id
    }

    let companies = []
    if (userRole === ROLES.SUPER_ADMIN) {
        const { data } = await admin.from('companies').select('id, name').order('name')
        companies = data || []
    }

    // Fetch org units for this company
    const { data: units } = await admin
        .from('departments')
        .select('id, name, level, code, parent_id')
        .eq('company_id', companyId)
        .order('level', { ascending: true })
        .order('name', { ascending: true })

    // Fetch unit level configs (label mapping)
    const { data: levelConfigs } = await admin
        .from('unit_level_configs')
        .select('level, label')
        .eq('company_id', companyId)
        .order('level', { ascending: true })

    // Fetch job grades sorted highest → lowest
    const { data: grades } = await admin
        .from('job_grades')
        .select('id, name, code, level')
        .eq('company_id', companyId)
        .order('level', { ascending: false })

    // Fetch potential managers in company
    const { data: managers } = await admin
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('company_id', companyId)
        .order('full_name', { ascending: true })

    const levelMap = {}
    for (const c of levelConfigs || []) levelMap[c.level] = c.label

    return {
        roles,
        companies,
        userRole,
        isSuperAdmin: userRole === ROLES.SUPER_ADMIN,
        units: (units || []).map(u => ({
            ...u,
            levelLabel: levelMap[u.level] || `Level ${u.level}`
        })),
        grades: grades || [],
        managers: managers || [],
    }
}

/**
 * Update existing user & employee records.
 */
export async function updateUser(payload) {
    const { profile, admin } = await getAuthProfile({ requireAdmin: true })

    const {
        profile_id,
        full_name,
        role: targetRole,
        job_title,
        home_unit_id,
        work_unit_id,
        job_grade_id,
        manager_id,
    } = payload

    if (!profile_id || !full_name) {
        throw new Error('User ID dan nama lengkap wajib diisi.')
    }

    // 1. Update profiles table
    const profileUpdate = { full_name }
    if (targetRole && canRegisterRole(profile.role, targetRole)) {
        profileUpdate.role = targetRole
    }

    const { error: profErr } = await admin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', profile_id)

    if (profErr) throw new Error('Gagal memperbarui profil: ' + profErr.message)

    // 2. Update employee table if exists or if role is employee
    const { data: existingEmp } = await admin
        .from('employees')
        .select('id')
        .eq('profile_id', profile_id)
        .maybeSingle()

    if (existingEmp || targetRole === ROLES.EMPLOYEE) {
        const empPayload = {
            job_title: job_title || 'Team Member',
            home_unit_id: home_unit_id || null,
            work_unit_id: work_unit_id || null,
            job_grade_id: job_grade_id || null,
            manager_id: manager_id || null,
        }

        if (existingEmp) {
            await admin.from('employees').update(empPayload).eq('id', existingEmp.id)
        } else {
            await admin.from('employees').insert({
                profile_id,
                company_id: profile.company_id,
                status: 'active',
                ...empPayload
            })
        }
    }

    revalidatePath('/dashboard/settings/users')
    revalidatePath('/dashboard/employees')
    return { success: true, message: 'Data pengguna berhasil diperbarui.' }
}
