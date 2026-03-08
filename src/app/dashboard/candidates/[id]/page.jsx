import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { StageBadge } from '@/components/candidates/StageBadge'
import { STAGE_CONFIG, STAGE_ORDER } from '@/lib/constants/stages'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, FileText, Clock, Download, ChevronRight, Link as LinkIcon, UserCheck, Undo2, ChevronLeft } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import StageUpdater from './StageUpdater'
import CandidateAssessmentBox from './AssessmentBox'
import HiringModal from './HiringModal'
import { Button } from '@/components/ui/button'
import { updateStage, cancelHire } from '@/lib/actions/applications'
import ClientActionWrapper from './ClientActionWrapper'
import CopyPortalLinkButton from './CopyPortalLinkButton'

function getPreviewUrl(url) {
    if (!url) return null
    try {
        if (url.includes('drive.google.com')) {
            if (url.includes('/view')) {
                return url.replace(/\/view.*/, '/preview')
            }
            if (url.includes('id=')) {
                const id = new URL(url).searchParams.get('id')
                if (id) return `https://drive.google.com/file/d/${id}/preview`
            }
            return url
        }
        if (url.match(/\.pdf(\?.*)?$/i)) {
            return url
        }
        // doc, docx using Google document viewer
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
    } catch (e) {
        return url
    }
}

export async function generateMetadata({ params }) {
    const { id } = await params
    const db = createAdminSupabaseClient()
    const { data: app } = await db.from('applications').select('full_name').eq('id', id).single()
    return { title: app ? `${app.full_name} — Kandidat` : 'Detail Kandidat' }
}

export default async function CandidateDetailPage({ params }) {
    const { id } = await params
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

    const { data: app } = await supabase
        .from('applications')
        .select(`
      *,
      jobs (id, title, slug),
      stage_history (
        id, from_stage, to_stage, message_to_candidate, created_at,
        profiles (full_name)
      )
    `)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .single()

    if (!app) notFound()

    // Fetch assessments and current assignments for this candidate
    const { data: allAssessments } = await supabase
        .from('assessments')
        .select('id, title, duration_minutes')
        .eq('company_id', profile.company_id)

    const { data: existingAsgn } = await supabase
        .from('assessment_assignments')
        .select(`
            *, 
            assessments(title, duration_minutes),
            answers(*, questions(prompt, type, points))
        `)
        .eq('application_id', id)
        .order('created_at', { ascending: false })

    const sortedHistory = [...(app.stage_history ?? [])].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link href="/dashboard/candidates" className="hover:text-foreground transition-colors">Kandidat</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground font-medium">{app.full_name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Kolom kiri — info kandidat + stage history */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Header kandidat */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                                    {app.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-foreground mb-1">{app.full_name}</h1>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5" />
                                            <a href={`mailto:${app.email}`} className="hover:text-primary transition-colors">{app.email}</a>
                                        </div>
                                        {app.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5" />
                                                <span>{app.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <StageBadge stage={app.stage} size="md" />
                        </div>

                        <div className="mt-5 pt-5 border-t border-border flex flex-wrap gap-4 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Posisi</p>
                                <Link href={`/dashboard/jobs/${app.jobs?.id}`} className="font-medium text-primary hover:underline">
                                    {app.jobs?.title}
                                </Link>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Melamar</p>
                                <p className="font-medium text-foreground">
                                    {format(new Date(app.created_at), 'd MMMM yyyy', { locale: localeID })}
                                </p>
                            </div>
                            {app.cv_url && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">CV</p>
                                    <a href={app.cv_url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                                        <Download className="w-3.5 h-3.5" /> Download CV
                                    </a>
                                </div>
                            )}
                            {app.portfolio_url && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Portofolio</p>
                                    <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                                        <LinkIcon className="w-3.5 h-3.5" /> Buka Tautan
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cover letter */}
                    {app.cover_letter && (
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                Surat Lamaran
                            </h2>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{app.cover_letter}</p>
                        </div>
                    )}

                    {/* CV Preview */}
                    {app.cv_url && (
                        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col min-h-[500px]">
                            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                Preview CV
                            </h2>
                            <div className="flex-1 rounded-xl overflow-hidden border border-border bg-slate-50">
                                <iframe
                                    src={getPreviewUrl(app.cv_url) || ''}
                                    className="w-full h-full min-h-[500px]"
                                    title="CV Preview"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    )}

                    {/* Stage history */}
                    {sortedHistory.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                Riwayat Stage
                            </h2>
                            <div className="space-y-3">
                                {sortedHistory.map(hist => (
                                    <div key={hist.id} className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {hist.from_stage ? (
                                                    <>
                                                        <StageBadge stage={hist.from_stage} size="sm" />
                                                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                                        <StageBadge stage={hist.to_stage} size="sm" />
                                                    </>
                                                ) : (
                                                    <StageBadge stage={hist.to_stage} size="sm" />
                                                )}
                                                <span className="text-xs text-muted-foreground ml-auto">
                                                    {formatDistanceToNow(new Date(hist.created_at), { addSuffix: true, locale: localeID })}
                                                </span>
                                            </div>
                                            {hist.profiles?.full_name && (
                                                <p className="text-xs text-muted-foreground mt-0.5">oleh {hist.profiles.full_name}</p>
                                            )}
                                            {hist.message_to_candidate && (
                                                <p className="text-xs text-foreground bg-secondary rounded-lg px-3 py-2 mt-2">{hist.message_to_candidate}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Kolom kanan — aksi */}
                <div className="space-y-4">
                    {app.stage !== 'hired' ? (
                        <div className="space-y-4">
                            <HiringModal application={app} />
                            <StageUpdater application={app} userRole={profile.role} />
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-emerald-100 rounded-[40px] p-8 text-center space-y-6 shadow-2xl shadow-emerald-500/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                            <div className="w-16 h-16 bg-emerald-500 rounded-[24px] flex items-center justify-center mx-auto text-white shadow-xl shadow-emerald-500/30 transform group-hover:rotate-12 transition-transform">
                                <UserCheck className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    Active Employee
                                </div>
                                <h3 className="text-xl font-black text-slate-900 leading-tight">Berhasil Direkrut</h3>
                                <div className="space-y-3">
                                    <CopyPortalLinkButton email={app.email} />
                                    <Button variant="ghost" className="w-full text-xs font-black text-slate-400 tracking-widest uppercase py-4">
                                        Log Panggilan & Catatan
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed px-4">
                                    Kandidat telah memiliki akses ke portal karyawan dan sedang dalam tahap onboarding.
                                </p>
                            </div>

                            <div className="grid gap-3 pt-2">
                                <Link href="/dashboard/employees" className="w-full">
                                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-2xl font-black gap-2 shadow-lg hover:scale-[1.02] transition-all">
                                        Data Karyawan <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>

                                <ClientActionWrapper applicationId={app.id} action={cancelHire}>
                                    <Button
                                        variant="outline"
                                        className="w-full border-slate-200 text-slate-400 hover:text-destructive hover:border-destructive/30 h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest group"
                                    >
                                        <Undo2 className="w-3.5 h-3.5 mr-2 transition-transform group-hover:-translate-x-1" /> Ganti Status / Undo Hired
                                    </Button>
                                </ClientActionWrapper>
                            </div>
                        </div>
                    )}
                    <CandidateAssessmentBox
                        application={app}
                        assessments={allAssessments || []}
                        existingAssignments={existingAsgn || []}
                    />
                </div>
            </div>
        </div>
    )
}
