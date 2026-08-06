import { getInterviewSession } from '@/lib/actions/interviews'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    ArrowLeft,
    User,
    Briefcase,
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
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-5 rounded-md border border-slate-200">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/interviews">
                        <Button variant="ghost" size="icon" className="rounded-md hover:bg-slate-50">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Button>
                    </Link>
                    <div>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wide border border-emerald-200">Interview Completed</span>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight mt-1">Rekap Hasil Wawancara</h1>
                    </div>
                </div>
                <Link href={`/dashboard/interviews/${id}/scorecard`}>
                    <Button variant="outline" className="rounded-md font-semibold">
                        Lihat Scorecard
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Info & Questions */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="rounded-md overflow-hidden">
                        <div className="bg-slate-50 px-6 py-5 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-base font-bold text-slate-900 leading-none mb-1 truncate">{interview.applications.full_name}</h2>
                                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5 text-primary" /> {interview.applications.jobs.title}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Tanggal</p>
                                <p className="text-sm font-semibold text-slate-700">{interview.scheduled_date}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Waktu</p>
                                <p className="text-sm font-semibold text-slate-700">{interview.scheduled_time}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Format</p>
                                <p className="text-sm font-semibold text-slate-700 uppercase">{interview.format}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Template</p>
                                <p className="text-sm font-semibold text-slate-700">{interview.interview_templates?.title || 'None'}</p>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Transcript Pertanyaan ({questions.length})
                        </h3>

                        <div className="space-y-3">
                            {questions.map((q, idx) => (
                                <div key={q.id} className="bg-white border border-slate-200 rounded-md p-5 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-brand-50 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-[10px] font-bold text-primary">{idx + 1}</span>
                                        </div>
                                        <div className="flex-1 space-y-3 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 leading-snug">{q.text}</p>
                                            <div className="bg-slate-50 rounded-md p-4 border border-slate-100">
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

                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-md p-6 bg-slate-900 text-white space-y-4">
                        <h3 className="text-[10px] font-semibold text-primary uppercase tracking-wide">HR Final Notes</h3>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed whitespace-pre-wrap italic">
                            {interview.notes || 'No final notes provided.'}
                        </p>
                        <Link href={`/dashboard/candidates/${interview.application_id}`}>
                            <Button className="w-full rounded-md font-semibold bg-primary hover:bg-brand-600">Buka Profil Kandidat</Button>
                        </Link>
                    </Card>
                </div>
            </div>
        </div>
    )
}
