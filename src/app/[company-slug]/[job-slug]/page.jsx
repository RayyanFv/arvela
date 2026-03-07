import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MapPin, Briefcase, Clock, Building2, ArrowLeft, Globe, CalendarDays } from 'lucide-react'

export async function generateMetadata({ params }) {
    const { 'company-slug': companySlug, 'job-slug': jobSlug } = await params
    const supabase = createAdminSupabaseClient()
    const { data: job } = await supabase
        .from('jobs')
        .select('title, companies!inner(name, slug)')
        .eq('slug', jobSlug)
        .eq('status', 'published')
        .eq('companies.slug', companySlug)
        .single()

    if (!job) return { title: 'Lowongan Kerja' }
    return {
        title: `${job.title} — ${job.companies.name}`,
        description: `Lamar posisi ${job.title} di ${job.companies.name}.`,
    }
}

const WORK_TYPE_LABEL = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' }
const EMPLOYMENT_TYPE_LABEL = { fulltime: 'Full-time', parttime: 'Part-time', contract: 'Kontrak', internship: 'Magang' }

export default async function JobDetailPage({ params }) {
    const { 'company-slug': companySlug, 'job-slug': jobSlug } = await params
    const supabase = createAdminSupabaseClient()

    const { data: job } = await supabase
        .from('jobs')
        .select(`
            id, title, slug, description, requirements,
            location, work_type, employment_type, deadline, published_at,
            companies!inner (id, name, logo_url, industry, website, slug)
        `)
        .eq('slug', jobSlug)
        .eq('status', 'published')
        .eq('companies.slug', companySlug)
        .single()

    if (!job || job.companies.slug !== companySlug) notFound()

    return (
        <div className="min-h-screen bg-background">
            {/* Nav */}
            <div className="bg-sidebar-bg border-b border-sidebar-border">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        href={`/${companySlug}`}
                        className="inline-flex items-center gap-1.5 text-sm text-sidebar-muted hover:text-sidebar-text transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke {job.companies.name}
                    </Link>
                    {job.companies.logo_url ? (
                        <img src={job.companies.logo_url} alt={job.companies.name} className="h-8 w-auto rounded-lg object-cover" />
                    ) : (
                        <span className="text-white font-bold text-sm">{job.companies.name}</span>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">{job.title}</h1>
                            <div className="flex flex-wrap gap-2">
                                {job.employment_type && (
                                    <span className="bg-brand-50 text-primary text-sm font-medium px-3 py-1 rounded-full border border-brand-100">
                                        {EMPLOYMENT_TYPE_LABEL[job.employment_type]}
                                    </span>
                                )}
                                {job.work_type && (
                                    <span className="bg-secondary text-muted-foreground text-sm font-medium px-3 py-1 rounded-full">
                                        {WORK_TYPE_LABEL[job.work_type]}
                                    </span>
                                )}
                            </div>
                        </div>

                        {job.description && (
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <h2 className="text-base font-semibold text-foreground mb-4">Deskripsi Pekerjaan</h2>
                                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {job.description}
                                </div>
                            </div>
                        )}

                        {job.requirements && (
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <h2 className="text-base font-semibold text-foreground mb-4">Persyaratan & Kualifikasi</h2>
                                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {job.requirements}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-4">
                        {/* Apply Card */}
                        <div className="bg-card border border-border rounded-2xl p-6 sticky top-6">
                            <h3 className="text-base font-semibold text-foreground mb-4">Lamar Posisi Ini</h3>

                            <div className="space-y-3 mb-6 text-sm">
                                {job.location && (
                                    <div className="flex items-center gap-2.5 text-muted-foreground">
                                        <MapPin className="w-4 h-4 shrink-0 text-primary" />
                                        <span>{job.location}</span>
                                    </div>
                                )}
                                {job.work_type && (
                                    <div className="flex items-center gap-2.5 text-muted-foreground">
                                        <Briefcase className="w-4 h-4 shrink-0 text-primary" />
                                        <span>{WORK_TYPE_LABEL[job.work_type]}</span>
                                    </div>
                                )}
                                {job.deadline && (
                                    <div className="flex items-center gap-2.5 text-muted-foreground">
                                        <CalendarDays className="w-4 h-4 shrink-0 text-destructive" />
                                        <span>
                                            Tutup: {new Date(job.deadline).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'long', year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                )}
                                {job.published_at && (
                                    <div className="flex items-center gap-2.5 text-muted-foreground">
                                        <Clock className="w-4 h-4 shrink-0" />
                                        <span>
                                            Dibuka: {new Date(job.published_at).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'long', year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <Link
                                href={`/${companySlug}/${jobSlug}/apply`}
                                className="inline-flex w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors outline-none h-11 px-4 bg-primary hover:bg-brand-600 text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
                            >
                                Lamar Sekarang
                            </Link>
                        </div>

                        {/* Company Info */}
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Tentang Perusahaan</h3>
                            <div className="flex items-center gap-3 mb-3">
                                {job.companies.logo_url ? (
                                    <img src={job.companies.logo_url} alt={job.companies.name} className="w-10 h-10 rounded-xl object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-foreground text-sm">{job.companies.name}</p>
                                    {job.companies.industry && (
                                        <p className="text-xs text-muted-foreground">{job.companies.industry}</p>
                                    )}
                                </div>
                            </div>
                            {job.companies.website && (
                                <a href={job.companies.website} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                                    <Globe className="w-3.5 h-3.5" /> Kunjungi Website
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
