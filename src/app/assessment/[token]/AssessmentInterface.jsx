'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
    ShieldCheck
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MatrixQuestion } from '@/components/assessment/MatrixQuestion'
import { GameTaskPlaceholder } from '@/components/assessment/GameTaskPlaceholder'
import { logProctoringEvent } from '@/lib/actions/assessments'

export default function AssessmentInterface({ assignment, test, questions, candidateName }) {
    const router = useRouter()
    const [started, setStarted] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState({})
    const [timeLeft, setTimeLeft] = useState(test.duration_minutes * 60)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const timerRef = useRef(null)

    // Clear interval on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    function startTest() {
        setStarted(true)
        
        // Log start event
        logProctoringEvent({
            assignment_id: assignment.id,
            event_type: 'test_started',
            details: 'Kandidat memulai pengerjaan tes.'
        })

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

    // FEAT: Proctoring Tracker
    useEffect(() => {
        if (!started || submitting) return

        const handleBlur = () => {
            logProctoringEvent({
                assignment_id: assignment.id,
                event_type: 'tab_switch_blur',
                details: 'Dideteksi berpindah tab atau meninggalkan jendela browser.'
            })
        }

        const handleFocus = () => {
            logProctoringEvent({
                assignment_id: assignment.id,
                event_type: 'tab_switch_focus',
                details: 'Kandidat kembali ke jendela tes.'
            })
        }

        const handleCopy = (e) => {
            logProctoringEvent({
                assignment_id: assignment.id,
                event_type: 'copy_attempt',
                details: 'Mencoba menyalin teks (Copy).'
            })
        }

        const handlePaste = (e) => {
            logProctoringEvent({
                assignment_id: assignment.id,
                event_type: 'paste_attempt',
                details: 'Mencoba menempel teks (Paste).'
            })
        }

        const handleContextMenu = (e) => {
            e.preventDefault()
            logProctoringEvent({
                assignment_id: assignment.id,
                event_type: 'right_click',
                details: 'Mencoba klik kanan menu konteks.'
            })
        }

        window.addEventListener('blur', handleBlur)
        window.addEventListener('focus', handleFocus)
        document.addEventListener('copy', handleCopy)
        document.addEventListener('paste', handlePaste)
        document.addEventListener('contextmenu', handleContextMenu)

        return () => {
            window.removeEventListener('blur', handleBlur)
            window.removeEventListener('focus', handleFocus)
            document.removeEventListener('copy', handleCopy)
            document.removeEventListener('paste', handlePaste)
            document.removeEventListener('contextmenu', handleContextMenu)
        }
    }, [started, submitting, assignment.id])

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
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

                <div className="space-y-4 mb-10 border-t border-slate-100 pt-8">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Instruksi Penting:
                    </h3>
                    <ul className="text-sm text-slate-500 space-y-3 pl-2">
                        <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-1.5 shrink-0" /> Waktu tes akan dimulai secara otomatis saat kamu klik tombol di bawah.</li>
                        <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-1.5 shrink-0" /> Jangan menutup tab browser ini atau me-refresh halaman selama tes berlangsung.</li>
                        <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-1.5 shrink-0" /> Jawaban akan terkirim otomatis jika waktu habis.</li>
                    </ul>
                </div>

                <Button
                    onClick={startTest}
                    className="w-full h-14 rounded-2xl font-black text-lg bg-slate-950 text-white hover:bg-slate-900 shadow-xl shadow-slate-300 transform active:scale-95 transition-all group"
                >
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
        <div className="max-w-4xl w-full flex flex-col lg:flex-row gap-8 items-start relative pb-20">
            {/* Left Column: Question Side */}
            <div className="flex-1 w-full space-y-6">

                {/* Progress bar and Timer */}
                <div className="bg-white border border-border rounded-3xl p-6 shadow-sm flex items-center justify-between sticky top-20 z-40">
                    <div className="flex-1 pr-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kemajuan: {currentIndex + 1} / {questions.length}</span>
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
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-bold transition-all ${isSelected
                                                ? 'bg-white border-white text-primary'
                                                : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-primary group-hover:text-primary'
                                                } ${currentQ.type === 'multiple_select' ? 'rounded-md' : 'rounded-full'}`}>
                                                {String.fromCharCode(65 + i)}
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
