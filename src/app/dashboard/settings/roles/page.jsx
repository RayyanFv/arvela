import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/constants/roles'
import { ROLE_LEVELS } from '@/lib/permissions'
import { getEffectiveProfileServer } from '@/lib/actions/impersonate'
import RolesClient from './RolesClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Manajemen Role — Arvela HR' }

export default async function RolesPage() {
    const res = await getEffectiveProfileServer()
    if (!res?.user) redirect('/login')
    const profile = res.profile
    if (!profile) redirect('/login')

    const supabase = createAdminSupabaseClient()

    if (!isAdminRole(profile.role)) redirect('/dashboard')
    const myLevel = ROLE_LEVELS[profile.role] ?? 99

    // Fetch all permissions grouped by module
    const { data: permissions } = await supabase
        .from('permissions')
        .select('id, code, name, module')
        .order('module')

    // Fetch company roles and global fallback roles
    const { data: rolesRaw } = await supabase
        .from('roles')
        .select(`
            id, name, description, is_system, company_id, level,
            role_permissions ( permission_id )
        `)
        .or(`company_id.eq.${profile.company_id},company_id.is.null`)
        .order('level', { ascending: true })

    // Deduplicate: prefer company-specific role over global system role template
    const roleMap = new Map()
    for (const r of rolesRaw || []) {
        if (!roleMap.has(r.name) || r.company_id) {
            roleMap.set(r.name, r)
        }
    }
    const deduplicated = Array.from(roleMap.values()).sort((a, b) => (a.level || 99) - (b.level || 99))

    // Filter by hierarchy:
    // - super_admin user sees everything (including super_admin role Level 1)
    // - owner user sees owner role (Level 2) and below (strictly hides super_admin Level 1)
    // - hr_admin user sees roles strictly below hr_admin (level > 3)
    const roles = deduplicated.filter(r => {
        if (profile.role === 'super_admin') return true
        if (r.name === 'super_admin' || (r.level && r.level === 1)) return false
        if (profile.role === 'owner') return true
        return (r.level || 99) > myLevel
    })

    return (
        <RolesClient
            companyId={profile.company_id}
            initialRoles={roles}
            allPermissions={permissions || []}
            myLevel={myLevel}
        />
    )
}
