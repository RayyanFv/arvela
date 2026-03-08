import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import Link from 'next/link'
import {
    Users,
    Search,
    Filter,
    Plus,
    MoreHorizontal,
    Briefcase,
    ArrowUpRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

    const params = await searchParams
    const search = params?.q || ''

    // Fetch employees
    let query = supabase
        .from('employees')
        .select(`
            id,
            status,
            job_title,
            department,
            joined_at,
            profiles!employees_profile_id_fkey (full_name, email, avatar_url)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    if (search) {
        // Need to filter effectively. Since we join, post-filtering via JS is safer for this prototype
        // but let's fetch all and filter in JS if search exists, because Supabase ilike on joined tables can be tricky.
    }

    const { data: rawEmployees } = await query

    let employees = rawEmployees || []
    if (search) {
        employees = employees.filter(e =>
            e.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            e.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
            e.job_title?.toLowerCase().includes(search.toLowerCase())
        )
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <PageHeader
                    title="Data Karyawan"
                    description="Kelola seluruh tim, onboarding, dan performa mereka."
                />
                <div className="flex items-center gap-3 pt-2">
                    <Button variant="outline" className="h-11 rounded-xl border-slate-200 text-slate-600 font-bold gap-2">
                        <Filter className="w-4 h-4" /> Filter
                    </Button>
                    <Link href="/dashboard/candidates">
                        <Button
                            className="h-11 rounded-xl bg-primary text-white font-black hover:bg-brand-600 gap-2 shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-4 h-4" /> Hire Kandidat Baru
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Karyawan', value: employees.length, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Active', value: employees.filter(e => e.status === 'active').length, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Onboarding', value: employees.filter(e => e.status === 'onboarding').length, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Baru (Bulan ini)', value: employees.filter(e => new Date(e.joined_at).getMonth() === new Date().getMonth()).length, color: 'bg-purple-50 text-purple-600' }
                ].map((stat, i) => (
                    <Card key={i} className="p-5 border-none shadow-sm rounded-3xl group transition-all hover:bg-slate-50 flex flex-col justify-center">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{stat.label}</p>
                        <p className={`text-2xl font-black ${stat.color.split(' ')[1]}`}>{stat.value}</p>
                    </Card>
                ))}
            </div>

            {/* List */}
            {employees.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm mt-8">
                    <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">Belum Ada Karyawan</h3>
                    <p className="text-sm text-slate-300 font-medium max-w-xs mx-auto mt-2">Karyawan yang berstatus Hired akan dikelola di sini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map(emp => (
                        <Card key={emp.id} className="relative overflow-hidden group select-none rounded-[32px] border-none shadow-xl shadow-slate-100/50 p-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-primary">
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="flex flex-col items-center text-center space-y-4 pt-2">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-3xl border-2 border-slate-100 overflow-hidden ring-4 ring-slate-50">
                                        {emp.profiles?.avatar_url ? (
                                            <img src={emp.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-primary/5 flex items-center justify-center text-2xl font-black text-primary uppercase">
                                                {emp.profiles?.full_name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 border-white flex items-center justify-center ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}>
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="font-black text-slate-900 tracking-tight">{emp.profiles?.full_name || 'Tidak ada nama'}</h4>
                                    <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-bold">
                                        <Briefcase className="w-3 h-3" />
                                        {emp.job_title}
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold">{emp.profiles?.email}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{emp.department}</p>
                                </div>

                                <div className="w-full grid grid-cols-2 gap-2 pt-4 border-t border-slate-50 mt-2">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bergabung</p>
                                        <p className="text-xs font-bold text-slate-700">{new Date(emp.joined_at).getFullYear()}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                        <p className={`text-[10px] font-black uppercase text-center ${emp.status === 'active' ? 'text-emerald-500' : 'text-amber-500'
                                            }`}>
                                            {emp.status}
                                        </p>
                                    </div>
                                </div>

                                <Link href={`/dashboard/employees/${emp.id}`} className="w-full">
                                    <Button
                                        variant="ghost"
                                        className="w-full h-11 rounded-2xl bg-slate-50 hover:bg-primary/10 hover:text-primary mt-2 font-black text-xs gap-2"
                                    >
                                        DETAIL PROFIL <ArrowUpRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
