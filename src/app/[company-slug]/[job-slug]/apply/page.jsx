import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Briefcase, MapPin, Building2 } from 'lucide-react'
import ApplyForm from './ApplyForm'

export async function generateMetadata({ params }) {
    const { 'company-slug': companySlug, 'job-slug': jobSlug } = await params
    const supabase = createAdminSupabaseClient()
    const { data: job } = await supabase
        .from('jobs')
        .select('title, companies!inner(name, slug)')
        .eq('slug', jobSlug)
        .eq('companies.slug', companySlug)
        .single()
    return { title: job ? `Lamar: ${job.title} — ${job.companies.name}` : 'Form Lamaran' }
}

const WORK_TYPE_LABEL = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' }

export default async function ApplyPage({ params }) {
    const { 'company-slug': companySlug, 'job-slug': jobSlug } = await params
    const supabase = createAdminSupabaseClient()

    const { data: job } = await supabase
        .from('jobs')
        .select(`
            id, title, slug, location, work_type, employment_type, deadline, status,
            companies!inner (id, name, logo_url, slug)
        `)
        .eq('slug', jobSlug)
        .eq('status', 'published')
        .eq('companies.slug', companySlug)
        .single()

    if (!job || job.companies.slug !== companySlug) notFound()

    // Cek deadline
    const isExpired = job.deadline && new Date(job.deadline) < new Date()

    return (
        <div className="min-h-screen bg-background">
            {/* Topbar */}
            <div className="bg-sidebar-bg border-b border-sidebar-border">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href={`/${companySlug}/${jobSlug}`}
                        className="inline-flex items-center gap-1.5 text-sm text-sidebar-muted hover:text-sidebar-text transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Detail Lowongan
                    </Link>
                    {job.companies.logo_url ? (
                        <img src={job.companies.logo_url} alt={job.companies.name} className="h-8 rounded-lg object-cover" />
                    ) : (
                        <span className="text-white font-bold text-sm">{job.companies.name}</span>
                    )}
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-10">
                {/* Job info header */}
                <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                            <Briefcase className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{job.title}</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5" /> {job.companies.name}
                                </span>
                                {job.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                                    </span>
                                )}
                                {job.work_type && <span>{WORK_TYPE_LABEL[job.work_type]}</span>}
                            </div>
                            {job.deadline && (
                                <p className={`text-xs mt-2 ${isExpired ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                    {isExpired ? 'Pendaftaran sudah ditutup' : `Batas pendaftaran: ${new Date(job.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form card */}
                {isExpired ? (
                    <div className="bg-card border border-border rounded-2xl p-10 text-center">
                        <h2 className="text-lg font-semibold text-foreground mb-2">Pendaftaran Ditutup</h2>
                        <p className="text-sm text-muted-foreground mb-6">Batas waktu pendaftaran untuk posisi ini sudah berakhir.</p>
                        <Link href={`/${companySlug}`} className="text-sm text-primary hover:underline">
                            Lihat lowongan lain yang masih tersedia
                        </Link>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-6">Isi Form Lamaran</h2>
                        <ApplyForm job={job} company={job.companies} />
                    </div>
                )}
            </div>
        </div>
    )
}
