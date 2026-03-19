'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Script from 'next/script'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Clock,
    Play,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Loader2,
    AlertTriangle,
    AlertCircle,
    Flag,
    ArrowUp,
    ArrowDown,
    ShieldCheck,
    Check,
    ShieldAlert,
    Monitor,
    Camera,
    CameraOff,
    Activity
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MatrixQuestion } from '@/components/assessment/MatrixQuestion'
import { GameTaskPlaceholder } from '@/components/assessment/GameTaskPlaceholder'
import { logProctoringEvent, startAssignment, uploadProctoringSnapshot } from '@/lib/actions/assessments'
import { useProctoring } from '@/hooks/useProctoring'

export default function AssessmentInterface({ assignment, test, questions, candidateName }) {
    const router = useRouter()
    const [started, setStarted] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState({})
    const [timeLeft, setTimeLeft] = useState(test.duration_minutes * 60)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [agreed, setAgreed] = useState(false)
    const [personalLogs, setPersonalLogs] = useState([])
    const [tabSwitches, setTabSwitches] = useState(0)
    const timerRef = useRef(null)

    // Proctoring Hook
    const { 
        videoRef, 
        canvasRef, 
        cameraActive, 
        multiScreen, 
        faceApiLoaded, 
        initializeFaceApi 
    } = useProctoring({
        assignmentId: assignment.id,
        enabled: started && !submitting && test.proctoring_enabled,
        onAnomaliesLogged: (type, msg) => {
            const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            setPersonalLogs(prev => [{ time, message: msg }, ...prev].slice(0, 5))
            if (type === 'tab_switch_blur') setTabSwitches(prev => prev + 1)
        }
    })

    // Clear interval on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    // Load persisted progress (resuming)
    useEffect(() => {
        const saved = localStorage.getItem(`arvela_test_${assignment.id}`)
        if (saved) {
            try {
                const data = JSON.parse(saved)
                setAnswers(data.answers || {})
                setCurrentIndex(data.currentIndex || 0)
                // We keep the server timer going if started, but locally we could sync too
            } catch(e) {}
        }
    }, [assignment.id])

    // Save progress on every answer change
    useEffect(() => {
        if (started) {
            localStorage.setItem(`arvela_test_${assignment.id}`, JSON.stringify({
                answers,
                currentIndex,
                timestamp: new Date().toISOString()
            }))
        }
    }, [answers, currentIndex, started, assignment.id])

    useEffect(() => {
        // Initialize or retrieve Session ID
        let sessionId = localStorage.getItem(`arvela_asgn_session_${assignment.id}`)
        if (!sessionId) {
            sessionId = crypto.randomUUID()
            localStorage.setItem(`arvela_asgn_session_${assignment.id}`, sessionId)
        }

        // If assignment is already started on the server, we need to verify session ownership
        if (assignment.status === 'started') {
            verifySession(sessionId)
        }
    }, [assignment.id, assignment.status])

    async function verifySession(sessionId) {
        setSubmitting(true)
        const browserMeta = {
            browser: navigator.userAgent,
            platform: navigator.platform,
            resolution: `${window.screen.width}x${window.screen.height}`,
            session_id: sessionId
        }
        
        const res = await startAssignment(assignment.id, browserMeta)
        setSubmitting(false)

        if (res.error === 'SESSION_LOCKED') {
            setError(res.message)
            return
        }
        
        // If success or resuming, it's our session
        if (res.success || res.resuming) {
            setStarted(true)
            // Resume timer if needed (currently timer is local but we could sync with server)
            if (assignment.started_at) {
                const elapsed = Math.floor((new Date() - new Date(assignment.started_at)) / 1000)
                setTimeLeft(Math.max(0, test.duration_minutes * 60 - elapsed))
                
                // Start timer
                if (!timerRef.current) {
                    timerRef.current = setInterval(() => {
                        setTimeLeft(prev => {
                            if (prev <= 1) {
                                clearInterval(timerRef.current)
                                autoSubmit()
                                return 0
                            }
                            return prev - 1
                        })
                    }, 1000)
                }
            }
        }
    }

    async function startTest() {
        let sessionId = localStorage.getItem(`arvela_asgn_session_${assignment.id}`)
        if (!sessionId) {
            sessionId = crypto.randomUUID()
            localStorage.setItem(`arvela_asgn_session_${assignment.id}`, sessionId)
        }

        setSubmitting(true)
        const browserMeta = {
            browser: navigator.userAgent,
            platform: navigator.platform,
            resolution: `${window.screen.width}x${window.screen.height}`,
            uaShort: navigator.userAgent.substring(0, 50) + "...",
            session_id: sessionId
        }

        const res = await startAssignment(assignment.id, browserMeta)
        setSubmitting(false)

        if (res.error) {
            if (res.error === 'SESSION_LOCKED') {
                setError(res.message)
                return
            }
            if (res.error.includes('duplicate') || res.error.includes('already started')) {
                setError("Sesi tes ini sudah dimulai di perangkat lain. Untuk alasan keamanan, tes hanya dapat dibuka di satu browser.")
                return
            }
            setError(res.error)
            return
        }

        setStarted(true)

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current)
                    autoSubmit()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
    }

    function handleOptionSelect(qId, option, type) {
        if (type === 'multiple_select') {
            const current = answers[qId] || []
            const next = current.includes(option)
                ? current.filter(o => o !== option)
                : [...current, option]
            setAnswers({ ...answers, [qId]: next })
        } else {
            setAnswers({ ...answers, [qId]: option })
        }
    }

    function handleMatrixSelect(qId, stmtIdx, val) {
        const current = answers[qId] || {}
        setAnswers({
            ...answers,
            [qId]: { ...current, [stmtIdx]: val }
        })
    }

    function handleEssayChange(qId, value) {
        setAnswers({ ...answers, [qId]: value })
    }

    async function submitTest() {
        if (!confirm('Apakah kamu yakin ingin mengakhiri tes ini?')) return
        performSubmission()
    }

    async function autoSubmit() {
        alert('Waktu habis! Jawaban kamu akan dikirim otomatis.')
        performSubmission()
    }

    async function performSubmission() {
        setSubmitting(true)
        setError('')
        const supabase = createClient()
        
        logProctoringEvent({
            assignment_id: assignment.id,
            event_type: 'test_submitted',
            details: 'Kandidat menekan tombol Selesaikan Tes.'
        })

        try {
            // 1. Process all questions to ensure those with default answers (like ranking) are captured
            const formattedAnswers = questions
                .map((question) => {
                    const qId = question.id
                    const val = answers[qId]

                    // If no answer but it's ranking, we use the default order as the answer
                    let finalVal = val
                    if (val === undefined) {
                        if (question.type === 'ranking') {
                            finalVal = question.options || []
                        } else if (question.type === 'matrix') {
                            // Empty matrix
                            finalVal = {}
                        } else {
                            // Skip unanswered choice/numeric/essay questions
                            return null
                        }
                    }

                    let points = 0
                    if (question.type === 'multiple_choice') {
                        points = finalVal === question.correct_answer ? (question.points || 10) : 0
                    } else if (question.type === 'multiple_select') {
                        const correct = Array.isArray(question.correct_answer) ? question.correct_answer : []
                        const answeredArr = Array.isArray(finalVal) ? finalVal : []
                        const matched = answeredArr.filter(v => correct.includes(v)).length
                        const wrong = answeredArr.filter(v => !correct.includes(v)).length
                        // Simple partial: (correct - wrong) / total * points
                        points = Math.max(0, Math.round(((matched - wrong) / (correct.length || 1)) * (question.points || 10)))
                    } else if (question.type === 'numeric_input') {
                        points = String(finalVal) === String(question.correct_answer) ? (question.points || 10) : 0
                    } else if (question.type === 'ranking') {
                        // For ranking, finalVal is an array of strings. Check if it matches correct_answer (array)
                        points = JSON.stringify(finalVal) === JSON.stringify(question.correct_answer) ? (question.points || 10) : 0
                    }

                    return {
                        assignment_id: assignment.id,
                        question_id: qId,
                        answer_text: typeof finalVal === 'object' ? JSON.stringify(finalVal) : String(finalVal),
                        points_earned: points,
                        is_reviewed: question.type !== 'essay' // Essays need manual review
                    }
                })
                .filter(Boolean)

            if (formattedAnswers.length > 0) {
                const { error: answersError } = await supabase
                    .from('answers')
                    .insert(formattedAnswers)
                if (answersError) throw answersError
            }

            // 2. Calculate total score
            const totalScore = formattedAnswers.reduce((sum, a) => sum + (a.points_earned || 0), 0)

            // 3. Update assignment status
            const { error: statusError } = await supabase
                .from('assessment_assignments')
                .update({
                    status: 'completed',
                    submitted_at: new Date().toISOString(),
                    total_score: totalScore
                })
                .eq('id', assignment.id)

            if (statusError) throw statusError

            localStorage.removeItem(`arvela_test_${assignment.id}`)
            setSubmitting(false)
            router.refresh()
        } catch (err) {
            console.error(err)
            setError('Gagal mengirim jawaban. Cek koneksi internet dan coba lagi.')
            setSubmitting(false)
        }
    }

    if (!started) {
        return (
            <div className="max-w-2xl w-full bg-white border border-border rounded-3xl p-8 sm:p-12 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-24 translate-x-24 blur-2xl" />

                <div className="text-center space-y-4 mb-10">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                        <Play className="w-8 h-8 text-primary fill-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">{test.title}</h1>
                    <p className="text-slate-500 leading-relaxed max-w-sm mx-auto">Selamat datang, <strong>{candidateName}</strong>. Siapkan diri kamu untuk mengerjakan assessment ini.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                        <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Durasi</div>
                        <div className="text-lg font-bold text-slate-900">{test.duration_minutes} Menit</div>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                        <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-2" />
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Soal</div>
                        <div className="text-lg font-bold text-slate-900">{questions.length} Soal</div>
                    </div>
                </div>

                <div className="space-y-4 mb-8 border-t border-slate-100 pt-8">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" /> Pernyataan Integritas & Proctoring:
                    </h3>
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                        <ul className="text-[12px] text-slate-500 space-y-2">
                            <li className="flex items-start gap-2 italic">1. Saya akan mengerjakan tes ini secara mandiri tanpa bantuan AI, orang lain, atau sumber luar yang tidak diizinkan.</li>
                            <li className="flex items-start gap-2 italic">2. Saya memahami bahwa pengerjaan tes ini memiliki batas waktu yang ketat.</li>
                            {test.proctoring_enabled && (
                                <>
                                    <li className="flex items-start gap-2 italic">3. Saya memahami bahwa tes ini diawasi secara otomatis oleh sistem **Arvela Integrity Proctoring**.</li>
                                    <li className="flex items-start gap-2 italic">4. Segala bentuk perpindahan tab, suara mencurigakan, dan kamera akan dicatat sebagai bukti.</li>
                                </>
                            )}
                        </ul>
                    </div>
                    
                    <label className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors group">
                        <input 
                            type="checkbox" 
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" 
                        />
                        <span className="text-sm font-bold text-slate-700 leading-tight">
                            Saya telah membaca peraturan di atas dan siap mengerjakan tes dengan jujur.
                        </span>
                    </label>
                </div>

                <div className="space-y-4 mb-10 border-t border-slate-100 pt-8">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
                        Instruksi Teknis:
                    </h3>
                    <ul className="text-xs text-slate-500 space-y-2">
                        <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-1.5 shrink-0" /> Gunakan koneksi internet yang stabil.</li>
                        <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-1.5 shrink-0" /> Jangan menutup tab ini sebelum menekan tombol <strong>Selesaikan Tes</strong>.</li>
                    </ul>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 p-6 rounded-[32px] flex flex-col items-center gap-4 animate-shake text-center mb-8">
                        <ShieldAlert className="w-12 h-12 text-rose-600" />
                        <div className="space-y-1">
                            <p className="font-black uppercase tracking-widest text-[10px]">Security Exception</p>
                            <p className="text-sm font-bold leading-relaxed">{error}</p>
                        </div>
                    </div>
                )}

                <Button
                    onClick={startTest}
                    disabled={!agreed || submitting || !!error}
                    className="w-full h-14 rounded-2xl font-black text-lg bg-slate-950 text-white hover:bg-slate-900 shadow-xl shadow-slate-300 transform active:scale-95 transition-all group disabled:opacity-30 disabled:grayscale"
                >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Mulai Kerjakan Tes Sekarang <Play className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                </Button>
            </div>
        )
    }

    if (questions.length === 0) {
        return (
            <div className="max-w-md w-full bg-white border border-border rounded-3xl p-12 text-center shadow-2xl shadow-slate-200/50">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-4">Assessment Masih Kosong</h1>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                    Maaf, test ini belum memiliki pertanyaan. Harap hubungi Tim HR untuk informasi lebih lanjut.
                </p>
                <Link href="/portal">
                    <Button variant="outline" className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest">Kembali ke Portal</Button>
                </Link>
            </div>
        )
    }

    const currentQ = questions[currentIndex]
    const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0

    return (
        <div className="min-h-screen bg-[#FDFDFF] font-sans selection:bg-primary selection:text-white">
            <Script 
                src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js" 
                onLoad={initializeFaceApi}
            />
            {/* Nav Header */}
            {/* Left Column: Question Side */}
            <div className="flex-1 w-full space-y-6">

                {/* Progress bar and Timer */}
                <div className="bg-white border border-border rounded-3xl p-6 shadow-sm flex items-center justify-between sticky top-20 z-40">
                    <div className="flex-1 pr-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Kemajuan: {currentIndex + 1} / {questions.length}</span>
                            {tabSwitches > 0 && (
                                <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 uppercase tracking-tighter">
                                    Peringatan: {tabSwitches}x Pindah Tab
                                </span>
                            )}
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border ${timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-700 font-extrabold'} transition-all`}>
                            <Clock className="w-5 h-5 opacity-70" />
                            <span className="text-xl tabular-nums tracking-tighter">{formatTime(timeLeft)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                            <ShieldCheck className="w-3 h-3" /> Proctoring Aktif
                        </div>
                    </div>
                </div>

                {/* Question Area */}
                <div className="bg-white border border-border rounded-3xl p-8 sm:p-12 shadow-sm min-h-[400px] flex flex-col justify-between relative overflow-hidden transition-all motion-safe:animate-in fade-in slide-in-from-bottom-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-16 translate-x-16" />

                    <div className="relative">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-8">
                            Pertanyaan Nomor {currentIndex + 1}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug mb-10 w-full whitespace-pre-wrap">{currentQ?.prompt || 'Soal tidak ditemukan.'}</h2>

                        {(currentQ.type === 'multiple_choice' || currentQ.type === 'multiple_select') ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(currentQ.options || []).map((opt, i) => {
                                    const isSelected = currentQ.type === 'multiple_select'
                                        ? (answers[currentQ.id] || []).includes(opt)
                                        : answers[currentQ.id] === opt

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleOptionSelect(currentQ.id, opt, currentQ.type)}
                                            className={`group flex items-start gap-4 p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${isSelected
                                                ? 'bg-primary border-primary ring-4 ring-primary/10'
                                                : 'bg-white border-slate-200 hover:border-primary/50 hover:bg-slate-50 active:scale-95'
                                                }`}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 border-2 flex items-center justify-center shrink-0 text-[10px] font-bold transition-all",
                                                isSelected ? "bg-white border-white text-primary" : "bg-slate-50 border-slate-200 text-slate-400 group-hover:border-primary group-hover:text-primary",
                                                currentQ.type === 'multiple_select' ? "rounded-md" : "rounded-full"
                                            )}>
                                                {isSelected && currentQ.type === 'multiple_select' ? <Check className="w-3.5 h-3.5" /> : (currentQ.type === 'multiple_select' ? "" : String.fromCharCode(65 + i))}
                                            </div>
                                            <span className={`text-sm font-semibold transition-colors duration-200 ${isSelected ? 'text-white' : 'text-slate-700'
                                                }`}>
                                                {opt}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        ) : currentQ.type === 'numeric_input' ? (
                            <div className="space-y-4">
                                <Label className="text-xs font-bold text-slate-400 uppercase ml-1">Ketik angka jawaban kamu:</Label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={answers[currentQ.id] || ''}
                                        onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                                        className="h-16 w-full max-w-[200px] rounded-2xl px-6 bg-slate-50 text-xl font-bold border-slate-200 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                    />
                                    {currentQ.options?.unit && <span className="text-xl font-bold text-slate-400">{currentQ.options.unit}</span>}
                                </div>
                            </div>
                        ) : currentQ.type === 'essay' ? (
                            <div className="space-y-4">
                                <Label className="text-xs font-bold text-slate-400 uppercase ml-1">Tulis jawaban kamu di sini:</Label>
                                <Textarea
                                    placeholder="Ketik jawaban esai kamu..."
                                    value={answers[currentQ.id] || ''}
                                    onChange={(e) => handleEssayChange(currentQ.id, e.target.value)}
                                    className="min-h-[200px] rounded-2xl p-6 bg-slate-50 text-slate-800 border-slate-200 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-inner"
                                />
                            </div>
                        ) : currentQ.type === 'ranking' ? (
                            <div className="space-y-4">
                                <Label className="text-xs font-bold text-slate-400 uppercase ml-1">Urutkan item di bawah ini (Gunakan panah):</Label>
                                <div className="space-y-3">
                                    {(answers[currentQ.id] || currentQ.options || []).map((opt, i) => (
                                        <div key={`${currentQ.id}-${i}-${opt}`} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-primary/30 transition-all group">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xs border border-slate-100 group-hover:bg-primary group-hover:text-white transition-colors">
                                                {i + 1}
                                            </div>
                                            <span className="flex-1 text-sm font-bold text-slate-700">{opt}</span>
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (i === 0) return
                                                        setAnswers(prev => {
                                                            const current = prev[currentQ.id] || [...currentQ.options]
                                                            const next = [...current];
                                                            [next[i], next[i - 1]] = [next[i - 1], next[i]]
                                                            return { ...prev, [currentQ.id]: next }
                                                        })
                                                    }}
                                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors disabled:opacity-20"
                                                    disabled={i === 0}
                                                >
                                                    <ArrowUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const curArr = answers[currentQ.id] || currentQ.options || []
                                                        if (i === curArr.length - 1) return
                                                        setAnswers(prev => {
                                                            const current = prev[currentQ.id] || [...currentQ.options]
                                                            const next = [...current];
                                                            [next[i], next[i + 1]] = [next[i + 1], next[i]]
                                                            return { ...prev, [currentQ.id]: next }
                                                        })
                                                    }}
                                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors disabled:opacity-20"
                                                    disabled={i === (answers[currentQ.id] || currentQ.options || []).length - 1}
                                                >
                                                    <ArrowDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : currentQ.type === 'matrix' ? (
                            <MatrixQuestion
                                question={currentQ}
                                value={answers[currentQ.id]}
                                onChange={(sIdx, val) => handleMatrixSelect(currentQ.id, sIdx, val)}
                            />
                        ) : currentQ.type === 'game_task' ? (
                            <GameTaskPlaceholder />
                        ) : (
                            <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center animate-pulse">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tipe soal "{currentQ.type}" segera hadir.</p>
                                <p className="text-xs text-slate-300 mt-2 font-medium">Mohon lewati soal ini untuk sekarang.</p>
                            </div>
                        )
                        }
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between gap-4 pt-12 mt-12 border-t border-slate-100 flex-col sm:flex-row">
                        <Button
                            variant="ghost"
                            disabled={currentIndex === 0}
                            onClick={() => setCurrentIndex(currentIndex - 1)}
                            className="h-12 px-6 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all w-full sm:w-auto"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" /> Sebelumnya
                        </Button>

                        {currentIndex < questions.length - 1 ? (
                            <Button
                                onClick={() => setCurrentIndex(currentIndex + 1)}
                                className="h-12 px-10 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg w-full sm:w-auto"
                            >
                                Selanjutnya <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={submitTest}
                                disabled={submitting}
                                className="h-12 px-12 rounded-xl font-black bg-primary text-white hover:bg-brand-600 transition-all shadow-xl shadow-primary/20 w-full sm:w-auto transform hover:scale-105"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Flag className="w-4 h-4 mr-2" />}
                                Selesaikan Tes
                            </Button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-shake font-bold">
                        <AlertTriangle className="w-5 h-5" /> {error}
                    </div>
                )}
            </div>

            {/* Right Column: Question Navigator (Desktop only) */}
            <div className="hidden lg:block w-72 shrink-0 space-y-4 sticky top-20">
                <div className="bg-white border border-border rounded-3xl p-6 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-100" />
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-1 flex items-center justify-between">
                        Navigasi Soal
                        <span className="text-[10px] bg-slate-50 py-0.5 px-2 rounded-full border border-slate-100 text-slate-500">
                            {Object.keys(answers).length} / {questions.length} dijawab
                        </span>
                    </h3>

                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`w-full aspect-square rounded-xl text-[10px] font-black border-2 transition-all transform active:scale-90 ${currentIndex === i
                                    ? 'bg-slate-900 border-slate-900 text-white z-10 scale-105 shadow-md'
                                    : (answers[questions[i].id]
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-slate-300'
                                    )
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                            <div className="w-3 h-3 rounded-md bg-primary/20 border border-primary shrink-0" /> Terjawab
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                            <div className="w-3 h-3 rounded-md bg-slate-50 border border-slate-100 shrink-0" /> Belum Terjawab
                        </div>
                    </div>
                </div>

                {/* Candidate Multi-Proctor Panel */}
                {test.proctoring_enabled && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-5 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -translate-y-12 translate-x-12" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Activity className="w-3 h-3 text-primary" /> Integrity Monitor
                        </h3>

                        {/* Camera Feed Preview */}
                        <div className="relative aspect-video bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden group">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" />
                            <canvas ref={canvasRef} className="hidden" />
                            {!cameraActive && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-500 bg-rose-500/10">
                                    <CameraOff className="w-8 h-8 mb-2" />
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-center px-4">Kamera Tidak Aktif</span>
                                </div>
                            )}
                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", cameraActive ? "bg-emerald-500" : "bg-rose-500")} />
                                <span className="text-[8px] font-bold uppercase tracking-widest">Live AI Monitoring</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-slate-400 capitalize flex items-center gap-1.5"><Monitor className="w-3 h-3" /> Multi-Screen</span>
                                <span className={cn(multiScreen ? "text-rose-500" : "text-emerald-500")}>
                                    {multiScreen ? "Terdeteksi" : "Layar Tunggal"}
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Sistem Log Real-time:</p>
                            <div className="space-y-2">
                                {personalLogs.length > 0 ? (
                                    personalLogs.map((log, i) => (
                                        <div key={i} className="text-[9px] flex gap-2 leading-relaxed animate-in slide-in-from-right-2">
                                            <span className="text-primary font-bold whitespace-nowrap opacity-60">[{log.time}]</span>
                                            <span className="text-slate-400 font-medium">{log.message}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[9px] text-slate-600 italic">Belum ada aktivitas tercatat...</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">Semua jawaban tersimpan sementara secara lokal. Klik "Selesaikan Tes" jika sudah yakin dengan semua jawaban.</p>
                </div>
            </div>

            {/* Mobile Navigator Placeholder (Bottom fixed on mobile) */}
            <div className="lg:hidden fixed bottom-6 left-0 right-0 px-4 z-50">
                <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center justify-between overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 pr-4">
                        {questions.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`w-8 h-8 rounded-lg text-[10px] font-bold shrink-0 border transition-all ${currentIndex === i ? 'bg-primary border-primary text-white scale-110 shadow-lg' : (answers[questions[i].id] ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-white/40')
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <div className="pl-4 border-l border-white/10">
                        <div className="text-[10px] font-bold text-white/50 text-right whitespace-nowrap">STATUS</div>
                        <div className="text-xs font-black text-white whitespace-nowrap">{Object.keys(answers).length} / {questions.length}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
