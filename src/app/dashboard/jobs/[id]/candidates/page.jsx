import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { StageBadge } from '@/components/candidates/StageBadge'
import { STAGE_CONFIG, STAGE_ORDER } from '@/lib/constants/stages'
import Link from 'next/link'
import { Users, Mail, Phone, Clock, Download, ArrowLeft, ChevronRight, Link as LinkIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export async function generateMetadata({ params }) {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: job } = await supabase.from('jobs').select('title').eq('id', id).single()
    return { title: job ? `Kandidat: ${job.title}` : 'Pipeline Kandidat' }
}

export default async function JobCandidatesPage({ params }) {
    const { id: jobId } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/login')

    // Ambil info job
    const { data: job } = await supabase
        .from('jobs')
        .select('id, title, status')
        .eq('id', jobId)
        .eq('company_id', profile.company_id)
        .single()

    if (!job) notFound()

    // Fetch SEMUA kandidat 1 job dalam SATU query
    const { data: applications } = await supabase
        .from('applications')
        .select('id, full_name, email, phone, stage, cv_url, portfolio_url, created_at')
        .eq('job_id', jobId)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    // Group by stage di JS
    const grouped = STAGE_ORDER.reduce((acc, s) => {
        acc[s] = (applications ?? []).filter(a => a.stage === s)
        return acc
    }, {})

    const total = applications?.length ?? 0

    return (
        <div>
            <div className="mb-6">
                <Link href="/dashboard/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Lowongan
                </Link>
                <PageHeader
                    title={`Pipeline: ${job.title}`}
                    description={`${total} kandidat · Drag or click kandidat untuk lihat detail`}
                />
            </div>

            {total === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">Belum ada pelamar</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Bagikan link career page Anda untuk mulai menerima lamaran.
                    </p>
                </div>
            ) : (
                // Kanban view (horizontal scroll pada layar kecil)
                <div className="overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-max">
                        {STAGE_ORDER.map(stageName => {
                            const cfg = STAGE_CONFIG[stageName]
                            const cards = grouped[stageName]
                            return (
                                <div key={stageName} className="w-64 shrink-0">
                                    {/* Column header */}
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                                            <span className="text-sm font-semibold text-foreground">{cfg.label}</span>
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                            {cards.length}
                                        </span>
                                    </div>

                                    {/* Cards */}
                                    <div className="space-y-2">
                                        {cards.length === 0 ? (
                                            <div className="h-20 border-2 border-dashed border-border rounded-xl flex items-center justify-center">
                                                <span className="text-xs text-muted-foreground">Kosong</span>
                                            </div>
                                        ) : (
                                            cards.map(app => (
                                                <div
                                                    key={app.id}
                                                    className="relative bg-card border border-border rounded-xl p-3.5 hover:border-primary/40 hover:shadow-sm transition-all group"
                                                >
                                                    {/* Full card clickable overlay */}
                                                    <Link href={`/dashboard/candidates/${app.id}`} className="absolute inset-0 z-0" />

                                                    {/* Avatar + nama */}
                                                    <div className="flex items-center gap-2.5 mb-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                                            {app.full_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                            {app.full_name}
                                                        </span>
                                                    </div>

                                                    {/* Meta */}
                                                    <div className="space-y-1 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <Mail className="w-3 h-3 shrink-0" />
                                                            <span className="truncate">{app.email}</span>
                                                        </div>
                                                        {app.phone && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Phone className="w-3 h-3 shrink-0" />
                                                                <span>{app.phone}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between pt-1 relative z-10">
                                                            <span className="flex items-center gap-1 pointer-events-none">
                                                                <Clock className="w-3 h-3" />
                                                                {formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: localeID })}
                                                            </span>
                                                            <div className="flex items-center gap-3">
                                                                {app.portfolio_url && (
                                                                    <a
                                                                        href={app.portfolio_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-1 text-primary hover:underline"
                                                                    >
                                                                        <LinkIcon className="w-3 h-3" /> Link
                                                                    </a>
                                                                )}
                                                                {app.cv_url && (
                                                                    <a
                                                                        href={app.cv_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-1 text-primary hover:underline"
                                                                    >
                                                                        <Download className="w-3 h-3" /> CV
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
