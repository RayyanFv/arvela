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
                console.error(err)
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
                <div className="h-14 bg-slate-950/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 shrink-0 absolute top-0 left-0 right-0 z-10 transition-all">
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
                             <span className="text-xs font-black text-white uppercase tracking-widest">Live Now</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="text-right">
                             <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Interviewing</h2>
                             <p className="text-sm font-bold text-white uppercase">{interview?.applications?.full_name || 'Candidate'}</p>
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
                             <div className="bg-white/5 border border-white/10 rounded-[48px] p-12 text-center space-y-8 backdrop-blur-2xl">
                                 <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                     <User className="w-10 h-10 text-primary" />
                                 </div>
                                 <div className="space-y-4">
                                     <h2 className="text-3xl font-black text-white tracking-tight">{interview?.applications?.full_name}</h2>
                                     <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-slate-400">
                                         <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                             <Briefcase className="w-4 h-4 text-slate-500" /> {interview?.applications?.jobs?.title}
                                         </div>
                                         <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                             <Calendar className="w-4 h-4 text-slate-500" /> {interview?.scheduled_date ? new Date(interview.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) : '-'}
                                         </div>
                                     </div>
                                 </div>

                                 <div className="pt-8 border-t border-white/5 max-w-sm mx-auto">
                                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Sesi Non-Internal Video</p>
                                     <div className="bg-slate-950/50 rounded-3xl p-6 border border-white/5 space-y-4">
                                         {interview.location_link ? (
                                             <div className="space-y-3">
                                                 <div className="flex items-center gap-3 text-emerald-400 text-xs font-black uppercase">
                                                     {interview.location_link.startsWith('http') ? <><ExternalLink className="w-4 h-4" /> Link External</> : <><MapPin className="w-4 h-4" /> Lokasi Offline</>}
                                                 </div>
                                                 <p className="text-sm font-bold text-white leading-relaxed break-all">
                                                     {interview.location_link}
                                                 </p>
                                                 {interview.location_link.startsWith('http') && (
                                                     <Button asChild size="sm" className="w-full mt-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 font-bold">
                                                         <a href={interview.location_link} target="_blank" rel="noopener noreferrer">Buka Meeting Link</a>
                                                     </Button>
                                                 )}
                                             </div>
                                         ) : (
                                             <p className="text-xs font-bold text-slate-400 italic">No link/location specified</p>
                                         )}
                                     </div>
                                 </div>

                                 <div className="pt-6">
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
                 "bg-white border-l border-slate-200 flex flex-col transition-all duration-300 shadow-2xl z-20 overflow-hidden",
                 sidebarCollapsed ? "w-0 opacity-0" : "w-[500px] opacity-100"
             )}>
                <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-slate-50/50">
                    <div className="flex gap-1 h-full">
                        <button 
                            onClick={() => setActiveTab('questions')}
                            className={cn(
                                "h-full px-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative",
                                activeTab === 'questions' ? "text-primary bg-white border-x border-slate-100" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <MessageSquare className="w-4 h-4" />
                            Wawancara
                            {activeTab === 'questions' && <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />}
                        </button>
                        <button 
                            onClick={() => setActiveTab('scorecard')}
                            className={cn(
                                "h-full px-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative",
                                activeTab === 'scorecard' ? "text-amber-600 bg-white border-x border-slate-100" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Star className="w-4 h-4" />
                            Scorecard
                            {activeTab === 'scorecard' && <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />}
                        </button>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setSidebarCollapsed(true)}
                        className="rounded-full hover:bg-slate-100"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {activeTab === 'questions' ? (
                        <>
                            {/* Header Info */}
                            <div className="bg-primary/5 rounded-3xl p-5 border border-primary/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-12 -mt-12" />
                                <div className="relative space-y-4">
                                    <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                        <Info className="w-3.5 h-3.5" /> Panduan Wawancara
                                    </h4>
                                    <p className="text-sm font-bold text-slate-700 leading-snug">
                                        {interview.interview_templates?.title || 'General Interview'}
                                    </p>
                                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/50 text-[11px] text-slate-500 leading-relaxed font-medium flex items-start gap-2">
                                        <div className="flex-1">
                                            Gunakan template di bawah ini untuk mencatat jawaban kandidat secara real-time.
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={handleResetTemplate}
                                            className="h-7 px-2 text-[9px] font-black uppercase tracking-tighter hover:bg-white text-primary"
                                        >
                                            <RotateCcw className="w-3 h-3 mr-1" /> Tarik Ulang
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Questions List */}
                            <div className="space-y-6">
                                {questions.map((q, idx) => (
                                    <div key={q.id} className={cn(
                                        "space-y-3 group",
                                        q.is_incidental ? "pl-4 border-l-2 border-amber-400" : "pl-4 border-l-2 border-slate-200"
                                    )}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    Pertanyaan {idx + 1} {q.is_incidental && "• SPONTAN"}
                                                </span>
                                                <p className="text-sm font-bold text-slate-800 leading-tight">{q.text}</p>
                                            </div>
                                        </div>
                                        <Textarea 
                                            placeholder="Input jawaban kandidat..."
                                            value={q.answer}
                                            onChange={(e) => handleUpdateAnswer(q.id, e.target.value)}
                                            className="min-h-[100px] rounded-2xl bg-slate-50 border-slate-100 text-sm focus:bg-white transition-all shadow-inner focus:ring-4 focus:ring-primary/10"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Incidental Adder */}
                            <div className="pt-6 border-t border-slate-100">
                                <div className="bg-slate-50 rounded-[32px] p-2 flex gap-2 border border-slate-100 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                                    <Input 
                                        placeholder="Tambahkan pertanyaan baru..."
                                        value={newQuestion}
                                        onChange={(e) => setNewQuestion(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                                        className="border-none bg-transparent shadow-none h-11 text-xs font-bold"
                                    />
                                    <Button 
                                        onClick={handleAddQuestion}
                                        disabled={!newQuestion.trim()}
                                        className="h-11 w-11 rounded-full p-0 shrink-0 shadow-lg"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                             {/* Scorecard Tab */}
                             <div className="space-y-6">
                                 <div className="flex items-center justify-between">
                                     <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Kriteria Penilaian</h4>
                                     <div className="text-right">
                                         <p className="text-lg font-black text-primary leading-none">
                                             {Object.values(scorecard?.scores || {}).reduce((a, b) => a + b, 0).toFixed(1)}
                                             <span className="text-[10px] text-slate-400">/{(scorecard?.criteria?.length || 0) * 5}</span>
                                         </p>
                                     </div>
                                 </div>
                                 
                                 <div className="space-y-8">
                                     {scorecard.criteria?.map(c => (
                                         <div key={c.key} className="space-y-4">
                                             <div>
                                                 <p className="text-sm font-black text-slate-800 mb-0.5">{c.label}</p>
                                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{c.desc}</p>
                                             </div>
                                             <div className="flex gap-2">
                                                 {[1, 2, 3, 4, 5].map(n => (
                                                     <button 
                                                        key={n}
                                                        onClick={() => handleUpdateScore(c.key, n)}
                                                        className={cn(
                                                            "flex-1 h-10 rounded-xl border-2 font-black text-sm transition-all",
                                                            scorecard.scores[c.key] === n 
                                                                ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20" 
                                                                : "bg-slate-50 border-slate-100 text-slate-300 hover:border-amber-200"
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

                             <div className="pt-10 border-t border-slate-100 space-y-4">
                                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Rekomendasi Akhir</h4>
                                 <div className="grid grid-cols-2 gap-3">
                                     {['Strong Yes', 'Yes', 'Maybe', 'No'].map(rec => (
                                         <button
                                            key={rec}
                                            onClick={() => handleUpdateRecommendation(rec)}
                                            className={cn(
                                                "h-12 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all",
                                                scorecard.recommendation === rec
                                                    ? "bg-slate-900 border-slate-900 text-white shadow-xl"
                                                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
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
                    <div className="pt-10 border-t border-slate-100 space-y-4">
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <History className="w-3.5 h-3.5" /> Kesimpulan & Rekomendasi
                         </h3>
                         <Textarea 
                            placeholder="Tulis kesimpulan hasil wawancara di sini..."
                            value={finalNotes}
                            onChange={(e) => setFinalNotes(e.target.value)}
                            className="min-h-[150px] rounded-3xl bg-slate-50 border-slate-100 text-sm italic font-medium"
                         />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="h-24 px-6 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Save className="w-3 h-3" /> Auto-saved
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold">Semua catatan tersimpan otomatis ke cloud.</p>
                    </div>
                    <Button 
                        onClick={handleComplete}
                        disabled={saving}
                        className="h-12 px-8 rounded-2xl font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
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
                    className="fixed right-6 bottom-6 w-14 h-14 bg-white border border-slate-200 rounded-2xl shadow-2xl flex items-center justify-center text-primary z-30 hover:scale-110 active:scale-90 transition-all animate-bounce"
                 >
                    <Sidebar className="w-6 h-6" />
                 </button>
             )}
        </div>
    )
}
