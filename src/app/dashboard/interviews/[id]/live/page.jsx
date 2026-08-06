'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import JitsiMeeting from '@/components/interviews/JitsiMeeting'
import { createClient } from '@/lib/supabase/client'
import {
    ChevronLeft,
    Star,
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

            {/* Left: Jitsi View */}
            <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4 h-full">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/candidates/${interview.application_id}`}>
                        <Button variant="ghost" size="icon" className="rounded-md"><ChevronLeft className="w-5 h-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 leading-none">Live Interview: {interview.applications?.full_name}</h1>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-1">{interview.applications?.jobs?.title}</p>
                    </div>
                </div>

                <div className="flex-1 relative">
                    <JitsiMeeting
                        roomName={interview.jitsi_room_id || `interview-${id}`}
                        displayName="Interviewer (HR)"
                    />
                </div>
            </div>

            {/* Right: Template & Notes */}
            <div className="w-full sm:w-[420px] bg-white border-l border-slate-200 h-full flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3 mb-1.5">
                        <div className="p-2 bg-brand-50 rounded-md">
                            <BrainCircuit className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Evaluasi Terstandar</h2>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide italic">{template?.title || 'No Template Selected'}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Questions from Template */}
                    {template?.questions?.map((q, idx) => (
                        <div key={idx} className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700 leading-relaxed italic block border-l-2 border-slate-200 pl-4">
                                &quot;{q.question}&quot;
                            </label>

                            <div className="flex items-center gap-1.5 pl-4">
                                {[1,2,3,4,5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setScores({...scores, [idx]: star})}
                                        className={`transition-colors ${star <= (scores[idx] || 0) ? 'text-amber-400' : 'text-slate-200 hover:text-slate-300'}`}
                                    >
                                        <Star className={`w-5 h-5 ${star <= (scores[idx] || 0) ? 'fill-current' : ''}`} />
                                    </button>
                                ))}
                                <span className="text-[10px] font-semibold text-slate-400 ml-2 uppercase tracking-wide">{scores[idx]}/5</span>
                            </div>
                        </div>
                    ))}

                    <div className="pt-6 border-t border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                            <MessageSquare className="w-3.5 h-3.5" /> Catatan Interviewer
                        </div>
                        <Textarea
                            placeholder="Tuliskan feedback Anda di sini..."
                            className="min-h-[130px] rounded-md border-slate-200 bg-slate-50 focus:bg-white transition-colors text-sm font-medium resize-none"
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-900 shrink-0">
                    <Button
                        onClick={handleSaveFeedback}
                        className="w-full h-11 rounded-md bg-white text-slate-900 hover:bg-slate-100 font-semibold gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Selesaikan & Simpan Hasil
                    </Button>
                    <p className="text-[9px] text-slate-500 font-medium text-center mt-3 uppercase tracking-wide">Laporan akan dikompilasi ke Unified Profile</p>
                </div>
            </div>
        </div>
    )
}
