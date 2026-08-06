'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { JitsiMeeting } from '@jitsi/react-sdk'
import { updateInterviewSession, completeInterview, startInterviewSession, resetInterviewSession } from '@/lib/actions/interviews'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Video,
    MessageSquare,
    Save,
    CheckCircle,
    Plus,
    X,
    Loader2,
    ArrowLeft,
    Monitor,
    ShieldCheck,
    Mic,
    MicOff,
    VideoOff,
    History,
    Star,
    Layout,
    CheckCircle2,
    Activity,
    RotateCcw,
    ExternalLink,
    MapPin,
    Calendar,
    Briefcase,
    Info,
    User,
    Sidebar
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function InterviewSessionInterface({ interview: initialInterview, hrProfile }) {
    const router = useRouter()
    const [interview, setInterview] = useState(initialInterview)
    const [questions, setQuestions] = useState(initialInterview.session_questions || [])
    const [newQuestion, setNewQuestion] = useState('')
    const [finalNotes, setFinalNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [activeTab, setActiveTab] = useState('questions') // 'questions' | 'scorecard'
    const [scorecard, setScorecard] = useState(initialInterview.session_scorecard || { scores: {}, recommendation: '', criteria: [] })
    
    const jitsiApiRef = useRef(null)

    // 1. Load Session on mount (initializes questions if needed)
    useEffect(() => {
        async function initSession() {
            setLoading(true)
            try {
                const updated = await startInterviewSession(initialInterview.id)
                setInterview(updated)
                setQuestions(updated.session_questions || [])
                setScorecard(updated.session_scorecard || { scores: {}, recommendation: '', criteria: [] })
            } catch (err) {

            } finally {
                setLoading(false)
            }
        }
        initSession()
    }, [initialInterview.id])

    const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";
    const companyId = hrProfile?.companies?.slug || 'arvela';
    const roomName = `arvela-${interview.jitsi_room_id || interview.id}`;

    // 3. Methods
    async function handleAddQuestion() {
        if (!newQuestion.trim()) return
        const updated = [...questions, {
            id: crypto.randomUUID(),
            text: newQuestion,
            answer: '',
            is_incidental: true
        }]
        setQuestions(updated)
        setNewQuestion('')
        await updateInterviewSession(interview.id, updated)
    }

    async function handleUpdateAnswer(id, answer) {
        const updated = questions.map(q => q.id === id ? { ...q, answer } : q)
        setQuestions(updated)
        await updateInterviewSession(interview.id, updated, scorecard)
    }

    async function handleUpdateScore(key, val) {
        const nextScorecard = { ...scorecard, scores: { ...scorecard.scores, [key]: val } }
        setScorecard(nextScorecard)
        await updateInterviewSession(interview.id, questions, nextScorecard)
    }

    async function handleUpdateRecommendation(rec) {
        const nextScorecard = { ...scorecard, recommendation: rec }
        setScorecard(nextScorecard)
        await updateInterviewSession(interview.id, questions, nextScorecard)
    }

    async function handleResetTemplate() {
        if (!confirm('Hapus semua jawaban saat ini dan tarik ulang pertanyaan dari template?')) return
        setLoading(true)
        try {
            const updated = await resetInterviewSession(interview.id)
            setInterview(updated)
            setQuestions(updated.session_questions || [])
            setScorecard(updated.session_scorecard || { scores: {}, recommendation: '', criteria: [] })
            alert('Template berhasil disinkronkan!')
        } catch (err) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleComplete() {
        if (!confirm('Akhiri sesi interview ini? Semua catatan akan disimpan.')) return
        setSaving(true)
        try {
            await completeInterview(interview.id, finalNotes)
            router.push(`/dashboard/candidates/${interview.application_id}`)
        } catch (err) {
            alert(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    }

    return (
        <div className="flex-1 flex overflow-hidden">
             {/* Main: Video Area */}
             <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative">
                {/* Header */}
                <div className="h-14 bg-slate-950 border-b border-white/5 flex items-center justify-between px-6 shrink-0 absolute top-0 left-0 right-0 z-10">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="text-slate-400 hover:text-white px-0 h-auto"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Keluar
                        </Button>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                             <span className="text-xs font-semibold text-white uppercase tracking-wide">Live Now</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="text-right">
                             <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide leading-none mb-1">Interviewing</h2>
                             <p className="text-sm font-semibold text-white">{interview?.applications?.full_name || 'Candidate'}</p>
                         </div>
                    </div>
                </div>

                {/* Video / Info Container */}
                <div className="flex-1 mt-14 overflow-hidden relative flex flex-col items-center justify-center p-6">
                    {interview.jitsi_room_id ? (
                        <JitsiMeeting
                            domain={domain}
                            roomName={roomName}
                            configOverwrite={{
                                disableDeepLinking: true,
                                prejoinPageEnabled: false,
                                enableWelcomePage: false,
                                startWithAudioMuted: true,
                                doNotStoreRoom: true,
                            }}
                            interfaceConfigOverwrite={{
                                TOOLBAR_BUTTONS: [
                                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                                    'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                                    'security'
                                ],
                            }}
                            userInfo={{
                                displayName: hrProfile?.full_name || "HR Admin",
                                email: hrProfile?.email
                            }}
                            onApiReady={(externalApi) => {
                                jitsiApiRef.current = externalApi;
                            }}
                            getIFrameRef={(iframeRef) => {
                                iframeRef.style.height = '100%';
                                iframeRef.style.width = '100%';
                            }}
                        />
                    ) : (
                        <div className="max-w-2xl w-full">
                             <div className="bg-white/5 border border-white/10 rounded-md p-10 text-center space-y-6">
                                 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                     <User className="w-8 h-8 text-primary" />
                                 </div>
                                 <div className="space-y-3">
                                     <h2 className="text-2xl font-bold text-white tracking-tight">{interview?.applications?.full_name}</h2>
                                     <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-slate-400">
                                         <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-md border border-white/5">
                                             <Briefcase className="w-4 h-4 text-slate-500" /> {interview?.applications?.jobs?.title}
                                         </div>
                                         <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-md border border-white/5">
                                             <Calendar className="w-4 h-4 text-slate-500" /> {interview?.scheduled_date ? new Date(interview.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) : '-'}
                                         </div>
                                     </div>
                                 </div>

                                 <div className="pt-6 border-t border-white/5 max-w-sm mx-auto">
                                     <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Sesi Non-Internal Video</p>
                                     <div className="bg-slate-950/50 rounded-md p-5 border border-white/5 space-y-3">
                                         {interview.location_link ? (
                                             <div className="space-y-3">
                                                 <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase">
                                                     {interview.location_link.startsWith('http') ? <><ExternalLink className="w-4 h-4" /> Link External</> : <><MapPin className="w-4 h-4" /> Lokasi Offline</>}
                                                 </div>
                                                 <p className="text-sm font-medium text-white leading-relaxed break-all">
                                                     {interview.location_link}
                                                 </p>
                                                 {interview.location_link.startsWith('http') && (
                                                     <Button asChild size="sm" className="w-full mt-2 rounded-md bg-white text-slate-950 hover:bg-slate-200 font-semibold">
                                                         <a href={interview.location_link} target="_blank" rel="noopener noreferrer">Buka Meeting Link</a>
                                                     </Button>
                                                 )}
                                             </div>
                                         ) : (
                                             <p className="text-xs font-medium text-slate-400 italic">No link/location specified</p>
                                         )}
                                     </div>
                                 </div>

                                 <div className="pt-4">
                                     <p className="text-[11px] text-slate-500 font-medium max-w-xs mx-auto">
                                         Catat hasil wawancara di panel sebelah kanan secara real-time.
                                     </p>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
             </div>

             {/* Right: Interactive Form Panel */}
             <div className={cn(
                 "bg-white border-l border-slate-200 flex flex-col transition-all duration-300 z-20 overflow-hidden",
                 sidebarCollapsed ? "w-0 opacity-0" : "w-[500px] opacity-100"
             )}>
                <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 shrink-0 bg-slate-50">
                    <div className="flex gap-1 h-full">
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={cn(
                                "h-full px-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide transition-colors relative",
                                activeTab === 'questions' ? "text-primary bg-white border-x border-slate-200" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <MessageSquare className="w-4 h-4" />
                            Wawancara
                            {activeTab === 'questions' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('scorecard')}
                            className={cn(
                                "h-full px-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide transition-colors relative",
                                activeTab === 'scorecard' ? "text-amber-600 bg-white border-x border-slate-200" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Star className="w-4 h-4" />
                            Scorecard
                            {activeTab === 'scorecard' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />}
                        </button>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarCollapsed(true)}
                        className="rounded-md hover:bg-slate-100"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {activeTab === 'questions' ? (
                        <>
                            {/* Header Info */}
                            <div className="bg-brand-50 rounded-md p-4 border border-primary/10 space-y-3">
                                <h4 className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-2">
                                    <Info className="w-3.5 h-3.5" /> Panduan Wawancara
                                </h4>
                                <p className="text-sm font-semibold text-slate-700 leading-snug">
                                    {interview.interview_templates?.title || 'General Interview'}
                                </p>
                                <div className="bg-white rounded-md p-3 border border-slate-100 text-[11px] text-slate-500 leading-relaxed font-medium flex items-start gap-2">
                                    <div className="flex-1">
                                        Gunakan template di bawah ini untuk mencatat jawaban kandidat secara real-time.
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResetTemplate}
                                        className="h-7 px-2 text-[9px] font-semibold uppercase hover:bg-slate-50 text-primary rounded-md"
                                    >
                                        <RotateCcw className="w-3 h-3 mr-1" /> Tarik Ulang
                                    </Button>
                                </div>
                            </div>

                            {/* Questions List */}
                            <div className="space-y-5">
                                {questions.map((q, idx) => (
                                    <div key={q.id} className={cn(
                                        "space-y-2 group",
                                        q.is_incidental ? "pl-4 border-l-2 border-amber-400" : "pl-4 border-l-2 border-slate-200"
                                    )}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
                                                    Pertanyaan {idx + 1} {q.is_incidental && "• SPONTAN"}
                                                </span>
                                                <p className="text-sm font-semibold text-slate-800 leading-tight">{q.text}</p>
                                            </div>
                                        </div>
                                        <Textarea
                                            placeholder="Input jawaban kandidat..."
                                            value={q.answer}
                                            onChange={(e) => handleUpdateAnswer(q.id, e.target.value)}
                                            className="min-h-[100px] rounded-md bg-slate-50 border-slate-200 text-sm focus:bg-white transition-colors"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Incidental Adder */}
                            <div className="pt-4 border-t border-slate-100">
                                <div className="bg-slate-50 rounded-md p-2 flex gap-2 border border-slate-200 focus-within:border-primary/40 transition-colors">
                                    <Input
                                        placeholder="Tambahkan pertanyaan baru..."
                                        value={newQuestion}
                                        onChange={(e) => setNewQuestion(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                                        className="border-none bg-transparent shadow-none h-10 text-xs font-semibold"
                                    />
                                    <Button
                                        onClick={handleAddQuestion}
                                        disabled={!newQuestion.trim()}
                                        className="h-10 w-10 rounded-md p-0 shrink-0"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-8">
                             {/* Scorecard Tab */}
                             <div className="space-y-5">
                                 <div className="flex items-center justify-between">
                                     <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Kriteria Penilaian</h4>
                                     <div className="text-right">
                                         <p className="text-lg font-bold text-primary leading-none">
                                             {Object.values(scorecard?.scores || {}).reduce((a, b) => a + b, 0).toFixed(1)}
                                             <span className="text-[10px] text-slate-400">/{(scorecard?.criteria?.length || 0) * 5}</span>
                                         </p>
                                     </div>
                                 </div>

                                 <div className="space-y-6">
                                     {scorecard.criteria?.map(c => (
                                         <div key={c.key} className="space-y-3">
                                             <div>
                                                 <p className="text-sm font-semibold text-slate-800 mb-0.5">{c.label}</p>
                                                 <p className="text-[10px] font-medium text-slate-400">{c.desc}</p>
                                             </div>
                                             <div className="flex gap-2">
                                                 {[1, 2, 3, 4, 5].map(n => (
                                                     <button
                                                        key={n}
                                                        onClick={() => handleUpdateScore(c.key, n)}
                                                        className={cn(
                                                            "flex-1 h-9 rounded-md border font-semibold text-sm transition-colors",
                                                            scorecard.scores[c.key] === n
                                                                ? "bg-amber-500 border-amber-500 text-white"
                                                                : "bg-slate-50 border-slate-200 text-slate-400 hover:border-amber-300"
                                                        )}
                                                     >
                                                         {n}
                                                     </button>
                                                 ))}
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>

                             <div className="pt-6 border-t border-slate-100 space-y-3">
                                 <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Rekomendasi Akhir</h4>
                                 <div className="grid grid-cols-2 gap-2">
                                     {['Strong Yes', 'Yes', 'Maybe', 'No'].map(rec => (
                                         <button
                                            key={rec}
                                            onClick={() => handleUpdateRecommendation(rec)}
                                            className={cn(
                                                "h-10 rounded-md border font-semibold text-xs uppercase tracking-wide transition-colors",
                                                scorecard.recommendation === rec
                                                    ? "bg-slate-900 border-slate-900 text-white"
                                                    : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                                            )}
                                         >
                                             {rec}
                                         </button>
                                     ))}
                                 </div>
                             </div>
                        </div>
                    )}

                    {/* Final Notes (Global) */}
                    <div className="pt-6 border-t border-slate-100 space-y-3">
                         <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                            <History className="w-3.5 h-3.5" /> Kesimpulan & Rekomendasi
                         </h3>
                         <Textarea
                            placeholder="Tulis kesimpulan hasil wawancara di sini..."
                            value={finalNotes}
                            onChange={(e) => setFinalNotes(e.target.value)}
                            className="min-h-[130px] rounded-md bg-slate-50 border-slate-200 text-sm italic font-medium"
                         />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="h-20 px-6 border-t border-slate-200 flex items-center justify-between bg-white shrink-0">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1.5">
                            <Save className="w-3 h-3" /> Auto-saved
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium">Semua catatan tersimpan otomatis ke cloud.</p>
                    </div>
                    <Button
                        onClick={handleComplete}
                        disabled={saving}
                        className="h-10 px-6 rounded-md font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Selesaikan Interview
                    </Button>
                </div>
             </div>

             {/* Sidebar Toggle for Mobile/Tablet */}
             {sidebarCollapsed && (
                 <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="fixed right-6 bottom-6 w-12 h-12 bg-white border border-slate-200 rounded-md shadow-md flex items-center justify-center text-primary z-30 hover:bg-slate-50 transition-colors"
                 >
                    <Sidebar className="w-5 h-5" />
                 </button>
             )}
        </div>
    )
}
