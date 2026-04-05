import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Mail, MoreHorizontal, UserCheck, ShieldAlert } from 'lucide-react'
import { ROLES, ROLE_LABELS } from '@/lib/constants/roles'
import { RegisterUserDialog } from '@/components/admin/RegisterUserDialog'
import { Suspense } from 'react'

import { SearchInput } from '@/components/ui/SearchInput'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const metadata = { title: 'Manajemen User — Arvela HR' }

export default async function UsersSettingsPage({ searchParams }) {
    const params = await searchParams
    const q = params?.q || ''
    const roleFilter = params?.role || ''
    const page = parseInt(params?.page || '1')
    const limit = 10
    const offset = (page - 1) * limit
    const authClient = await createServerSupabaseClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) redirect('/login')

    const supabase = createAdminSupabaseClient()

    // Get current user profile for role verification
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/dashboard')

    // Fetch profiles with pagination and search
    let query = supabase.from('profiles').select('*, companies(name)', { count: 'exact' }).order('created_at', { ascending: false })
    
    if (profile.role !== ROLES.SUPER_ADMIN) {
        query = query.eq('company_id', profile.company_id)
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
            case ROLES.SUPER_ADMIN: return 'bg-rose-100 text-rose-700 border-rose-200'
            case ROLES.OWNER: return 'bg-amber-100 text-amber-700 border-amber-200'
            case ROLES.HR_ADMIN: return 'bg-violet-100 text-violet-700 border-violet-200'
            case ROLES.EMPLOYEE: return 'bg-emerald-100 text-emerald-700 border-emerald-200'
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
                    <Suspense fallback={<Button disabled>Memuat...</Button>}>
                        <RegisterUserDialog />
                    </Suspense>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm gap-4">
                <div className="w-full sm:max-w-xs relative">
                    <SearchInput defaultValue={q} placeholder="Cari nama atau email..." className="w-full h-11 bg-slate-50 border-none rounded-2xl" />
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 sidebar-scroll">
                    <Link href="/dashboard/settings/users" className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${!roleFilter ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                        Semua
                    </Link>
                    <Link href="/dashboard/settings/users?role=employee" className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${roleFilter === 'employee' ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                        Karyawan
                    </Link>
                    <Link href="/dashboard/settings/users?role=hr_admin" className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${roleFilter === 'hr_admin' ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                        HR Admin
                    </Link>
                    {profile.role === ROLES.SUPER_ADMIN && (
                        <Link href="/dashboard/settings/users?role=super_admin" className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${roleFilter === 'super_admin' ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                            Super Admin
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {users?.map((u) => (
                    <Card key={u.id} className="p-6 border-none shadow-sm rounded-3xl hover:shadow-md transition-all group">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:text-primary transition-colors shrink-0 overflow-hidden">
                                    {u.avatar_url ? (
                                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        u.full_name?.charAt(0) || '?'
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-extrabold text-slate-900 group-hover:text-primary transition-colors">{u.full_name}</h4>
                                        {u.id === user.id && (
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] font-black uppercase">Anda</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 text-slate-300" /> {u.email}
                                        </p>
                                        <p className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                            🏢 {u.companies?.name || 'Tanpa Perusahaan'}
                                        </p>
                                        <p className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                            <UserCheck className="w-3.5 h-3.5" /> Terdaftar {new Date(u.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-4 sm:pt-0">
                                <Badge className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${getRoleBadgeStyle(u.role)}`}>
                                    {ROLE_LABELS[u.role] || u.role}
                                </Badge>
                            </div>
                        </div>
                    </Card>
                ))}

                {(!users || users.length === 0) && (
                    <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                        <ShieldAlert className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-slate-300">Belum ada user yang cocok.</h3>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400">
                        Menampilkan <span className="text-slate-900">{offset + 1}-{Math.min(offset + limit, count)}</span> dari {count}
                    </p>
                    <div className="flex items-center gap-2">
                        <Link 
                            href={`/dashboard/settings/users?page=${Math.max(1, page - 1)}${q ? `&q=${q}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}`}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${page <= 1 ? 'pointer-events-none opacity-50 bg-slate-50 text-slate-400' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Link>
                        <span className="text-sm font-black text-slate-900 px-2">{page} / {totalPages}</span>
                        <Link 
                            href={`/dashboard/settings/users?page=${Math.min(totalPages, page + 1)}${q ? `&q=${q}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}`}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${page >= totalPages ? 'pointer-events-none opacity-50 bg-slate-50 text-slate-400' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}
            
            <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-8 mt-8">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-rose-900">Perhatian Keamanan</h3>
                        <p className="text-sm text-rose-700/80 font-medium mt-1 leading-relaxed">
                            Sebagai <strong className="text-rose-900">Administrator</strong>, Anda memiliki wewenang untuk mendaftarkan pengguna baru. 
                            Pastikan Anda hanya memberikan akses <strong className="text-rose-900">Super Admin / Owner</strong> kepada orang yang Anda percayai.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
