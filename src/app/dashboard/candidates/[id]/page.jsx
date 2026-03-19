import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { cn } from '@/lib/utils'
import { StageBadge } from '@/components/candidates/StageBadge'
import { STAGE_CONFIG, STAGE_ORDER } from '@/lib/constants/stages'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, FileText, Clock, Download, ChevronRight, Link as LinkIcon, UserCheck, Undo2, ChevronLeft, HelpCircle } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import StageUpdater from './StageUpdater'
import CandidateAssessmentBox from './AssessmentBox'
import CandidateInterviewBox from './InterviewBox'
import RecruitmentDocManager from './RecruitmentDocManager'
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
      jobs (id, title, slug, screening_questions),
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
            answers(*, questions(prompt, type, points)),
            proctoring_logs(*)
        `)
        .eq('application_id', id)
        .order('created_at', { ascending: false })

    // FEAT: ATS Candidate History Tracking (Unified Profile)
    const { data: allPastApps } = await supabase
        .from('applications')
        .select(`
            id, stage, created_at,
            jobs (id, title),
            assessment_assignments (
                id, status, total_score,
                assessments (title, show_score, questions (points))
            )
        `)
        .eq('email', app.email)
        .eq('company_id', profile.company_id)
        // .neq('id', id) // We want to show current one too in the full timeline? 
        // User said "apply di job mana aja", so including current is fine or separate.
        .order('created_at', { ascending: false })
    
    // FEAT: Recruitment Documents
    const { data: recDocs } = await supabase
        .from('recruitment_documents')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: false })

    // FEAT: Interviews & Templates
    const { data: interviews } = await supabase
        .from('interviews')
        .select('*')
        .eq('application_id', id)
        .order('scheduled_date', { ascending: true })

    const { data: interviewTemplates } = await supabase
        .from('interview_templates')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('title', { ascending: true })

    const sortedHistory = [...(app.stage_history || [])].sort(
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

                    {/* Pre-Screening Answers */}
                    {app.screening_answers && Object.keys(app.screening_answers).length > 0 && (
                        <div className="bg-card border border-border rounded-2xl p-8 space-y-5 bg-gradient-to-br from-white to-slate-50 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                            
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-foreground flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                        <HelpCircle className="w-4 h-4 text-orange-600" />
                                    </div>
                                    Jawaban Kualifikasi Tambahan (Pre-Screening)
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 gap-4 relative z-10">
                                {Object.entries(app.screening_answers).map(([question, answer], idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-primary/20 transition-all group">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Pertanyaan {idx + 1}</p>
                                        <p className="text-sm font-bold text-slate-900 mb-2 leading-snug">{question}</p>
                                        <div className={cn(
                                            "inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border",
                                            answer === "Ya" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                                            answer === "Tidak" ? "bg-rose-50 text-rose-700 border-rose-100" :
                                            "bg-slate-50 text-slate-700 border-slate-200"
                                        )}>
                                            {answer}
                                        </div>
                                    </div>
                                ))}
                            </div>
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

                    {/* Unified Candidate Profile (ATS Timeline) */}
                    {allPastApps && allPastApps.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-foreground flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-orange-600" />
                                    </div>
                                    Unified Candidate History
                                </h2>
                                <span className="bg-orange-50 text-orange-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-orange-100">
                                    {allPastApps.length} Lamaran Total
                                </span>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
                                Menampilkan semua jejak pendaftaran kandidat dengan email <span className="text-foreground font-bold">{app.email}</span> di perusahaan Anda.
                                Gunakan ini untuk melihat konsistensi dan progres performa mereka.
                            </p>

                            <div className="space-y-4">
                                {allPastApps.map(pastApp => (
                                    <div key={pastApp.id} className={cn(
                                        "p-5 rounded-2xl border transition-all group relative",
                                        pastApp.id === id ? "bg-brand-50/30 border-brand-200 ring-2 ring-brand-100/50" : "bg-slate-50 border-slate-100 hover:border-slate-200"
                                    )}>
                                        {pastApp.id === id && (
                                            <div className="absolute top-4 right-4 text-[9px] font-black text-brand-600 uppercase tracking-widest bg-brand-100 px-2 py-0.5 rounded-md">
                                                Sedang Dilihat
                                            </div>
                                        )}
                                        
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                                                    {pastApp.jobs?.title}
                                                </h3>
                                                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(pastApp.created_at), 'd MMMM yyyy', { locale: localeID })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <StageBadge stage={pastApp.stage} size="sm" />
                                                {pastApp.id !== id && (
                                                    <Link href={`/dashboard/candidates/${pastApp.id}`}>
                                                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest gap-1.5">
                                                            Detail <ChevronRight className="w-3 h-3" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        {/* Assessment Summary for this past app */}
                                        {pastApp.assessment_assignments?.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {pastApp.assessment_assignments.map(asgn => {
                                                    const maxPoints = asgn.assessments?.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0
                                                    const scorePct = maxPoints > 0 ? Math.round((asgn.total_score / maxPoints) * 100) : 0
                                                    
                                                    return (
                                                        <div key={asgn.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200/60 rounded-xl">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight truncate leading-none mb-1">
                                                                    {asgn.assessments?.title || 'Assessment'}
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={cn(
                                                                        "text-xs font-bold",
                                                                        asgn.status === 'completed' ? "text-slate-900" : "text-amber-600"
                                                                    )}>
                                                                        {asgn.status === 'completed' ? `Score: ${asgn.total_score}/${maxPoints}` : 'Belum Selesai'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {asgn.status === 'completed' && (
                                                                <div className={cn(
                                                                    "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border",
                                                                    scorePct >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                                                                )}>
                                                                    {scorePct}%
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
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
                            <Link 
                                href={`/dashboard/settings/users?${new URLSearchParams({
                                    email: app.email,
                                    full_name: app.full_name,
                                    role: 'employee',
                                    job_title: app.jobs?.title || '',
                                    app_id: app.id
                                }).toString()}`}
                                className="w-full"
                            >
                                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2 h-11 rounded-xl shadow-lg ring-offset-background transition-all active:scale-95">
                                    <UserCheck className="w-4 h-4" /> Terima & Daftarkan Akses
                                </Button>
                            </Link>
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

                    {/* FEAT: Prosedur Surat Rekrutmen (PKWT & PKWTT) */}
                    {(app.stage === 'hired' || app.stage === 'offering') && (
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                Dokumen Rekrutmen (PKWT/PKWTT)
                            </h2>
                            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                                Upload dan kelola cadangan logis kontrak kerja untuk menghindari kasus kehilangan dokumen fisik (Backup System).
                            </p>
                            <RecruitmentDocManager applicationId={app.id} initialDocs={recDocs || []} />
                        </div>
                    )}

                    <CandidateInterviewBox
                        application={app}
                        templates={interviewTemplates || []}
                        interviews={interviews || []}
                    />

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
