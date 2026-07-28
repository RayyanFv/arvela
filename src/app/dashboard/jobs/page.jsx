import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { getEffectiveProfileServer } from '@/lib/actions/impersonate'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FilterTabs } from '@/components/ui/FilterTabs'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Briefcase, MapPin, Clock, AlertCircle, ExternalLink, Users, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { Pagination } from '@/components/ui/Pagination'

export const metadata = { title: 'Lowongan — Arvela HR' }

const STATUS_CONFIG = {
    published: { label: 'Aktif', className: 'bg-green-100 text-green-700 border-green-200' },
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground border-border' },
    closed: { label: 'Tutup', className: 'bg-destructive/10 text-destructive border-destructive/20' },
}

const WORK_TYPE_LABEL = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' }
const EMPLOYMENT_TYPE_LABEL = {
    fulltime: 'Full-time', parttime: 'Part-time',
    contract: 'Kontrak', internship: 'Magang',
}

export default async function JobsPage({ searchParams }) {
    const res = await getEffectiveProfileServer()
    const user = res?.user

    // Guard: tidak ada sesi aktif
    if (!user) redirect('/login')

    const supabase = createAdminSupabaseClient()
    const profile = res.profile

    // Guard: profile belum ada di DB (trigger belum running atau akun lama)
    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Profil belum siap</h2>
                <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
                    Akun Anda belum terhubung ke profil perusahaan. Ini bisa terjadi jika registrasi belum selesai sepenuhnya.
                    Coba logout lalu daftar ulang, atau hubungi administrator.
                </p>
                <form action={async () => {
                    "use server"
                    const sb = createAdminSupabaseClient()
                    await sb.auth.signOut()
                    redirect('/login')
                }}>
                    <Button type="submit" variant="outline">
                        Logout & Coba Lagi
                    </Button>
                </form>
            </div>
        )
    }

    const params = await searchParams
    const filterStatus = params?.status || 'all'
    const page = parseInt(params?.page || '1', 10)
    const limit = 20
    const offset = (page - 1) * limit

    let query = supabase
        .from('jobs')
        .select('id, title, slug, status, work_type, employment_type, location, deadline, created_at, published_at', { count: 'exact' })
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
    }

    const countQuery = (status) => {
        let q = supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id)
        if (status) q = q.eq('status', status)
        return q
    }

    const [
        { data: jobs, count },
        { data: company },
        { count: allCount },
        { count: publishedCount },
        { count: draftCount },
        { count: closedCount },
    ] = await Promise.all([
        query.range(offset, offset + limit - 1),
        supabase.from('companies').select('slug').eq('id', profile.company_id).single(),
        countQuery(),
        countQuery('published'),
        countQuery('draft'),
        countQuery('closed'),
    ])

    const companySlug = company?.slug ?? null

    const counts = {
        all: allCount ?? 0,
        published: publishedCount ?? 0,
        draft: draftCount ?? 0,
        closed: closedCount ?? 0,
    }

    const displayJobs = jobs ?? []
    const totalPages = Math.ceil((count || 0) / limit)

    // Jumlah pelamar per lowongan pada halaman ini saja — hindari fetch seluruh tabel applications
    const jobIds = displayJobs.map(j => j.id)
    let applicantCounts = {}
    if (jobIds.length > 0) {
        const { data: apps } = await supabase
            .from('applications')
            .select('job_id')
            .in('job_id', jobIds)
        applicantCounts = (apps || []).reduce((acc, a) => {
            acc[a.job_id] = (acc[a.job_id] || 0) + 1
            return acc
        }, {})
    }

    return (
        <div>
            <PageHeader
                title="Lowongan Kerja"
                description="Kelola dan buat lowongan pekerjaan untuk perusahaan Anda."
                action={
                    <Link
                        href="/dashboard/jobs/new"
                        className="inline-flex items-center justify-center shrink-0 rounded-lg text-sm font-medium transition-colors outline-none h-10 px-4 bg-primary hover:bg-brand-600 text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Buat Lowongan
                    </Link>
                }
            />

            {/* Filter Tabs */}
            <div className="mb-6 w-fit">
                <FilterTabs
                    paramName="status"
                    currentTab={filterStatus}
                    tabs={[
                        { key: 'all', label: `Semua (${counts.all})` },
                        { key: 'published', label: `Aktif (${counts.published})` },
                        { key: 'draft', label: `Draft (${counts.draft})` },
                        { key: 'closed', label: `Tutup (${counts.closed})` },
                    ]}
                />
            </div>

            {/* Jobs List */}
            {displayJobs.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-16 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
                        <Briefcase className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">Belum ada lowongan</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
                        {filterStatus === 'all'
                            ? 'Buat lowongan pertama untuk mulai menerima pelamar.'
                            : `Tidak ada lowongan dengan status "${STATUS_CONFIG[filterStatus]?.label}".`}
                    </p>
                    {filterStatus === 'all' && (
                        <Link href="/dashboard/jobs/new" className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 bg-primary hover:bg-brand-600 text-primary-foreground transition-colors">
                            Buat Lowongan Pertama
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid gap-3">
                    {displayJobs.map(job => {
                        const cfg = STATUS_CONFIG[job.status]
                        const applicantCount = applicantCounts[job.id] ?? 0

                        return (
                            <div
                                key={job.id}
                                className="group relative bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden"
                            >
                                <Link
                                    href={`/dashboard/jobs/${job.id}`}
                                    className="flex items-center gap-4 p-5 outline-none"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
                                        <Briefcase className="w-5 h-5 text-primary" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <span className="font-semibold text-foreground truncate">{job.title}</span>
                                            <Badge className={`text-[10px] h-5 px-2 border shrink-0 ${cfg.className}`}>
                                                {cfg.label}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                            {job.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {job.location}
                                                </span>
                                            )}
                                            {job.work_type && <span>{WORK_TYPE_LABEL[job.work_type]}</span>}
                                            {job.employment_type && <span>{EMPLOYMENT_TYPE_LABEL[job.employment_type]}</span>}
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: localeID })}
                                            </span>
                                            {job.deadline && (
                                                <span>Deadline: {new Date(job.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="hidden sm:flex flex-col items-center px-4 py-1.5 rounded-lg bg-muted/50">
                                            <span className="flex items-center gap-1 text-sm font-bold text-foreground">
                                                <Users className="w-3.5 h-3.5 text-primary" /> {applicantCount}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-medium">Pelamar</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                                    </div>
                                </Link>

                                <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-t border-border bg-muted/20">
                                    <span className="sm:hidden flex items-center gap-1 text-xs font-semibold text-foreground">
                                        <Users className="w-3.5 h-3.5 text-primary" /> {applicantCount} Pelamar
                                    </span>
                                    {job.status === 'published' && companySlug ? (
                                        <a
                                            href={`/${companySlug}/${job.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> Lihat Halaman Publik
                                        </a>
                                    ) : (
                                        <span className="ml-auto text-xs text-muted-foreground/60">Belum dipublikasikan ke halaman karier</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <div className="mt-6">
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalCount={count || 0}
                    limit={limit}
                    baseUrl="/dashboard/jobs"
                    searchParams={{ status: filterStatus !== 'all' ? filterStatus : undefined }}
                />
            </div>
        </div>
    )
}
