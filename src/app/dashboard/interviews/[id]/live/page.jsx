'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import JitsiMeeting from '@/components/interviews/JitsiMeeting'
import { createClient } from '@/lib/supabase/client'
import { 
    ChevronLeft, 
    Save, 
    Star, 
    Info, 
    MessageSquare,
    BrainCircuit,
    CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

export default function LiveInterviewPage() {
    const { id } = useParams()
    const router = useRouter()
    const [interview, setInterview] = useState(null)
    const [template, setTemplate] = useState(null)
    const [scores, setScores] = useState({})
    const [feedback, setFeedback] = useState('')
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function load() {
            const { data: iv } = await supabase
                .from('interviews')
                .select('*, applications(full_name, jobs(title))')
                .eq('id', id)
                .single()
            
            if (iv) {
                setInterview(iv)
                if (iv.template_id) {
                    const { data: tmpl } = await supabase
                        .from('interview_templates')
                        .select('*')
                        .eq('id', iv.template_id)
                        .single()
                    setTemplate(tmpl)
                    // Initialize scores
                    const initial = {}
                    tmpl.questions.forEach((q, idx) => initial[idx] = 3)
                    setScores(initial)
                }
            }
            setLoading(false)
        }
        load()
    }, [id])

    const handleSaveFeedback = async () => {
        // In a real app, you'd save scores and feedback to the interview record
        // along with the transcript or AI analysis
        const avgScore = Object.values(scores).length > 0 
            ? (Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length).toFixed(1)
            : 0

        const { error } = await supabase
            .from('interviews')
            .update({
                internal_notes: feedback,
                ai_review_result: `Average Score: ${avgScore}. Feedback: ${feedback}`,
                status: 'completed'
            })
            .eq('id', id)

        if (!error) {
            router.push(`/dashboard/candidates/${interview.application_id}`)
        }
    }

    if (loading) return <div className="h-screen flex items-center justify-center">Loading Interview Session...</div>
    if (!interview) return <div className="h-screen flex items-center justify-center">Session not found</div>

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col sm:flex-row overflow-hidden">
            
            {/* Left: Jitsi View (65%) */}
            <div className="flex-1 p-4 sm:p-8 flex flex-col gap-6 h-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/candidates/${interview.application_id}`}>
                            <Button variant="ghost" size="icon" className="rounded-xl"><ChevronLeft className="w-5 h-5" /></Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 leading-none">Live Interview: {interview.applications?.full_name}</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{interview.applications?.jobs?.title}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative">
                    <JitsiMeeting 
                        roomName={interview.jitsi_room_id || `interview-${id}`}
                        displayName="Interviewer (HR)"
                    />
                </div>
            </div>

            {/* Right: Template & Notes (35%) */}
            <div className="w-full sm:w-[450px] bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl overflow-hidden relative">
                <div className="p-8 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <BrainCircuit className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Evaluasi Terstandar</h2>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{template?.title || 'No Template Selected'}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Questions from Template */}
                    {template?.questions?.map((q, idx) => (
                        <div key={idx} className="space-y-4 group">
                            <div className="flex justify-between gap-4">
                                <label className="text-sm font-bold text-slate-700 leading-relaxed italic pr-2 border-l-2 border-slate-200 pl-4">
                                    &quot;{q.question}&quot;
                                </label>
                            </div>
                            
                            <div className="flex items-center gap-1.5 ml-4">
                                {[1,2,3,4,5].map(star => (
                                    <button 
                                        key={star}
                                        onClick={() => setScores({...scores, [idx]: star})}
                                        className={`transition-all ${star <= (scores[idx] || 0) ? 'text-amber-400' : 'text-slate-100 hover:text-slate-200'}`}
                                    >
                                        <Star className={`w-6 h-6 ${star <= (scores[idx] || 0) ? 'fill-current' : ''}`} />
                                    </button>
                                ))}
                                <span className="text-[10px] font-black text-slate-300 ml-2 uppercase tracking-widest">{scores[idx]}/5</span>
                            </div>
                        </div>
                    ))}

                    <div className="pt-8 border-t border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                            <MessageSquare className="w-3.5 h-3.5" /> Catatan Interviewer
                        </div>
                        <Textarea 
                            placeholder="Tuliskan feedback Anda di sini..."
                            className="min-h-[150px] rounded-3xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-sm font-medium resize-none p-5"
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-8 bg-slate-950 shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
                    <Button 
                        onClick={handleSaveFeedback}
                        className="w-full h-14 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black text-base shadow-xl group"
                    >
                        <CheckCircle2 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> Selesaikan & Simpan Hasil
                    </Button>
                    <p className="text-[9px] text-slate-500 font-bold text-center mt-4 uppercase tracking-[0.15em]">Laporan akan dikompilasi ke Unified Profile</p>
                </div>
            </div>
        </div>
    )
}
