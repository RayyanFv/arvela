import { createAdminSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Edit, Globe, Users, Briefcase, Crown, ShieldCheck, Zap, Gift, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function CompaniesListPage() {
    const supabase = createAdminSupabaseClient()

    const { data: companies, error } = await supabase
        .from('companies')
        .select('*, profiles(count)')
        .order('created_at', { ascending: false })

    return (
        <div className="max-w-6xl space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Database Perusahaan & Lisensi</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola master data perusahaan, paket berlangganan (Pilot Promo / Arvela Max), dan kuota lisensi Super Admin.</p>
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
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold border border-rose-100">
                    Gagal mengambil data: {error.message}
                </div>
            ) : (
                <div className="bg-white border text-sm border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Nama Perusahaan</th>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Paket Berlangganan</th>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400 text-center">Kuota & Fitur</th>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400 text-center">Total Staff</th>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {companies?.map((company) => {
                                    const planName = company.subscription_plan || 'Pilot Promo'
                                    const isMax = planName === 'Arvela Max'
                                    const isPilot = planName === 'Pilot Promo'
                                    const isEnterprise = planName === 'Enterprise'

                                    return (
                                        <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {company.logo_url ? (
                                                        <img src={company.logo_url} alt={company.name} className="w-9 h-9 rounded-xl object-contain bg-slate-50 p-1 border border-slate-100" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black uppercase">
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
                                                <div className="space-y-1">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                                                        isMax ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        isPilot ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        isEnterprise ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        'bg-slate-100 text-slate-700 border-slate-200'
                                                    }`}>
                                                        {isMax && <Zap className="w-3 h-3 text-emerald-500" />}
                                                        {isPilot && <Gift className="w-3 h-3 text-amber-500" />}
                                                        {isEnterprise && <Crown className="w-3 h-3 text-purple-500" />}
                                                        {planName}
                                                    </span>
                                                    {company.subscription_expires_at && (
                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                            s/d {new Date(company.subscription_expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex flex-col items-center gap-1 text-xs">
                                                    <div className="flex items-center gap-2 font-bold text-slate-700">
                                                        <span>{company.job_slots_quota === 999 ? '∞' : (company.job_slots_quota || 15)} Slot Loker</span>
                                                        <span>·</span>
                                                        <span>{company.assessment_slots_quota === 999 ? '∞' : (company.assessment_slots_quota || 15)} Asesmen</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                        {company.whatsapp_support_enabled && (
                                                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                                                                <MessageSquare className="w-3 h-3" /> WA Support
                                                            </span>
                                                        )}
                                                        {company.dedicated_account_manager && (
                                                            <span className="text-indigo-600 font-bold flex items-center gap-1">
                                                                <Crown className="w-3 h-3" /> Dedicated Manager
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <Badge className="bg-indigo-50 text-indigo-600 border-none font-black mx-auto">
                                                    {company.profiles?.[0]?.count || 0} Staff
                                                </Badge>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                                    company.subscription_status === 'active' ? 'bg-emerald-100/60 text-emerald-800' :
                                                    company.subscription_status === 'trial' ? 'bg-amber-100/60 text-amber-800' :
                                                    'bg-rose-100/60 text-rose-800'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        company.subscription_status === 'active' ? 'bg-emerald-500' :
                                                        company.subscription_status === 'trial' ? 'bg-amber-500' :
                                                        'bg-rose-500'
                                                    }`} />
                                                    {company.subscription_status?.toUpperCase() || 'ACTIVE'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <Link 
                                                    href={`/dashboard/companies/${company.id}/edit`}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                    Kelola Paket
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
