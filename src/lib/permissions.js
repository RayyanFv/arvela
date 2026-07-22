import { createAdminSupabaseClient } from '@/lib/supabase/server'

// Canonical role hierarchy — lower number = higher authority
export const ROLE_LEVELS = {
    super_admin: 1,
    owner:       2,
    hr_admin:    3,
    employee:    4,
    candidate:   5,
    user:        6,
}

/**
 * Given a role name, returns the roles that a user of that level is
 * ALLOWED to see/manage (strictly lower authority = higher level number).
 * e.g. hr_admin (level 3) → can see employee(4), candidate(5), user(6)
 */
export function getManageableRoles(myRoleName) {
    const myLevel = ROLE_LEVELS[myRoleName] ?? 99
    return Object.entries(ROLE_LEVELS)
        .filter(([, lvl]) => lvl > myLevel)
        .map(([name]) => name)
}

/**
 * Fetches the full permission set for a given user from the dynamic RBAC tables.
 * Returns a PermissionSet object with a .has(code) method for easy checking.
 *
 * @param {string} userId - The user's profile UUID
 * @returns {Promise<PermissionSet>}
 */
export async function getUserPermissions(userId) {
    const supabase = createAdminSupabaseClient()

    const { data } = await supabase
        .from('profile_roles')
        .select(`
            role_id,
            roles (
                name,
                level,
                role_permissions (
                    permissions (code)
                )
            )
        `)
        .eq('profile_id', userId)
        .single()

    const permissionCodes = new Set()
    let roleName  = 'user'
    let roleLevel = ROLE_LEVELS['user']

    if (data?.roles) {
        roleName  = data.roles.name
        roleLevel = data.roles.level ?? ROLE_LEVELS[roleName] ?? 99
        for (const rp of data.roles.role_permissions || []) {
            if (rp.permissions?.code) {
                permissionCodes.add(rp.permissions.code)
            }
        }
    }

    return new PermissionSet(permissionCodes, roleName, roleLevel)
}

/**
 * A wrapper class that holds a user's permission codes and provides
 * convenient helper methods for checking access.
 */
class PermissionSet {
    constructor(codes, roleName, roleLevel) {
        this._codes    = codes
        this.role      = roleName
        this.level     = roleLevel                                // numeric level (lower = more powerful)
        this._isGlobalAdmin = ['super_admin', 'owner'].includes(roleName)
    }

    /** Check if the user has a specific permission code */
    has(code) {
        if (this._isGlobalAdmin) return true
        return this._codes.has(code)
    }

    /** Check if the user has ANY of the given permission codes */
    hasAny(...codes) {
        return codes.some(code => this.has(code))
    }

    /** Check if the user has ALL of the given permission codes */
    hasAll(...codes) {
        return codes.every(code => this.has(code))
    }

    /**
     * Returns true if this user can manage (view/edit) the given role name.
     * A user can only manage roles that are strictly BELOW their own level.
     */
    canManageRole(targetRoleName) {
        const targetLevel = ROLE_LEVELS[targetRoleName] ?? 99
        return targetLevel > this.level
    }

    /**
     * Returns the list of role names this user is allowed to manage.
     */
    get manageableRoles() {
        return getManageableRoles(this.role)
    }

    /** Returns true if user is an administrative role */
    get isAdmin() {
        return ['super_admin', 'owner', 'hr_admin'].includes(this.role)
    }

    /** Serialize to a plain object for passing to Client Components */
    toJSON() {
        return {
            role:            this.role,
            level:           this.level,
            codes:           [...this._codes],
            isAdmin:         this.isAdmin,
            manageableRoles: this.manageableRoles,
        }
    }
}
