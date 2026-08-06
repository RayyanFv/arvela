import { getAssignmentResult } from '@/lib/actions/assessments'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
    ShieldAlert,
    User,
    Mail,
    Briefcase,
    Calendar,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    MinusCircle,
    Users
} from 'lucide-react'
import Link from 'next/link'
import { ScoreInputsCard } from './ScoreForm'
import { AnswersList } from './AnswersList'

export default async function AssessmentResultPage({ params }) {
    const { id } = await params

    let data
    try {
        data = await getAssignmentResult(id)
    } catch (err) {
        return <div className="p-10 text-center text-rose-500">Error: {err.message}</div>
    }

    if (!data) return <div className="p-10 text-center">Data tidak ditemukan.</div>

    const violations = (data.proctoring_logs || []).filter(l =>
        !['test_started', 'test_submitted', 'test_viewed'].includes(l.log_type)
    )

    // Summary stats derived from answers — no extra query needed.
    const answers = data.answers || []
    const totalQuestions = answers.length
    const maxPossibleScore = answers.reduce((sum, a) => sum + (a.questions?.points || 0), 0)
    const correctCount = answers.filter(a => a.is_reviewed && a.points_earned === a.questions?.points).length
    const partialCount = answers.filter(a => a.is_reviewed && a.points_earned > 0 && a.points_earned !== a.questions?.points).length
    const incorrectCount = answers.filter(a => a.is_reviewed && (a.points_earned ?? 0) === 0).length
    const unreviewedCount = totalQuestions - correctCount - partialCount - incorrectCount
    const scorePct = maxPossibleScore > 0 ? Math.round(((data.total_score || 0) / maxPossibleScore) * 100) : 0

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/candidates/${data.applications.id}`}>
                            <Button variant="ghost" size="sm" className="rounded-md gap-2 font-semibold text-slate-500">
                                <ArrowLeft className="w-4 h-4" /> Kembali
                            </Button>
                        </Link>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                            <h1 className="text-base font-bold text-slate-900 leading-none mb-1">Review Assessment</h1>
                            <p className="text-xs font-medium text-slate-400">{data.assessments.title}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left: Summary & Final Score */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Profile Card */}
                    <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
                        <div className="w-14 h-14 bg-brand-50 rounded-md flex items-center justify-center border border-primary/10">
                            <User className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">{data.applications.full_name}</h2>
                            <p className="text-sm font-medium text-slate-400 flex items-center gap-1.5 mt-1">
                                <Mail className="w-3.5 h-3.5" /> {data.applications.email}
                            </p>
                        </div>
                        <div className="h-px bg-slate-100" />
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-50 rounded-md flex items-center justify-center border border-slate-200 shrink-0">
                                    <Briefcase className="w-4.5 h-4.5 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide leading-none mb-0.5">Melamar Untuk:</p>
                                    <p className="text-sm font-semibold text-slate-700 truncate">{data.applications.jobs.title}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-50 rounded-md flex items-center justify-center border border-slate-200 shrink-0">
                                    <Calendar className="w-4.5 h-4.5 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide leading-none mb-0.5">Diserahkan Pada:</p>
                                    <p className="text-sm font-semibold text-slate-700">{new Date(data.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Score Control Card (client island) */}
                    <ScoreInputsCard
                        assignmentId={data.id}
                        initialPoints={data.total_score || 0}
                        initialNotes={data.reviewer_notes || ''}
                    />

                    {/* Proctoring Summary */}
                    {violations.length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-md p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-semibold text-rose-600 uppercase tracking-wide flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" /> Proctoring Alert
                                </h3>
                                <div className={cn(
                                    "px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase border",
                                    violations.length > 5 ? "bg-rose-600 text-white border-rose-700" : "bg-amber-100 text-amber-700 border-amber-200"
                                )}>
                                    {violations.length > 5 ? "High Risk" : "Medium Risk"}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white p-3 rounded-md border border-rose-100 text-center">
                                    <p className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Tab / Focus</p>
                                    <p className="text-xl font-bold text-slate-900 leading-none">{violations.filter(l => ['tab_switch_blur', 'window_blur'].includes(l.type)).length}</p>
                                </div>
                                <div className="bg-white p-3 rounded-md border border-rose-100 text-center">
                                    <p className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Cheat / Tools</p>
                                    <p className="text-xl font-bold text-slate-900 leading-none">{violations.filter(l => ['copy_attempt', 'paste_attempt', 'devtools_detected'].includes(l.type)).length}</p>
                                </div>
                                <div className="bg-white p-3 rounded-md border border-rose-100 text-center">
                                    <p className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Face / Audio</p>
                                    <p className="text-xl font-bold text-slate-900 leading-none">{violations.filter(l => ['no_face_detected', 'speech_detected', 'multiple_faces'].includes(l.type)).length}</p>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {violations.map(log => (
                                    <div key={log.id} className="bg-white border border-rose-100 p-3 rounded-md hover:border-rose-300 transition-colors">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className="text-[9px] font-semibold text-rose-500 uppercase mb-0.5">{log.type?.replace(/_/g, ' ') || 'Unknown'}</span>
                                                <span className="text-[10px] text-slate-600 font-medium leading-tight">{log.details?.message}</span>
                                            </div>
                                            <span className="text-[9px] text-slate-400 font-medium tabular-nums shrink-0">{new Date(log.timestamp).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}</span>
                                        </div>
                                        {log.screenshot_url && (
                                            <a href={log.screenshot_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                                                <img
                                                    src={log.screenshot_url}
                                                    alt="Capture saat anomali"
                                                    className="w-full max-w-xs h-auto rounded-md border border-slate-200 hover:border-rose-400 transition-colors cursor-zoom-in"
                                                />
                                                <span className="text-[8px] text-slate-400 font-medium mt-1 block">Klik untuk memperbesar</span>
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Detailed Answers */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Summary Card */}
                    <div className="bg-white border border-slate-200 rounded-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Skor Keseluruhan</p>
                                <p className="text-3xl font-bold text-slate-900">
                                    {data.total_score ?? 0}
                                    <span className="text-base text-slate-300 font-semibold"> / {maxPossibleScore}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className={cn(
                                    "text-2xl font-bold leading-none",
                                    scorePct >= 70 ? "text-emerald-600" : scorePct >= 50 ? "text-amber-600" : "text-rose-600"
                                )}>
                                    {scorePct}%
                                </p>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-1">Pencapaian</p>
                            </div>
                        </div>

                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    scorePct >= 70 ? "bg-emerald-500" : scorePct >= 50 ? "bg-amber-500" : "bg-rose-500"
                                )}
                                style={{ width: `${Math.min(scorePct, 100)}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <div className="bg-emerald-50 rounded-md p-3 text-center">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                                <p className="text-lg font-bold text-emerald-700 leading-none">{correctCount}</p>
                                <p className="text-[9px] font-semibold text-emerald-600 uppercase mt-1">Benar</p>
                            </div>
                            <div className="bg-amber-50 rounded-md p-3 text-center">
                                <MinusCircle className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                                <p className="text-lg font-bold text-amber-700 leading-none">{partialCount}</p>
                                <p className="text-[9px] font-semibold text-amber-600 uppercase mt-1">Sebagian</p>
                            </div>
                            <div className="bg-rose-50 rounded-md p-3 text-center">
                                <XCircle className="w-4 h-4 text-rose-600 mx-auto mb-1" />
                                <p className="text-lg font-bold text-rose-700 leading-none">{incorrectCount}</p>
                                <p className="text-[9px] font-semibold text-rose-600 uppercase mt-1">Salah</p>
                            </div>
                            <div className="bg-slate-50 rounded-md p-3 text-center">
                                <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                                <p className="text-lg font-bold text-slate-500 leading-none">{unreviewedCount}</p>
                                <p className="text-[9px] font-semibold text-slate-400 uppercase mt-1">Belum Dinilai</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center justify-between">
                        Detail Jawaban Soal
                        <span className="text-xs font-medium text-slate-400 normal-case tracking-normal">{totalQuestions} Soal Dijawab</span>
                    </h3>

                    <AnswersList answers={answers} />
                </div>

            </div>
        </div>
    )
}
