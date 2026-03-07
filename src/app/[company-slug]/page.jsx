import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Briefcase, Clock, Building2, ArrowRight, Globe } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export async function generateMetadata({ params }) {
    const { 'company-slug': slug } = await params
    const supabase = createAdminSupabaseClient()
    const { data: company } = await supabase
        .from('companies')
        .select('name, industry')
        .eq('slug', slug)
        .single()

    if (!company) return { title: 'Halaman Karir' }
    return {
        title: `Karir di ${company.name}`,
        description: `Lihat lowongan pekerjaan di ${company.name}. Bergabung dan kembangkan karir Anda.`,
    }
}

const WORK_TYPE_LABEL = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' }
const EMPLOYMENT_TYPE_LABEL = { fulltime: 'Full-time', parttime: 'Part-time', contract: 'Kontrak', internship: 'Magang' }

export default async function CareerPage({ params }) {
    const { 'company-slug': slug } = await params
    const supabase = createAdminSupabaseClient()

    // Fetch company — satu query
    const { data: company } = await supabase
        .from('companies')
        .select('id, name, logo_url, industry, website')
        .eq('slug', slug)
        .single()

    if (!company) notFound()

    // Fetch published jobs — satu query, no N+1
    const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title, slug, location, work_type, employment_type, deadline, published_at')
        .eq('company_id', company.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-sidebar-bg text-sidebar-text">
                <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
                    <div className="flex items-center gap-5">
                        {company.logo_url ? (
                            <img src={company.logo_url} alt={company.name} className="w-16 h-16 rounded-2xl object-cover bg-white" />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-sidebar-active flex items-center justify-center shrink-0">
                                <Building2 className="w-8 h-8 text-sidebar-muted" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">{company.name}</h1>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                {company.industry && (
                                    <span className="text-sm text-sidebar-muted">{company.industry}</span>
                                )}
                                {company.website && (
                                    <a href={company.website} target="_blank" rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline flex items-center gap-1">
                                        <Globe className="w-3 h-3" /> Website
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Jobs Section */}
            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">
                        Posisi Tersedia
                        <span className="ml-2 text-base font-normal text-muted-foreground">({jobs?.length ?? 0} lowongan)</span>
                    </h2>
                </div>

                {!jobs || jobs.length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl p-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground mb-2">Belum ada lowongan terbuka</h3>
                        <p className="text-sm text-muted-foreground">Pantau terus halaman ini untuk melihat lowongan terbaru.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {jobs.map(job => (
                            <Link
                                key={job.id}
                                href={`/${slug}/${job.slug}`}
                                className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                                            {job.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                            {job.location && (
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5" /> {job.location}
                                                </span>
                                            )}
                                            {job.work_type && (
                                                <span className="flex items-center gap-1.5">
                                                    <Briefcase className="w-3.5 h-3.5" /> {WORK_TYPE_LABEL[job.work_type]}
                                                </span>
                                            )}
                                            {job.employment_type && (
                                                <span className="bg-brand-50 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                    {EMPLOYMENT_TYPE_LABEL[job.employment_type]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground shrink-0">
                                        <div className="flex items-center gap-1 justify-end mb-1">
                                            <Clock className="w-3 h-3" />
                                            {job.published_at
                                                ? formatDistanceToNow(new Date(job.published_at), { addSuffix: true, locale: localeID })
                                                : '—'}
                                        </div>
                                        {job.deadline && (
                                            <div className="text-muted-foreground">
                                                Tutup: {new Date(job.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                            </div>
                                        )}
                                        <ArrowRight className="w-4 h-4 ml-auto mt-2 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
