'use client'

import { useState, useEffect, use as useReact } from 'react'
import { useRouter } from 'next/navigation'
import { getAssignmentResult, updateAssignmentScore } from '@/lib/actions/assessments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { 
    ChevronLeft, 
    ShieldAlert, 
    Monitor, 
    ShieldCheck, 
    Clock, 
    CheckCircle2, 
    Trophy, 
    User, 
    Mail, 
    Briefcase, 
    AlertCircle, 
    Loader2,
    Calendar,
    ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default function AssessmentResultPage({ params }) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [data, setData] = useState(null)
    const [points, setPoints] = useState(0)
    const [notes, setNotes] = useState('')

    const unwrappedParams = useReact(params)
    const id = unwrappedParams.id

    useEffect(() => {
        async function fetchResult() {
            try {
                const res = await getAssignmentResult(id)
                setData(res)
                setPoints(res.total_score || 0)
                setNotes(res.reviewer_notes || '')
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchResult()
    }, [id])

    async function handleSubmitScore() {
        setSaving(true)
        try {
            await updateAssignmentScore({
                assignment_id: data.id,
                points: Number(points),
                notes
            })
            router.refresh()
            alert('Hasil penilaian berhasil diperbarui!')
        } catch (err) {
            alert(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Memuat Hasil...</p>
                </div>
            </div>
        )
    }

    if (!data) return <div className="p-10 text-center">Data tidak ditemukan.</div>

    const violations = (data.proctoring_logs || []).filter(l => 
        !['test_started', 'test_submitted', 'test_viewed'].includes(l.log_type)
    )

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href={`/dashboard/candidates/${data.applications.id}`}>
                            <Button variant="ghost" size="sm" className="rounded-xl gap-2 font-bold text-slate-500">
                                <ArrowLeft className="w-4 h-4" /> Kembali
                            </Button>
                        </Link>
                        <div className="h-8 w-px bg-slate-100" />
                        <div>
                            <h1 className="text-lg font-black text-slate-900 leading-none mb-1">Review Assessment</h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{data.assessments.title}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={handleSubmitScore} 
                            disabled={saving}
                            className="rounded-2xl h-11 px-8 font-black gap-2 shadow-xl shadow-primary/20"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            Simpan Hasil Review
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Left: Summary & Final Score */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Profile Card */}
                    <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-16 translate-x-16" />
                        
                        <div className="relative space-y-6">
                            <div className="w-20 h-20 bg-primary/5 rounded-[24px] flex items-center justify-center border border-primary/10">
                                <User className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 leading-tight">{data.applications.full_name}</h2>
                                <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                                    <Mail className="w-3.5 h-3.5" /> {data.applications.email}
                                </p>
                            </div>
                            <div className="h-px bg-slate-50" />
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                                        <Briefcase className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Melamar Untuk:</p>
                                        <p className="text-sm font-bold text-slate-700 truncate">{data.applications.jobs.title}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                                        <Calendar className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Diserahkan Pada:</p>
                                        <p className="text-sm font-bold text-slate-700">{new Date(data.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Score Control Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-2xl text-white space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -translate-y-24 translate-x-24" />
                        
                        <div className="relative space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-primary" /> Penilaian Final
                                </h3>
                                <div className="flex items-baseline gap-4">
                                    <Input
                                        type="number"
                                        value={points}
                                        onChange={(e) => setPoints(e.target.value)}
                                        className="h-20 w-32 rounded-3xl bg-white/5 border-white/10 text-4xl font-black text-center focus:ring-primary/20 placeholder:text-white/10"
                                    />
                                    <div className="text-slate-500 text-6xl font-black leading-none opacity-20">/</div>
                                    <span className="text-2xl font-black text-slate-500">100</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Catatan Peninjauan</Label>
                                <Textarea
                                    placeholder="Tambahkan feedback untuk kandidat..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="h-32 rounded-3xl bg-white/5 border-white/10 text-sm resize-none focus:ring-primary/20 placeholder:text-slate-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Proctoring Summary */}
                    {violations.length > 0 && (
                        <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" /> Proctoring Alert
                                </h3>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border",
                                    violations.length > 5 ? "bg-rose-600 text-white border-rose-700" : "bg-amber-100 text-amber-700 border-amber-200"
                                )}>
                                    {violations.length > 5 ? "High Risk" : "Medium Risk"}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tab / Focus</p>
                                    <p className="text-2xl font-black text-slate-900 leading-none">{violations.filter(l => ['tab_switch_blur', 'window_blur'].includes(l.type)).length}</p>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Cheat / Tools</p>
                                    <p className="text-2xl font-black text-slate-900 leading-none">{violations.filter(l => ['copy_attempt', 'paste_attempt', 'devtools_detected'].includes(l.type)).length}</p>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Face / Audio</p>
                                    <p className="text-2xl font-black text-slate-900 leading-none">{violations.filter(l => ['no_face_detected', 'speech_detected', 'multiple_faces'].includes(l.type)).length}</p>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {violations.map(log => (
                                    <div key={log.id} className="bg-white border border-rose-100/50 p-3 rounded-2xl group hover:border-rose-300 transition-colors">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-tight mb-1">{log.type?.replace(/_/g, ' ') || 'Unknown'}</span>
                                                <span className="text-[10px] text-slate-600 font-bold leading-tight">{log.details?.message}</span>
                                            </div>
                                            <span className="text-[9px] text-slate-400 font-bold tabular-nums shrink-0">{new Date(log.timestamp).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}</span>
                                        </div>
                                        {log.screenshot_url && (
                                            <a href={log.screenshot_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                                                <img 
                                                    src={log.screenshot_url} 
                                                    alt="Capture saat anomali" 
                                                    className="w-full max-w-xs h-auto rounded-xl border border-slate-200 hover:border-rose-400 transition-colors cursor-zoom-in shadow-sm"
                                                />
                                                <span className="text-[8px] text-slate-400 font-bold mt-1 block">📸 Klik untuk memperbesar</span>
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Detailed Answers */}
                <div className="lg:col-span-8 space-y-6">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                        Detail Jawaban Soal
                        <span className="text-xs font-bold text-slate-400 normal-case tracking-normal">{data.answers?.length} Soal Dijawab</span>
                    </h3>

                    <div className="space-y-6">
                        {data.answers?.sort((a,b) => (a.questions?.sort_order || 0) - (b.questions?.sort_order || 0)).map((ans, idx) => {
                            let displayAnswer = ans.answer_text
                            try {
                                const parsed = JSON.parse(ans.answer_text)
                                if (ans.questions?.type === 'matrix') {
                                    const statements = ans.questions.options?.statements || []
                                    const labelsMap = ans.questions.options?.scale?.labels || {}
                                    displayAnswer = Object.entries(parsed)
                                        .map(([sIdx, val]) => {
                                            const stmt = statements[sIdx] || `Pernyataan ${parseInt(sIdx) + 1}`
                                            const lbl = labelsMap[String(val)] ? ` (${labelsMap[String(val)]})` : ''
                                            return `• ${stmt}: ${val}${lbl}`
                                        })
                                        .join('\n')
                                } else if (ans.questions?.type === 'ranking') {
                                    displayAnswer = Array.isArray(parsed) ? parsed.map((v, i) => `${i + 1}. ${v}`).join('\n') : String(parsed)
                                } else if (Array.isArray(parsed)) {
                                    displayAnswer = parsed.join(', ')
                                } else if (typeof parsed === 'object') {
                                    displayAnswer = Object.entries(parsed)
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join('\n')
                                }
                            } catch (e) { }

                            const isCorrect = ans.is_reviewed && ans.points_earned === ans.questions?.points

                            return (
                                <div key={ans.id} className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-6 relative group overflow-hidden">
                                     <div className={cn(
                                        "absolute left-0 top-0 w-2 h-full transition-all duration-500",
                                        isCorrect ? "bg-emerald-500" : (ans.points_earned > 0 ? "bg-amber-500" : "bg-rose-500")
                                    )} />

                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                                                Soal {idx + 1} &bull; {ans.questions?.type?.split('_').join(' ').toUpperCase()}
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-900 leading-snug">{ans.questions?.prompt}</h4>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Poin Didapat</p>
                                                <p className="text-2xl font-black text-slate-900 leading-none">{ans.points_earned}<span className="text-slate-300 text-sm font-bold ml-1">/ {ans.questions?.points || 10}</span></p>
                                            </div>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border",
                                                isCorrect ? "bg-emerald-50 text-emerald-600 border-emerald-100" : (ans.points_earned > 0 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100")
                                            )}>
                                                {isCorrect ? 'Fully Correct' : (ans.points_earned > 0 ? 'Partial Points' : 'Incorrect / No Points')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative shadow-inner">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <User className="w-3.5 h-3.5" /> Jawaban Kandidat
                                            </p>
                                            <p className="text-sm font-extrabold text-slate-800 leading-relaxed whitespace-pre-wrap font-mono">
                                                {displayAnswer || '(Tidak ada jawaban disediakan)'}
                                            </p>
                                        </div>
                                        
                                        {ans.questions?.correct_answer && (
                                            <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 border-dashed relative">
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <ShieldCheck className="w-3.5 h-3.5" /> Kunci Jawaban
                                                </p>
                                                <p className="text-sm font-black text-emerald-900/40 leading-relaxed font-mono whitespace-pre-wrap">
                                                    {Array.isArray(ans.questions.correct_answer) ? ans.questions.correct_answer.join(', ') : String(ans.questions.correct_answer)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>
    )
}
