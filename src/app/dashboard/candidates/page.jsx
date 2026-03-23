import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { StageBadge } from '@/components/candidates/StageBadge'
import { STAGE_CONFIG, STAGE_ORDER } from '@/lib/constants/stages'
import Link from 'next/link'
import { Users, Briefcase, Mail, Phone, Clock, Download } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { FilterTabs } from '@/components/ui/FilterTabs'
import { formatDistanceToNow } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export const metadata = { title: 'Kandidat — Arvela HR' }

export default async function CandidatesPage({ searchParams }) {
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
    const filterStage = params?.stage || 'all'
    const filterJob = params?.job || 'all'
    const search = params?.q || ''

    // Fetch semua jobs untuk dropdown filter
    const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    // Fetch applications
    let query = supabase
        .from('applications')
        .select('id, full_name, email, phone, stage, cv_url, created_at, jobs(id, title)')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    if (filterStage !== 'all') query = query.eq('stage', filterStage)
    if (filterJob !== 'all') query = query.eq('job_id', filterJob)
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)

    const { data: applications } = await query

    return (
        <div>
            <PageHeader
                title="Semua Kandidat"
                description="Semua pelamar lintas lowongan dalam satu tampilan."
            />

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                {/* Search */}
                <div className="relative">
                    <SearchInput
                        placeholder="Cari nama atau email..."
                        defaultValue={search}
                        className="w-full sm:w-56"
                    />
                </div>

                {/* Stage filter */}
                <FilterTabs
                    paramName="stage"
                    currentTab={filterStage}
                    tabs={[
                        { key: 'all', label: 'Semua' },
                        ...STAGE_ORDER.map(s => ({ key: s, label: STAGE_CONFIG[s].label }))
                    ].slice(0, 7)}
                />
            </div>

            {/* Total */}
            <p className="text-sm text-muted-foreground mb-4">
                {applications?.length ?? 0} kandidat ditemukan
            </p>

            {/* List */}
            {!applications?.length ? (
                <div className="bg-card border border-border rounded-xl p-16 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                        <Users className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">Belum ada kandidat</h3>
                    <p className="text-sm text-muted-foreground">Kandidat akan muncul setelah ada yang melamar lewat career page.</p>
                </div>
            ) : (
                <div className="grid gap-2">
                    {applications.map(app => (
                        <div
                            key={app.id}
                            className="group relative bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between hover:border-primary/40 hover:shadow-sm transition-all"
                        >
                            <Link href={`/dashboard/candidates/${app.id}`} className="absolute inset-0 z-0" />

                            <div className="flex items-center gap-4">
                                {/* Avatar initials */}
                                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
                                    {app.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-semibold text-sm text-foreground">{app.full_name}</span>
                                        <StageBadge stage={app.stage} />
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {app.email}</span>
                                        {app.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {app.phone}</span>}
                                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {app.jobs?.title}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 relative z-10">
                                {app.cv_url && (
                                    <a
                                        href={app.cv_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                        <Download className="w-3.5 h-3.5" /> CV
                                    </a>
                                )}
                                <span className="text-xs text-muted-foreground flex items-center gap-1 pointer-events-none">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: localeID })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
