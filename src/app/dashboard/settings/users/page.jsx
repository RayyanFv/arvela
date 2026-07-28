import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Mail, UserCheck, ShieldAlert, Upload, UserPlus, Users, ShieldCheck, Briefcase } from 'lucide-react'
import { ROLES, ROLE_LABELS } from '@/lib/constants/roles'
import { RegisterUserDialog } from '@/components/admin/RegisterUserDialog'
import { EditUserDialog } from '@/components/admin/EditUserDialog'
import { LoginAsButton } from '@/components/admin/LoginAsButton'
import { Suspense } from 'react'
import { getManageableRoles, ROLE_LEVELS } from '@/lib/permissions'

import { SearchInput } from '@/components/ui/SearchInput'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const metadata = { title: 'Manajemen User — Arvela HR' }

import { getEffectiveProfileServer } from '@/lib/actions/impersonate'

export const dynamic = 'force-dynamic'

export default async function UsersSettingsPage({ searchParams }) {
    const params = await searchParams
    const q = params?.q || ''
    const roleFilter = params?.role || ''
    const page = parseInt(params?.page || '1')
    const limit = 10
    const offset = (page - 1) * limit

    // Resolve effective profile — respects impersonation cookie
    const res = await getEffectiveProfileServer()
    if (!res?.user) redirect('/login')
    const user = res.user
    const profile = res.profile
    if (!profile) redirect('/dashboard')

    const supabase = createAdminSupabaseClient()

    // Determine role hierarchy — user can only see roles strictly below their level.
    // Derived from profile.role (already resolved by getEffectiveProfileServer above)
    // instead of re-querying profile_roles — avoids a duplicate join query per page load.
    const manageableRoles = getManageableRoles(profile.role)

    // Fetch profiles with pagination and search
    let query = supabase.from('profiles').select('*, companies(name)', { count: 'exact' }).order('created_at', { ascending: false })
    
    // super_admin sees all; others filtered by company AND by hierarchical level
    if (profile.role !== ROLES.SUPER_ADMIN) {
        query = query.eq('company_id', profile.company_id)
        // Only show users whose role is manageable by this user (strictly lower level)
        if (manageableRoles.length > 0) {
            query = query.in('role', manageableRoles)
        } else {
            // Edge case: if no manageable roles, show nothing
            query = query.eq('id', '00000000-0000-0000-0000-000000000000')
        }
    }

    if (q) {
        query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
    }

    if (roleFilter) {
        query = query.eq('role', roleFilter)
    }
    
    // Applying pagination limits
    const { data: users, count } = await query.range(offset, offset + limit - 1)
    
    const totalPages = Math.ceil((count || 0) / limit)

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case ROLES.SUPER_ADMIN: return 'bg-rose-50 text-rose-700 border-rose-200'
            case ROLES.OWNER: return 'bg-amber-50 text-amber-700 border-amber-200'
            case ROLES.HR_ADMIN: return 'bg-blue-50 text-blue-700 border-blue-200'
            case ROLES.EMPLOYEE: return 'bg-slate-100 text-slate-600 border-slate-200'
            default: return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <PageHeader
                    title="Manajemen Pengguna"
                    description="Kelola hak akses dan akun administrator di perusahaan Anda."
                />
                <div className="flex items-center gap-3 pt-2">
                    <Link href="/dashboard/employees/import">
                        <Button variant="outline" className="h-11 rounded-md font-semibold gap-2">
                            <Upload className="w-4 h-4" /> Import Massal
                        </Button>
                    </Link>
                    <Suspense fallback={<Button disabled>Memuat...</Button>}>
                        <RegisterUserDialog />
                    </Suspense>
                </div>
            </div>

            {/* Hierarchy Notice */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-md">
                <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0" />
                <p className="text-xs font-semibold text-slate-600">
                    Anda login sebagai <span className="uppercase tracking-wide text-slate-900">{profile.role}</span> (Level {ROLE_LEVELS[profile.role] ?? '—'}).
                    {' '}Anda hanya dapat melihat dan mengelola pengguna dengan level di bawah Anda:
                    {' '}<span className="text-slate-900">{manageableRoles.length > 0 ? manageableRoles.join(', ') : '—'}</span>.
                </p>
            </div>

            {/* Info Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 rounded-md flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center shrink-0">
                        <UserPlus className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Tambah Satu per Satu</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                            Gunakan tombol <strong>"Daftarkan Pengguna"</strong> untuk menambah karyawan satu per satu. Akun dan data karyawan dibuat sekaligus, email undangan terkirim otomatis.
                        </p>
                    </div>
                </Card>
                <Card className="p-5 rounded-md flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Import Massal via Excel</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                            Gunakan <strong>"Import Massal"</strong> untuk upload puluhan karyawan sekaligus. Akun user dibuat dan email undangan terkirim untuk setiap baris data yang valid.
                        </p>
                    </div>
                </Card>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-md border border-slate-200 gap-4">
                <div className="w-full sm:max-w-xs relative">
                    <SearchInput defaultValue={q} placeholder="Cari nama atau email..." className="w-full h-11 bg-slate-50 border-none rounded-md" />
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 sidebar-scroll">
                    <Link href="/dashboard/settings/users" className={`px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${!roleFilter ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                        Semua
                    </Link>
                    <Link href="/dashboard/settings/users?role=employee" className={`px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${roleFilter === 'employee' ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                        Karyawan
                    </Link>
                    <Link href="/dashboard/settings/users?role=hr_admin" className={`px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${roleFilter === 'hr_admin' ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                        HR Admin
                    </Link>
                    {profile.role === ROLES.SUPER_ADMIN && (
                        <Link href="/dashboard/settings/users?role=super_admin" className={`px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${roleFilter === 'super_admin' ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                            Super Admin
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {users?.map((u) => (
                    <Card key={u.id} className="p-6 rounded-md hover:border-slate-300 transition-colors group">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center font-semibold text-slate-400 group-hover:text-primary transition-colors shrink-0 overflow-hidden">
                                    {u.avatar_url ? (
                                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        u.full_name?.charAt(0) || '?'
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{u.full_name}</h4>
                                        {u.id === user.id && (
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 text-[9px] font-semibold uppercase">Anda</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 text-slate-300" /> {u.email}
                                        </p>
                                        <p className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                            <Briefcase className="w-3.5 h-3.5" /> {u.companies?.name || 'Tanpa Perusahaan'}
                                        </p>
                                        <p className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                            <UserCheck className="w-3.5 h-3.5" /> Terdaftar {new Date(u.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-4 sm:pt-0">
                                <Badge className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-widest rounded border ${getRoleBadgeStyle(u.role)}`}>
                                    {ROLE_LABELS[u.role] || u.role}
                                </Badge>
                                {u.id !== user.id && <LoginAsButton targetUser={u} />}
                                <EditUserDialog targetUser={u} />
                            </div>
                        </div>
                    </Card>
                ))}

                {(!users || users.length === 0) && (
                    <div className="py-20 text-center bg-white rounded-md border-2 border-dashed border-slate-200">
                        <ShieldAlert className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-400">Belum ada user yang cocok.</h3>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-6 py-4 rounded-md border border-slate-200">
                    <p className="text-xs font-medium text-slate-400">
                        Menampilkan <span className="text-slate-900">{offset + 1}-{Math.min(offset + limit, count)}</span> dari {count}
                    </p>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/dashboard/settings/users?page=${Math.max(1, page - 1)}${q ? `&q=${q}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}`}
                            className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${page <= 1 ? 'pointer-events-none opacity-50 bg-slate-50 text-slate-400' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Link>
                        <span className="text-sm font-semibold text-slate-900 px-2">{page} / {totalPages}</span>
                        <Link
                            href={`/dashboard/settings/users?page=${Math.min(totalPages, page + 1)}${q ? `&q=${q}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}`}
                            className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${page >= totalPages ? 'pointer-events-none opacity-50 bg-slate-50 text-slate-400' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}

            <div className="bg-rose-50 border border-rose-200 rounded-md p-8 mt-8">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-rose-100 rounded-md flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-rose-900">Perhatian Keamanan</h3>
                        <p className="text-sm text-rose-700 font-medium mt-1 leading-relaxed">
                            Sebagai <strong className="text-rose-900">Administrator</strong>, Anda memiliki wewenang untuk mendaftarkan pengguna baru.
                            Pastikan Anda hanya memberikan akses <strong className="text-rose-900">Super Admin / Owner</strong> kepada orang yang Anda percayai.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
