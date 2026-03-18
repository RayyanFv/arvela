import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'
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
    Phone
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function EvaluationProfilePage({ params }) {
    const { id } = await params
    const authClient = await createServerSupabaseClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) redirect('/login')

    const supabase = createAdminSupabaseClient()
    
    // Get profile to check company
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile) redirect('/login')

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

    // Fetch Interviews
    const { data: interviews } = await supabase
        .from('interviews')
        .select('*')
        .eq('application_id', id)
        .order('scheduled_at', { ascending: false })

    // Fetch Assessments & Proctoring
    const { data: assignments } = await supabase
        .from('assessment_assignments')
        .select(`
            *,
            assessments(title),
            answers(*, questions(prompt, points)),
            proctoring_logs(*)
        `)
        .eq('application_id', id)

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-10">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-2">
                    <Link href={`/dashboard/candidates/${id}`} className="inline-flex items-center text-xs font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest group">
                        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Kembali ke Profil
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Evaluasi Komprehensif</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">{app.full_name} — {app.jobs?.title}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 rounded-2xl border-slate-200 font-bold px-6">
                        <Download className="w-4 h-4 mr-2" /> Export PDF
                    </Button>
                    <Button className="h-12 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black px-8 shadow-xl">
                        Simpan Keputusan Final
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Kolom Kiri: Dokumen & Hasil Teknis (8 columns) */}
                <div className="lg:col-span-8 space-y-10">
                    
                    {/* section: Hasil Assessment & Proctoring */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight text-[11px] uppercase tracking-widest">Integritas & Asesmen Teknis</h2>
                        </div>

                        {assignments?.length > 0 ? (
                            <div className="grid gap-6">
                                {assignments.map(asgn => (
                                    <div key={asgn.id} className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm space-y-8">
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black text-slate-900">{asgn.assessments?.title}</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    Diselesaikan pada {format(new Date(asgn.updated_at), 'd MMMM yyyy HH:mm', { locale: localeID })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Skor Akhir</p>
                                                <div className="text-3xl font-black text-primary">{asgn.total_score ?? 'N/A'}<span className="text-xs text-slate-300 ml-1">/100</span></div>
                                            </div>
                                        </div>

                                        {/* Proctoring Warning Box */}
                                        {asgn.proctoring_logs?.length > 0 ? (
                                            <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-6 space-y-4">
                                                <div className="flex items-center gap-2 text-rose-600 font-black text-xs uppercase tracking-widest">
                                                    <ShieldAlert className="w-4 h-4" /> Ditemukan {asgn.proctoring_logs.length} Log Aktivitas Mencurigakan
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {asgn.proctoring_logs.map(log => (
                                                        <div key={log.id} className="bg-white px-3 py-1.5 rounded-xl border border-rose-100 text-[10px] font-bold text-slate-600 shadow-sm">
                                                            {log.log_type.replace(/_/g, ' ').toUpperCase()} • {format(new Date(log.timestamp), 'HH:mm:ss')}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-[32px] p-4 flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm">
                                                    <ShieldAlert className="w-4 h-4" />
                                                </div>
                                                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Integritas Terjaga: Tidak ada aktivitas mencurigakan terdeteksi.</p>
                                            </div>
                                        )}

                                        {/* Detailed Q&A Review */}
                                        <div className="space-y-4 pt-4 border-t border-slate-50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tinjauan Jawaban</p>
                                            <div className="grid gap-4">
                                                {asgn.answers?.map((ans, idx) => (
                                                    <div key={ans.id} className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 group">
                                                        <div className="flex justify-between gap-4 mb-3">
                                                            <p className="text-xs font-bold text-slate-800 leading-relaxed">{idx + 1}. {ans.questions?.prompt}</p>
                                                            <span className="text-[9px] font-black bg-white px-2 py-1 rounded-lg border border-slate-100 h-fit whitespace-nowrap">{ans.questions?.points} Pts</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm italic leading-relaxed">
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
                            <div className="bg-white border border-dashed border-slate-200 rounded-[40px] p-14 text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Belum ada data asesmen</p>
                            </div>
                        )}
                    </div>

                    {/* section: Interview Recordings & Logs */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <Video className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight text-[11px] uppercase tracking-widest">Video Rekaman & Log Interview</h2>
                        </div>

                        {interviews?.length > 0 ? (
                            <div className="grid gap-6">
                                {interviews.map(iv => (iv.recording_url || iv.ai_review_result) && (
                                    <div key={iv.id} className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                        <div className="md:w-1/2 p-8 space-y-6">
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black text-slate-900 capitalize">{iv.type} Interview</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    {format(new Date(iv.scheduled_at), 'EEEE, d MMMM yyyy HH:mm', { locale: localeID })}
                                                </p>
                                            </div>

                                            {iv.recording_url ? (
                                                <div className="bg-slate-950 aspect-video rounded-[32px] flex items-center justify-center text-white/50 border border-white/10 group cursor-pointer relative overflow-hidden">
                                                    <Video className="w-12 h-12 transition-transform group-hover:scale-110" />
                                                    <div className="absolute inset-x-0 bottom-4 px-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] font-black uppercase tracking-widest">RECO-IV-0021</span>
                                                        <Button size="sm" variant="ghost" className="h-8 rounded-xl bg-white/10 text-white font-bold text-[10px] uppercase hover:bg-white/20">
                                                            Play Recording
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 border-2 border-dashed border-slate-100 aspect-video rounded-[32px] flex flex-col items-center justify-center gap-3 text-slate-300">
                                                    <Video className="w-8 h-8 opacity-50" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">Rekaman Tidak Tersedia</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:w-1/2 p-8 bg-slate-50/30 space-y-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                                                    <BrainCircuit className="w-3.5 h-3.5" /> AI Review Results
                                                </div>
                                                <h3 className="text-base font-black text-slate-900">Analisis Kualitatif</h3>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                {iv.ai_review_result ? (
                                                    <p className="text-sm text-slate-600 leading-relaxed font-bold italic">
                                                        &quot;{iv.ai_review_result}&quot;
                                                    </p>
                                                ) : (
                                                    <div className="py-10 text-center space-y-2 opacity-50">
                                                        <BrainCircuit className="w-8 h-8 mx-auto text-slate-300" />
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Menunggu Analisis AI...</p>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm border-b-2 border-b-primary">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Soft Skills</p>
                                                        <p className="text-base font-black text-slate-900">8.5<span className="text-[10px] text-slate-300 ml-0.5">/10</span></p>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm border-b-2 border-b-primary">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Matching Rate</p>
                                                        <p className="text-base font-black text-slate-900">92%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border border-dashed border-slate-200 rounded-[40px] p-14 text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Belum ada riwayat interview terecord</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Kolom Kanan: Ringkasan & Profil (4 columns) */}
                <div className="lg:col-span-4 space-y-8 sticky top-10">
                    
                    {/* Profil Singkat */}
                    <div className="bg-slate-950 text-white rounded-[40px] p-8 space-y-8 shadow-2xl shadow-indigo-200">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-3xl bg-primary text-white flex items-center justify-center text-3xl font-black shadow-lg">
                                {app.full_name.charAt(0)}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black tracking-tight">{app.full_name}</h3>
                                <StageBadge stage={app.stage} size="sm" />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                                <Mail className="w-4 h-4" /> {app.email}
                            </div>
                            {app.phone && (
                                <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                                    <Phone className="w-4 h-4" /> {app.phone}
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                                <FileText className="w-4 h-4" /> {app.jobs?.title}
                            </div>
                        </div>

                        <div className="space-y-4 !mt-10">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tentang Kandidat (Cover Letter)</p>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-4">
                                {app.cover_letter || 'Tidak menyertakan cover letter.'}
                            </p>
                        </div>

                        <Link href={`/dashboard/candidates/${id}`} className="block">
                            <Button className="w-full h-12 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black shadow-lg">
                                Lihat Profil Penuh
                            </Button>
                        </Link>
                    </div>

                    {/* Feedbacks & Peer Review */}
                    <div className="bg-white border border-slate-200 rounded-[40px] p-8 space-y-8 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Feedback HR</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Peer Review</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {app.internal_notes ? (
                                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 relative">
                                    <p className="text-xs text-slate-600 leading-relaxed font-bold">
                                        &quot;{app.internal_notes}&quot;
                                    </p>
                                    <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-md border-2 border-white">
                                        HR
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Belum ada catatan internal dari tim rekrutmen.</p>
                                </div>
                            )}

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div className="flex items-center justify-between pl-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rekomendasi Tim</span>
                                    <div className="flex gap-1">
                                        {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                                    </div>
                                </div>
                                <Button variant="outline" className="w-full h-11 rounded-2xl border-primary/20 text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5">
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
