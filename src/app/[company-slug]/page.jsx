import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Briefcase, Clock, Building2, ArrowRight, Globe, Users, BadgeCheck, ShieldCheck, Sparkles, GalleryHorizontal } from 'lucide-react'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
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
        .select('id, name, logo_url, industry, website, tagline, description, banner_url, size, culture_points, gallery_urls')
        .eq('slug', slug)
        .single()

    if (!company) notFound()

    // Fetch published jobs — satu query, no N+1
    // Only 'public' visibility jobs appear in the listing; link_only/invited
    // jobs are reachable directly via their (token-gated) URL but stay hidden here.
    const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title, slug, location, work_type, employment_type, deadline, published_at')
        .eq('company_id', company.id)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('published_at', { ascending: false })

    const activeJobsCount = jobs?.length ?? 0
    const culturePoints = Array.isArray(company.culture_points) ? company.culture_points : []
    const gallery = Array.isArray(company.gallery_urls) ? company.gallery_urls : []

    return (
        <div className="min-h-screen bg-background">
            {/* Banner */}
            <div className="w-full aspect-[16/5] max-h-72 relative bg-sidebar-bg overflow-hidden">
                {company.banner_url ? (
                    <img src={company.banner_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sidebar-bg via-sidebar-bg to-primary/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-sidebar-bg/60 via-transparent to-transparent" />
            </div>

            {/* Header */}
            <div className="bg-sidebar-bg text-sidebar-text">
                <div className="max-w-4xl mx-auto px-4 pb-10 sm:pb-12 -mt-10 sm:-mt-14 relative">
                    <div className="flex items-end gap-5">
                        {company.logo_url ? (
                            <img
                                src={company.logo_url}
                                alt={company.name}
                                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover bg-white ring-4 ring-white shadow-xl shrink-0"
                            />
                        ) : (
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white ring-4 ring-white shadow-xl flex items-center justify-center shrink-0">
                                <Building2 className="w-10 h-10 text-sidebar-bg/30" />
                            </div>
                        )}
                        <div className="pb-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">{company.name}</h1>
                                <BadgeCheck className="w-5 h-5 text-primary shrink-0" />
                            </div>
                            {company.tagline && (
                                <p className="text-sm sm:text-base text-sidebar-text/80 font-medium mt-1">{company.tagline}</p>
                            )}
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-2 mt-6 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 text-white px-3 py-1.5 rounded-full border border-white/10">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Perusahaan Terverifikasi
                        </span>
                        {company.industry && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 text-white px-3 py-1.5 rounded-full border border-white/10">
                                <Building2 className="w-3.5 h-3.5 text-sidebar-muted" /> {company.industry}
                            </span>
                        )}
                        {company.size && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 text-white px-3 py-1.5 rounded-full border border-white/10">
                                <Users className="w-3.5 h-3.5 text-sidebar-muted" /> {company.size} Karyawan
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 text-white px-3 py-1.5 rounded-full border border-white/10">
                            <Briefcase className="w-3.5 h-3.5 text-sidebar-muted" /> {activeJobsCount} Lowongan Aktif
                        </span>
                        {company.website && (
                            <a href={company.website} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary/20 text-primary px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary/30 transition-colors">
                                <Globe className="w-3.5 h-3.5" /> Website
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* About Section */}
            {company.description && (
                <div className="max-w-4xl mx-auto px-4 pt-10">
                    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
                        <h2 className="text-lg font-semibold text-foreground mb-3">Tentang Perusahaan</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{company.description}</p>
                    </div>
                </div>
            )}

            {/* Kenapa Bergabung — hanya tampil kalau HR sudah mengisi poin budaya kerja */}
            {culturePoints.length > 0 && (
                <div className="max-w-4xl mx-auto px-4 pt-10">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" /> Kenapa Bergabung?
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {culturePoints.map((point, i) => (
                            <div key={i} className="bg-card border border-border rounded-2xl p-5">
                                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                </div>
                                <h3 className="text-sm font-semibold text-foreground mb-1">{point.title}</h3>
                                {point.description && (
                                    <p className="text-xs text-muted-foreground leading-relaxed">{point.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Galeri — hanya tampil kalau HR sudah upload foto */}
            {gallery.length > 0 && (
                <div className="max-w-4xl mx-auto px-4 pt-10">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <GalleryHorizontal className="w-4 h-4 text-primary" /> Galeri
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {gallery.map((url, i) => (
                            <div key={url} className="aspect-square rounded-2xl overflow-hidden border border-border">
                                <img src={url} alt={`${company.name} ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                        {jobs.map(job => {
                            const isNew = job.published_at && differenceInDays(new Date(), new Date(job.published_at)) <= 7
                            return (
                                <Link
                                    key={job.id}
                                    href={`/${slug}/${job.slug}`}
                                    className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-11 h-11 rounded-xl bg-brand-50 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                                            {company.logo_url ? (
                                                <img src={company.logo_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Briefcase className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                                        {job.title}
                                                    </h3>
                                                    {isNew && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">
                                                            Baru
                                                        </span>
                                                    )}
                                                </div>
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
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
