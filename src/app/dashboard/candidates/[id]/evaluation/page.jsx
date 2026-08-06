import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { getEffectiveProfileServer } from '@/lib/actions/impersonate'
import { notFound, redirect } from 'next/navigation'
import { StageBadge } from '@/components/candidates/StageBadge'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import {
    ChevronLeft,
    FileText,
    Video,
    ShieldAlert,
    BrainCircuit,
    MessageSquare,
    Star,
    Download,
    Mail,
    Phone,
    Plus
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function EvaluationProfilePage({ params }) {
    const { id } = await params
    const res = await getEffectiveProfileServer()
    if (!res?.user) redirect('/login')
    const profile = res.profile
    if (!profile) redirect('/login')

    const supabase = createAdminSupabaseClient()

    // Fetch Application & Job info
    const { data: app } = await supabase
        .from('applications')
        .select(`
            *,
            jobs (title, description),
            stage_history (to_stage, created_at, profiles(full_name))
        `)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .single()

    if (!app) notFound()

    // Interviews and assessment assignments are both keyed only on `id` —
    // independent of each other, so fetch them together.
    const [{ data: interviews }, { data: assignments }] = await Promise.all([
        supabase
            .from('interviews')
            .select('*')
            .eq('application_id', id)
            .order('scheduled_at', { ascending: false }),

        supabase
            .from('assessment_assignments')
            .select(`
                *,
                assessments(title),
                answers(*, questions(prompt, points)),
                proctoring_logs(*)
            `)
            .eq('application_id', id),
    ])

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5">
                    <Link href={`/dashboard/candidates/${id}`} className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-primary transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Kembali ke Profil
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Evaluasi Komprehensif</h1>
                    <p className="text-xs text-slate-400 font-medium">{app.full_name} — {app.jobs?.title}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-10 rounded-md font-semibold px-5">
                        <Download className="w-4 h-4 mr-2" /> Export PDF
                    </Button>
                    <Button className="h-10 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6">
                        Simpan Keputusan Final
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Kolom Kiri: Dokumen & Hasil Teknis (8 columns) */}
                <div className="lg:col-span-8 space-y-8">

                    {/* section: Hasil Assessment & Proctoring */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600">
                                <ShieldAlert className="w-4.5 h-4.5" />
                            </div>
                            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Integritas & Asesmen Teknis</h2>
                        </div>

                        {assignments?.length > 0 ? (
                            <div className="grid gap-4">
                                {assignments.map(asgn => (
                                    <div key={asgn.id} className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-0.5">
                                                <h3 className="text-base font-bold text-slate-900">{asgn.assessments?.title}</h3>
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                    Diselesaikan pada {format(new Date(asgn.updated_at), 'd MMMM yyyy HH:mm', { locale: localeID })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Skor Akhir</p>
                                                <div className="text-2xl font-bold text-primary">{asgn.total_score ?? 'N/A'}<span className="text-xs text-slate-300 ml-1">/100</span></div>
                                            </div>
                                        </div>

                                        {/* Proctoring Warning Box */}
                                        {asgn.proctoring_logs?.length > 0 ? (
                                            <div className="bg-rose-50 border border-rose-200 rounded-md p-4 space-y-3">
                                                <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs uppercase tracking-wide">
                                                    <ShieldAlert className="w-4 h-4" /> Ditemukan {asgn.proctoring_logs.length} Log Aktivitas Mencurigakan
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {asgn.proctoring_logs.map(log => (
                                                        <div key={log.id} className="bg-white px-3 py-1.5 rounded-md border border-rose-200 text-[10px] font-medium text-slate-600">
                                                            {log.log_type.replace(/_/g, ' ').toUpperCase()} • {format(new Date(log.timestamp), 'HH:mm:ss')}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-emerald-500 shrink-0">
                                                    <ShieldAlert className="w-4 h-4" />
                                                </div>
                                                <p className="text-[10px] font-semibold text-emerald-700">Integritas Terjaga: Tidak ada aktivitas mencurigakan terdeteksi.</p>
                                            </div>
                                        )}

                                        {/* Detailed Q&A Review */}
                                        <div className="space-y-3 pt-3 border-t border-slate-100">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Tinjauan Jawaban</p>
                                            <div className="grid gap-3">
                                                {asgn.answers?.map((ans, idx) => (
                                                    <div key={ans.id} className="bg-slate-50 rounded-md p-4 border border-slate-100">
                                                        <div className="flex justify-between gap-4 mb-2">
                                                            <p className="text-xs font-semibold text-slate-800 leading-relaxed">{idx + 1}. {ans.questions?.prompt}</p>
                                                            <span className="text-[9px] font-semibold bg-white px-2 py-1 rounded-md border border-slate-200 h-fit whitespace-nowrap">{ans.questions?.points} Pts</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 bg-white p-3 rounded-md border border-slate-100 italic leading-relaxed">
                                                            &quot;{ans.answer_text || 'Tidak dijawab'}&quot;
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border border-dashed border-slate-200 rounded-md p-12 text-center">
                                <p className="text-xs text-slate-400 font-medium">Belum ada data asesmen</p>
                            </div>
                        )}
                    </div>

                    {/* section: Interview Recordings & Logs */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-50 rounded-md flex items-center justify-center text-blue-600">
                                <Video className="w-4.5 h-4.5" />
                            </div>
                            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Video Rekaman & Log Interview</h2>
                        </div>

                        {interviews?.length > 0 ? (
                            <div className="grid gap-4">
                                {interviews.map(iv => (iv.recording_url || iv.ai_review_result) && (
                                    <div key={iv.id} className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                        <div className="md:w-1/2 p-6 space-y-4">
                                            <div className="space-y-0.5">
                                                <h3 className="text-base font-bold text-slate-900 capitalize">{iv.type} Interview</h3>
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                    {format(new Date(iv.scheduled_at), 'EEEE, d MMMM yyyy HH:mm', { locale: localeID })}
                                                </p>
                                            </div>

                                            {iv.recording_url ? (
                                                <div className="bg-slate-950 aspect-video rounded-md flex items-center justify-center text-white/50 border border-white/10 group cursor-pointer relative overflow-hidden">
                                                    <Video className="w-10 h-10 transition-transform group-hover:scale-110" />
                                                    <div className="absolute inset-x-0 bottom-3 px-5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] font-semibold uppercase tracking-wide">RECO-IV-0021</span>
                                                        <Button size="sm" variant="ghost" className="h-8 rounded-md bg-white/10 text-white font-semibold text-[10px] uppercase hover:bg-white/20">
                                                            Play Recording
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 border-2 border-dashed border-slate-200 aspect-video rounded-md flex flex-col items-center justify-center gap-2 text-slate-300">
                                                    <Video className="w-7 h-7 opacity-50" />
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide">Rekaman Tidak Tersedia</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:w-1/2 p-6 bg-slate-50 space-y-4">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2 text-primary font-semibold text-[10px] uppercase tracking-wide">
                                                    <BrainCircuit className="w-3.5 h-3.5" /> AI Review Results
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900">Analisis Kualitatif</h3>
                                            </div>

                                            <div className="space-y-3">
                                                {iv.ai_review_result ? (
                                                    <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                                                        &quot;{iv.ai_review_result}&quot;
                                                    </p>
                                                ) : (
                                                    <div className="py-8 text-center space-y-2 opacity-50">
                                                        <BrainCircuit className="w-7 h-7 mx-auto text-slate-300" />
                                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Menunggu Analisis AI...</p>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                                                    <div className="bg-white p-3 rounded-md border border-slate-100 border-b-2 border-b-primary">
                                                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1 leading-none">Soft Skills</p>
                                                        <p className="text-sm font-bold text-slate-900">8.5<span className="text-[10px] text-slate-300 ml-0.5">/10</span></p>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-md border border-slate-100 border-b-2 border-b-primary">
                                                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1 leading-none">Matching Rate</p>
                                                        <p className="text-sm font-bold text-slate-900">92%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border border-dashed border-slate-200 rounded-md p-12 text-center">
                                <p className="text-xs text-slate-400 font-medium">Belum ada riwayat interview terecord</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Kolom Kanan: Ringkasan & Profil (4 columns) */}
                <div className="lg:col-span-4 space-y-6 sticky top-6">

                    {/* Profil Singkat */}
                    <div className="bg-slate-900 text-white rounded-md p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-md bg-primary text-white flex items-center justify-center text-xl font-bold shrink-0">
                                {app.full_name.charAt(0)}
                            </div>
                            <div className="space-y-1 min-w-0">
                                <h3 className="text-lg font-bold tracking-tight truncate">{app.full_name}</h3>
                                <StageBadge stage={app.stage} size="sm" />
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                                <Mail className="w-4 h-4" /> {app.email}
                            </div>
                            {app.phone && (
                                <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                                    <Phone className="w-4 h-4" /> {app.phone}
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                                <FileText className="w-4 h-4" /> {app.jobs?.title}
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Tentang Kandidat (Cover Letter)</p>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-4">
                                {app.cover_letter || 'Tidak menyertakan cover letter.'}
                            </p>
                        </div>

                        <Link href={`/dashboard/candidates/${id}`} className="block">
                            <Button className="w-full h-10 rounded-md bg-white text-slate-900 hover:bg-slate-100 font-semibold">
                                Lihat Profil Penuh
                            </Button>
                        </Link>
                    </div>

                    {/* Feedbacks & Peer Review */}
                    <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h3 className="text-base font-bold text-slate-900">Feedback HR</h3>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Peer Review</p>
                            </div>
                            <div className="w-9 h-9 bg-slate-50 rounded-md flex items-center justify-center text-slate-400 shrink-0">
                                <MessageSquare className="w-4.5 h-4.5" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {app.internal_notes ? (
                                <div className="p-4 bg-slate-50 rounded-md border border-slate-100 relative">
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        &quot;{app.internal_notes}&quot;
                                    </p>
                                    <div className="absolute -bottom-2 -left-2 w-7 h-7 bg-primary rounded-md flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">
                                        HR
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 text-center bg-slate-50 rounded-md border border-dashed border-slate-200">
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Belum ada catatan internal dari tim rekrutmen.</p>
                                </div>
                            )}

                            <div className="space-y-3 pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Rekomendasi Tim</span>
                                    <div className="flex gap-1">
                                        {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                                    </div>
                                </div>
                                <Button variant="outline" className="w-full h-10 rounded-md border-primary/20 text-primary font-semibold uppercase tracking-wide text-[10px] hover:bg-brand-50">
                                    <Plus className="w-3.5 h-3.5 mr-2" /> Tambah Review Baru
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
