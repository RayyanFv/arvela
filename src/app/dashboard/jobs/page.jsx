import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Briefcase, MapPin, Clock, AlertCircle, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

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
    const authClient = await createServerSupabaseClient()
    const { data: { user } } = await authClient.auth.getUser()

    // Guard: tidak ada sesi aktif
    if (!user) redirect('/login')

    const supabase = createAdminSupabaseClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', user.id)
        .single()

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

    let query = supabase
        .from('jobs')
        .select('id, title, slug, status, work_type, employment_type, location, deadline, created_at, published_at')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
    }

    const [{ data: jobs }, { data: company }] = await Promise.all([
        query,
        supabase.from('companies').select('slug').eq('id', profile.company_id).single()
    ])

    const companySlug = company?.slug ?? null


    const counts = {
        all: jobs?.length ?? 0,
        published: jobs?.filter(j => j.status === 'published').length ?? 0,
        draft: jobs?.filter(j => j.status === 'draft').length ?? 0,
        closed: jobs?.filter(j => j.status === 'closed').length ?? 0,
    }

    const displayJobs = filterStatus === 'all'
        ? (jobs ?? [])
        : (jobs ?? []).filter(j => j.status === filterStatus)

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
            <div className="flex gap-1 mb-6 bg-secondary rounded-xl p-1 w-fit">
                {[
                    { key: 'all', label: `Semua (${counts.all})` },
                    { key: 'published', label: `Aktif (${counts.published})` },
                    { key: 'draft', label: `Draft (${counts.draft})` },
                    { key: 'closed', label: `Tutup (${counts.closed})` },
                ].map(tab => (
                    <Link
                        key={tab.key}
                        href={`/dashboard/jobs${tab.key !== 'all' ? `?status=${tab.key}` : ''}`}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === tab.key
                            ? 'bg-white text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {tab.label}
                    </Link>
                ))}
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

                        return (
                            <div
                                key={job.id}
                                className="group relative bg-card rounded-xl border border-border flex flex-col sm:flex-row items-stretch hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden"
                            >
                                <Link
                                    href={`/dashboard/jobs/${job.id}`}
                                    className="flex-1 p-5 flex flex-col sm:flex-row items-start justify-between outline-none"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-brand-100 transition-colors">
                                            <Briefcase className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-foreground">{job.title}</span>
                                                <Badge className={`text-[10px] h-5 px-2 border ${cfg.className}`}>
                                                    {cfg.label}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                {job.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" /> {job.location}
                                                    </span>
                                                )}
                                                {job.work_type && (
                                                    <span>{WORK_TYPE_LABEL[job.work_type]}</span>
                                                )}
                                                {job.employment_type && (
                                                    <span>{EMPLOYMENT_TYPE_LABEL[job.employment_type]}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground shrink-0">
                                        <div className="flex items-center gap-1 justify-end mb-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: localeID })}
                                        </div>
                                        {job.deadline && (
                                            <div>Deadline: {new Date(job.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                        )}
                                    </div>
                                </Link>

                                {job.status === 'published' && companySlug && (
                                    <div className="absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto sm:border-l border-border flex items-center justify-center px-4 bg-muted/20">
                                        <a
                                            href={`/${companySlug}/${job.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                            title="Lihat halaman eksternal"
                                        >
                                            <ExternalLink className="w-4 h-4 hidden sm:block" />
                                            <span className="sm:hidden">Lihat Halaman Publik</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
