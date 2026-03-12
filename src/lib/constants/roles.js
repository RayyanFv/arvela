/**
 * ─── Arvela Role System ───────────────────────────────────────
 * Single source of truth for all role definitions.
 *
 * Hierarchy (highest → lowest):
 *   super_admin  →  can register: owner, hr_admin, employee
 *   owner        →  can register: hr_admin, employee
 *   hr_admin     →  can register: employee
 *   employee     →  cannot register anyone
 *
 * candidate = external applicant (auto-created on apply)
 * user      = fallback / unassigned
 * ──────────────────────────────────────────────────────────────
 */

// Core role identifiers
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    OWNER: 'owner',
    HR_ADMIN: 'hr_admin',
    EMPLOYEE: 'employee',
    CANDIDATE: 'candidate',
    USER: 'user',
}

// Roles that have access to /dashboard
export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.HR_ADMIN]

// Roles with staff portal access (/staff)
export const STAFF_ROLES = [ROLES.EMPLOYEE]

// All internal (non-public) roles
export const INTERNAL_ROLES = [...ADMIN_ROLES, ...STAFF_ROLES]

// Human-readable labels (for UI display)
export const ROLE_LABELS = {
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.OWNER]: 'Owner',
    [ROLES.HR_ADMIN]: 'HR Admin',
    [ROLES.EMPLOYEE]: 'Karyawan',
    [ROLES.CANDIDATE]: 'Kandidat',
    [ROLES.USER]: 'User',
}

/**
 * Returns which roles a given role can register/create.
 * super_admin → owner, hr_admin, employee
 * owner       → hr_admin, employee
 * hr_admin    → employee
 * others      → none
 */
export function getRegistrableRoles(currentRole) {
    switch (currentRole) {
        case ROLES.SUPER_ADMIN:
            return [ROLES.OWNER, ROLES.HR_ADMIN, ROLES.EMPLOYEE]
        case ROLES.OWNER:
            return [ROLES.HR_ADMIN, ROLES.EMPLOYEE]
        case ROLES.HR_ADMIN:
            return [ROLES.EMPLOYEE]
        default:
            return []
    }
}

/**
 * Check if the caller's role can register a target role.
 */
export function canRegisterRole(callerRole, targetRole) {
    return getRegistrableRoles(callerRole).includes(targetRole)
}

/**
 * Check if a role is an admin role (has dashboard access).
 */
export function isAdminRole(role) {
    return ADMIN_ROLES.includes(role)
}
