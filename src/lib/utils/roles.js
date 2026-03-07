export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    HR: 'hr',
    HIRING_MANAGER: 'hiring_manager',
    BOSS: 'boss',
    EMPLOYEE: 'employee'
}

export function canManage(role) {
    return [ROLES.SUPER_ADMIN, ROLES.HR, ROLES.HIRING_MANAGER, ROLES.BOSS].includes(role)
}

export function isEmployee(role) {
    return role === ROLES.EMPLOYEE
}

export function isHR(role) {
    return role === ROLES.HR || role === ROLES.SUPER_ADMIN
}
