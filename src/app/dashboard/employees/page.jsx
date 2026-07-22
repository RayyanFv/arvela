import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { getUserPermissions } from '@/lib/permissions'
import Link from 'next/link'
import {
    Users,
    Plus,
    Upload,
    MoreHorizontal,
    Briefcase,
    ArrowUpRight,
    Building2,
    Medal
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'

export const metadata = { title: 'Data Karyawan — Arvela HR' }

export default async function EmployeesPage({ searchParams }) {
    const authClient = await createServerSupabaseClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) redirect('/login')

    const supabase = createAdminSupabaseClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/login')

    const perms = await getUserPermissions(user.id)

    const params = await searchParams
    const search = params?.q || ''
    const page = parseInt(params?.page || '1', 10)
    const limit = 12
    const offset = (page - 1) * limit

    // Count stats query
    const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)

    const { count: activeEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .eq('status', 'active')

    // Fetch employees with pagination and joins
    let query = supabase
        .from('employees')
        .select(`
            id,
            status,
            job_title,
            department,
            joined_at,
            profiles!employees_profile_id_fkey (full_name, email, avatar_url, phone),
            home_unit:home_unit_id (name, code),
            work_unit:work_unit_id (name, code),
            job_grade:job_grade_id (name, code, level)
        `, { count: 'exact' })
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    if (search) {
        query = query.or(`job_title.ilike.%${search}%,department.ilike.%${search}%`)
    }

    const { data: rawEmployees, count } = await query.range(offset, offset + limit - 1)
    const totalPages = Math.ceil((count || 0) / limit)

    let employees = rawEmployees || []

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <PageHeader
                    title="Data Karyawan"
                    description="Kelola seluruh tim, unit kerja, pangkat, dan informasi karyawan Anda."
                />
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                    <SearchInput
                        placeholder="Cari jabatan atau divisi..."
                        defaultValue={search}
                        className="w-full sm:w-64"
                    />
                    <div className="flex items-center gap-3">
                        {perms.has('employee.manage') && (
                            <>
                                <Link href="/dashboard/employees/import">
                                    <Button variant="outline" className="h-11 rounded-xl border-emerald-200 text-emerald-700 font-bold gap-2 hover:bg-emerald-50">
                                        <Upload className="w-4 h-4" /> Import Massal
                                    </Button>
                                </Link>
                                <Link href="/dashboard/settings/users">
                                    <Button
                                        className="h-11 rounded-xl bg-primary text-white font-black hover:bg-brand-600 gap-2 shadow-lg shadow-primary/20"
                                    >
                                        <Plus className="w-4 h-4" /> Tambah Karyawan
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-5 border-none shadow-sm rounded-3xl flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Karyawan</p>
                    <p className="text-2xl font-black text-blue-600">{totalEmployees || 0}</p>
                </Card>
                <Card className="p-5 border-none shadow-sm rounded-3xl flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Karyawan Aktif</p>
                    <p className="text-2xl font-black text-emerald-600">{activeEmployees || 0}</p>
                </Card>
                <Card className="p-5 border-none shadow-sm rounded-3xl flex flex-col justify-center col-span-2 lg:col-span-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Karyawan per Halaman</p>
                    <p className="text-2xl font-black text-violet-600">{limit} <span className="text-xs font-bold text-slate-400">/ hal</span></p>
                </Card>
            </div>

            {/* Employee Cards Grid */}
            {employees.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
                    <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">Belum Ada Data Karyawan</h3>
                    <p className="text-sm text-slate-300 font-medium max-w-xs mx-auto mt-2">
                        {search ? 'Tidak ada karyawan yang cocok dengan kata kunci pencarian.' : 'Karyawan yang terdaftar akan dikelola di sini.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map(emp => (
                        <Card key={emp.id} className="relative overflow-hidden group select-none rounded-[32px] border-none shadow-sm hover:shadow-md transition-all p-6 bg-white flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-black text-slate-400 text-lg">
                                            {emp.profiles?.avatar_url ? (
                                                <img src={emp.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                emp.profiles?.full_name?.charAt(0) || '?'
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-900 leading-snug line-clamp-1">{emp.profiles?.full_name || 'Tanpa Nama'}</h4>
                                            <p className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                                                <Briefcase className="w-3 h-3 text-primary shrink-0" />
                                                <span className="truncate">{emp.job_title || 'Staf'}</span>
                                            </p>
                                            <p className="text-[11px] text-slate-400 font-medium truncate">{emp.profiles?.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Organizational details (Unit & Grade) */}
                                <div className="bg-slate-50 p-3 rounded-2xl space-y-2 border border-slate-100 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Building2 className="w-3 h-3" /> Unit Kerja
                                        </span>
                                        <span className="font-bold text-slate-700 truncate max-w-[140px]">
                                            {emp.work_unit?.name || emp.home_unit?.name || emp.department || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Medal className="w-3 h-3" /> Pangkat
                                        </span>
                                        <span className="font-bold text-slate-700">
                                            {emp.job_grade ? `Lv.${emp.job_grade.level} · ${emp.job_grade.name}` : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    emp.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                    {emp.status}
                                </span>
                                <Link href={`/dashboard/employees/${emp.id}`}>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-xl font-bold text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
                                    >
                                        Detail <ArrowUpRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalCount={count || 0}
                limit={limit}
                baseUrl="/dashboard/employees"
                searchParams={{ q: search }}
            />
        </div>
    )
}
