'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, Crown, Gift, ArrowUpRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export function CompanyQuotaWidget({ companyId }) {
    const [company, setCompany] = useState(null)
    const [stats, setStats] = useState({ activeJobs: 0, activeEmp: 0, assessments: 0 })
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!companyId) return

        async function fetchQuotaStats() {
            try {
                // Fetch company subscription settings
                const { data: comp } = await supabase
                    .from('companies')
                    .select('subscription_plan, subscription_status, job_slots_quota, assessment_slots_quota, employee_quota, whatsapp_support_enabled, dedicated_account_manager, subscription_expires_at')
                    .eq('id', companyId)
                    .maybeSingle()

                if (comp) setCompany(comp)

                // Fetch usage counts
                const [jobsRes, empRes, asmRes] = await Promise.all([
                    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'published'),
                    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active'),
                    supabase.from('assessments').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
                ])

                setStats({
                    activeJobs: jobsRes.count || 0,
                    activeEmp: empRes.count || 0,
                    assessments: asmRes.count || 0
                })
            } catch (e) {
                console.error('Failed to load company quota stats:', e)
            } finally {
                setLoading(false)
            }
        }

        fetchQuotaStats()
    }, [companyId])

    if (loading || !company) return null

    const planName = company.subscription_plan || 'Pilot Promo'
    const isMax = planName === 'Arvela Max'
    const isPilot = planName === 'Pilot Promo'

    const jobLimit = company.job_slots_quota ?? 15
    const empLimit = company.employee_quota ?? 50
    const asmLimit = company.assessment_slots_quota ?? 15

    const jobPct = jobLimit === 999 ? 10 : Math.min(100, Math.round((stats.activeJobs / jobLimit) * 100))
    const empPct = empLimit === 999 ? 10 : Math.min(100, Math.round((stats.activeEmp / empLimit) * 100))

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden my-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                        {isMax ? <Zap className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Status Lisensi Paket</span>
                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                isMax ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                isPilot ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' :
                                'bg-blue-400/20 text-blue-300 border-blue-400/30'
                            }`}>
                                {planName}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-white mt-0.5">
                            {isPilot ? 'Promo Pilot Active — 15 Slot Bundle' : isMax ? 'Arvela Max — High Capacity Scaling' : planName}
                        </p>
                    </div>
                </div>

                {!isMax && (
                    <Link href="/dashboard/settings/users">
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs transition-all shadow-lg hover:scale-105">
                            Upgrade ke Arvela Max <ArrowUpRight className="w-4 h-4" />
                        </span>
                    </Link>
                )}
            </div>

            {/* Quota Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
                {/* Slot Loker */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Slot Loker Aktif</span>
                        <span className={jobPct >= 80 ? 'text-amber-400 font-black' : 'text-white'}>
                            {stats.activeJobs} / {jobLimit === 999 ? '∞' : jobLimit} Used
                        </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 rounded-full ${jobPct >= 90 ? 'bg-rose-500' : jobPct >= 75 ? 'bg-amber-400' : 'bg-primary'}`} style={{ width: `${jobPct}%` }} />
                    </div>
                </div>

                {/* Slot Asesmen */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Modul Asesmen</span>
                        <span className="text-white">
                            {stats.assessments} / {asmLimit === 999 ? '∞' : asmLimit} Modul
                        </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 transition-all duration-500 rounded-full" style={{ width: `${asmLimit === 999 ? 10 : Math.min(100, Math.round((stats.assessments/asmLimit)*100))}%` }} />
                    </div>
                </div>

                {/* Staf Terdaftar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Staf Terdaftar</span>
                        <span className={empPct >= 80 ? 'text-amber-400 font-black' : 'text-white'}>
                            {stats.activeEmp} / {empLimit === 999 ? '∞' : empLimit} Staff
                        </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 rounded-full ${empPct >= 90 ? 'bg-rose-500' : empPct >= 75 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${empPct}%` }} />
                    </div>
                </div>
            </div>
        </div>
    )
}
