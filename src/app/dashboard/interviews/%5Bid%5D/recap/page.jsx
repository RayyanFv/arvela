import { getInterviewSession } from '@/lib/actions/interviews'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
    ArrowLeft, 
    Calendar, 
    Clock, 
    User, 
    Briefcase, 
    MessageSquare, 
    FileText,
    CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

export default async function InterviewRecapPage({ params }) {
    const { id } = await params
    let interview = null
    
    try {
        interview = await getInterviewSession(id)
    } catch (err) {
        return (
            <div className="p-8 text-center text-rose-500">
                Error: {err.message}
            </div>
        )
    }

    const questions = interview?.session_questions || []

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard/interviews">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-50">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-widest border border-emerald-100">Interview Completed</span>
                        </div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Rekap Hasil Wawancara</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href={`/dashboard/interviews/${id}/scorecard`}>
                        <Button variant="outline" className="rounded-2xl font-bold border-slate-200">
                            Lihat Scorecard
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Info & Questions */}
                <div className="lg:col-span-8 space-y-8">
                    <Card className="rounded-[32px] border-slate-200 shadow-sm overflow-hidden ring-1 ring-slate-100">
                        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100">
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                     <User className="w-6 h-6 text-slate-400" />
                                 </div>
                                 <div className="flex-1">
                                     <h2 className="text-lg font-black text-slate-800 leading-none mb-1">{interview.applications.full_name}</h2>
                                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                         <Briefcase className="w-3 h-3 text-primary" /> {interview.applications.jobs.title}
                                     </p>
                                 </div>
                             </div>
                        </div>
                        <div className="p-8 grid grid-cols-4 gap-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                                <p className="text-sm font-bold text-slate-700">{interview.scheduled_date}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Waktu</p>
                                <p className="text-sm font-bold text-slate-700">{interview.scheduled_time}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Format</p>
                                <p className="text-sm font-bold text-slate-700 uppercase">{interview.format}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Template</p>
                                <p className="text-sm font-bold text-slate-700">{interview.interview_templates?.title || 'None'}</p>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-8 h-px bg-slate-200" /> Transcript Pertanyaan ({questions.length})
                        </h3>
                        
                        <div className="space-y-4">
                            {questions.map((q, idx) => (
                                <div key={q.id} className="bg-white border border-slate-200 rounded-[28px] p-8 space-y-4 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-[10px] font-black text-primary">{idx + 1}</span>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <p className="text-sm font-black text-slate-900 leading-snug">{q.text}</p>
                                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                                <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap italic">
                                                    {q.answer || '— No answer recorded —'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <Card className="rounded-[32px] p-8 border-slate-200 bg-slate-900 text-white space-y-6 shadow-xl">
                        <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">HR Final Notes</h3>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed whitespace-pre-wrap italic">
                            {interview.notes || 'No final notes provided.'}
                        </p>
                        <Link href={`/dashboard/candidates/${interview.application_id}`}>
                            <Button className="w-full rounded-2xl font-black bg-primary hover:bg-brand-600">Buka Profil Kandidat</Button>
                        </Link>
                    </Card>
                </div>
            </div>
        </div>
    )
}
