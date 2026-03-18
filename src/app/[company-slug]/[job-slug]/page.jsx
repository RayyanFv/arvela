import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Briefcase, Clock, Building2, ArrowLeft, Globe, CalendarDays, Share2, Banknote } from 'lucide-react'

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
            salary_min, salary_max, salary_currency, show_salary,
            companies!inner (id, name, logo_url, industry, website, slug)
        `)
        .eq('slug', jobSlug)
        .eq('status', 'published')
        .eq('companies.slug', companySlug)
        .single()

    if (!job || job.companies.slug !== companySlug) notFound()

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header / Nav */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link
                        href="/portal"
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Job Board
                    </Link>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="h-9 px-3 text-slate-500 font-bold gap-2">
                            <Share2 className="w-4 h-4" /> Bagikan
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
                {/* Hero / Header Section */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 mb-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                                {job.companies?.logo_url ? (
                                    <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 className="w-10 h-10 text-slate-200" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">{job.title}</h1>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-slate-500">
                                    <span className="text-primary underline-offset-4 hover:underline cursor-pointer">{job.companies.name}</span>
                                    <span className="flex items-center gap-1.5 px-2 bg-slate-100 rounded-lg"><MapPin className="w-3.5 h-3.5 text-primary/60" /> {job.location || 'Remote'}</span>
                                    <span className="flex items-center gap-1.5 px-2 bg-slate-100 rounded-lg"><Clock className="w-3.5 h-3.5 text-slate-400" /> {new Date(job.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
                                    {job.show_salary && (job.salary_min || job.salary_max) && (
                                        <span className="flex items-center gap-1.5 px-2 bg-green-50 text-green-700 rounded-lg border border-green-100">
                                            <Banknote className="w-3.5 h-3.5" /> 
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: job.salary_currency || 'IDR', maximumFractionDigits: 0 }).format(job.salary_min || 0)} 
                                            {job.salary_max ? ` - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: job.salary_currency || 'IDR', maximumFractionDigits: 0 }).format(job.salary_max)}` : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href={`/${companySlug}/${jobSlug}/apply`} className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto h-12 px-8 rounded-lg font-bold bg-primary hover:bg-brand-600 text-white shadow-lg shadow-primary/10">
                                    Lamar Posisi Ini
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100">
                        <Badge variant="secondary" className="bg-brand-50 text-primary text-xs font-bold py-1 px-3 rounded-lg border-brand-100/50">
                            {EMPLOYMENT_TYPE_LABEL[job.employment_type]}
                        </Badge>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs font-bold py-1 px-3 rounded-lg">
                            {WORK_TYPE_LABEL[job.work_type]}
                        </Badge>
                        {job.deadline && (
                            <Badge variant="outline" className="text-xs font-bold py-1 px-3 rounded-lg text-destructive border-destructive/20 bg-destructive/5">
                                Deadline: {new Date(job.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {job.description && (
                            <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-5 bg-primary rounded-full" />
                                    Deskripsi Pekerjaan
                                </h2>
                                <div className="text-slate-600 leading-relaxed text-base whitespace-pre-wrap font-medium">
                                    {job.description}
                                </div>
                            </section>
                        )}

                        {job.requirements && (
                            <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-5 bg-primary rounded-full" />
                                    Persyaratan & Kualifikasi
                                </h2>
                                <div className="text-slate-600 leading-relaxed text-base whitespace-pre-wrap font-medium">
                                    {job.requirements}
                                </div>
                            </section>
                        )}

                        {/* FEAT: Quick Details / Lokasi / Gaji Sidebar (Mobile Opt) */}
                        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sm:hidden">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Ringkasan Pekerjaan</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 leading-tight">Lokasi</p>
                                        <p className="text-sm font-bold text-slate-900 leading-tight">{job.location || 'Remote'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                        <CalendarDays className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 leading-tight">Tipe</p>
                                        <p className="text-sm font-bold text-slate-900 leading-tight">{EMPLOYMENT_TYPE_LABEL[job.employment_type]} ({WORK_TYPE_LABEL[job.work_type]})</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        {/* Company Card */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Tentang Perusahaan</h3>
                            <div className="flex items-center gap-4 mb-6">
                                {job.companies.logo_url ? (
                                    <img src={job.companies.logo_url} alt={job.companies.name} className="w-12 h-12 rounded-lg object-cover border border-slate-100" />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                        <Building2 className="w-6 h-6 text-slate-300" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-slate-900 leading-tight mb-1">{job.companies.name}</p>
                                    <p className="text-xs font-medium text-slate-500">{job.companies.industry || 'Teknologi & Informasi'}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {job.companies.website && (
                                    <a href={job.companies.website} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 text-sm font-bold text-primary hover:text-brand-600 transition-colors bg-brand-50 p-3 rounded-lg border border-brand-100">
                                        <Globe className="w-4 h-4" /> Kunjungi Website Resmi
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Safety Warning */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Tips Keamanan</h4>
                            <p className="text-xs font-medium text-amber-700 leading-relaxed">
                                Arvela tidak pernah meminta imbalan uang dalam proses rekrutmen. Hubungi kami jika Anda menemukan indikasi penipuan.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
