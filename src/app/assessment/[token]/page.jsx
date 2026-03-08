import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClipboardCheck, Clock, FileQuestion, AlertCircle, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import AssessmentInterface from './AssessmentInterface'

export const metadata = { title: 'Assessment Online — Arvela HR' }

export default async function AssessmentEntryPage({ params }) {
    const { token } = await params
    const supabase = await createAdminSupabaseClient()

    // Fetch assignment, assessment, and questions
    const { data: assignment, error } = await supabase
        .from('assessment_assignments')
        .select(`
            *,
            assessments (
                id, title, description, duration_minutes,
                questions (*)
            ),
            applications (full_name, email)
        `)
        .eq('token', token)
        .single()

    if (error || !assignment) notFound()

    // If already completed
    if (assignment.status === 'completed') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
                <div className="max-w-md w-full bg-white border border-border rounded-3xl p-8 text-center shadow-xl shadow-slate-200/50">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 border border-green-100">
                        <ClipboardCheck className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Assessment Selesai!</h1>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        Terima kasih, <strong>{assignment.applications?.full_name}</strong>. Kamu sudah menyelesaikan assessment ini. Tim HR akan segera meninjau hasilnya.
                    </p>
                    <Link href="/portal">
                        <Button className="w-full h-12 rounded-2xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all">Kembali ke Portal</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const test = assignment.assessments
    const questions = test.questions || []

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            {/* Simple Header */}
            <header className="h-16 bg-white border-b border-border flex items-center px-6 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
                    <span className="font-bold text-lg tracking-tight">Arvela<span className="text-primary">HR</span> Assessment</span>
                    <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-border">
                        <AlertCircle className="w-3.5 h-3.5" /> Jaga Kejujuran & Fokus
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 py-12">
                <AssessmentInterface
                    assignment={assignment}
                    test={test}
                    questions={questions}
                    candidateName={assignment.applications?.full_name}
                />
            </main>

            <footer className="py-6 text-center text-[11px] text-slate-400">
                &copy; {new Date().getFullYear()} ArvelaHR Assessment System. Seluruh hak cipta dilindungi.
            </footer>
        </div>
    )
}
