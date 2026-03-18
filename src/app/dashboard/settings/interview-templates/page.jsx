import { getInterviewTemplates } from '@/lib/actions/interviews'
import { Plus, ClipboardCheck, Trash2, Edit2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import TemplateList from './TemplateList'

export const metadata = { title: 'Template Interview — Arvela HR' }

export default async function InterviewTemplatesPage() {
    const templates = await getInterviewTemplates()

    return (
        <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Template Interview</h1>
                    <p className="text-slate-500 font-medium">Buat pakem pertanyaan baku untuk sesi interview yang konsisten.</p>
                </div>
                <Link href="/dashboard/settings/interview-templates/new">
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white h-12 px-6 rounded-2xl font-bold gap-2 shadow-xl shadow-slate-200 transition-all active:scale-95 shrink-0">
                        <Plus className="w-5 h-5" /> Buat Template Baru
                    </Button>
                </Link>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <Info className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-amber-900 mb-1">Pentingnya Standardisasi</h4>
                    <p className="text-sm text-amber-800/80 leading-relaxed font-medium">
                        Gunakan template untuk menyamakan standar evaluasi di seluruh interviewer. Ini membantu mengurangi bias dan memastikan setiap kandidat dinilai dengan kriteria yang sama.
                    </p>
                </div>
            </div>

            <TemplateList initialTemplates={templates} />
        </div>
    )
}
