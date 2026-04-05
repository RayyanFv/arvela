import { createAdminSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Edit, Globe, Users, Briefcase } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function CompaniesListPage() {
    const supabase = createAdminSupabaseClient()

    const { data: companies, error } = await supabase
        .from('companies')
        .select('*, profiles(count)')
        .order('created_at', { ascending: false })

    return (
        <div className="max-w-6xl space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Database Perusahaan</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola master data perusahaan di platform Arvela.</p>
                </div>
                <Link 
                    href="/dashboard/companies/create" 
                    className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Perusahaan
                </Link>
            </div>

            {error ? (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold">
                    Gagal mengambil data: {error.message}
                </div>
            ) : (
                <div className="bg-white border text-sm border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Nama Perusahaan</th>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Industri & Ukuran</th>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400 text-center">Total Staff</th>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Dibuat</th>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {companies?.map((company) => (
                                    <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {company.logo_url ? (
                                                    <img src={company.logo_url} alt={company.name} className="w-8 h-8 rounded-lg object-contain bg-slate-50" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase">
                                                        {company.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-slate-900 flex items-center gap-2">
                                                        {company.name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-mono mt-0.5">/{company.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1 text-slate-500">
                                                <div className="flex items-center gap-1.5 text-xs"><Briefcase className="w-3.5 h-3.5" /> {company.industry || '-'}</div>
                                                <div className="flex items-center gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> {company.size || '-'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge className="bg-indigo-50 text-indigo-600 border-none font-black mx-auto">
                                                {company.profiles?.[0]?.count || 0} Staff
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {new Date(company.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link 
                                                href={`/dashboard/companies/${company.id}/edit`}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 hover:bg-primary/10 hover:text-primary text-slate-400 transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
