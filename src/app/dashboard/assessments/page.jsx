import { getAssessments } from '@/lib/actions/assessments'
import { Plus, ClipboardCheck, Clock, FileQuestion, Users, MoreVertical, Pencil, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { DeleteAssessmentButton } from './DeleteAssessmentButton'

export const metadata = { title: 'Assessment System — Arvela HR' }
export const dynamic = 'force-dynamic'

export default async function AssessmentsPage() {
    const assessments = await getAssessments().catch(e => {
        console.error('Error loading assessments:', e)
        return []
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Assessment Online</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Buat dan kelola tes kompetensi untuk menyaring kandidat terbaik.</p>
                </div>
                <Link href="/dashboard/assessments/new">
                    <Button className="h-10 px-4 rounded-xl gap-2 font-medium">
                        <Plus className="w-4 h-4" /> Buat Assessment Baru
                    </Button>
                </Link>
            </div>

            {assessments.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-100">
                        <ClipboardCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">Belum ada assessment</h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                        Buat assessment baru (seperti Logic Test, Skill Test, dll) agar kamu bisa mengirimnya ke kandidat.
                    </p>
                    <Link href="/dashboard/assessments/new">
                        <Button variant="outline" className="rounded-xl h-10 px-6 border-dashed border-2 hover:border-primary">
                            <Plus className="w-4 h-4 mr-2" /> Mulai Sekarang
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.map((test) => (
                        <div key={test.id} className="group relative bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col h-full overflow-hidden">
                            {/* Accent line top */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 translate-y-[-1px]" />

                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-border group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors shrink-0">
                                        <ClipboardCheck className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <div className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                        Assessment
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                    {test.title}
                                </h3>

                                <p className="text-sm text-muted-foreground line-clamp-2 mb-6 leading-relaxed">
                                    {test.description || 'Tidak ada deskripsi.'}
                                </p>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border mt-auto">
                                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {test.duration_minutes} Menit</div>
                                    <div className="flex items-center gap-1.5"><FileQuestion className="w-3.5 h-3.5" /> {test.questions?.[0]?.count || 0} Soal</div>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-[11px] text-muted-foreground italic">
                                        Dibuat {formatDistanceToNow(new Date(test.created_at), { locale: localeID })} yg lalu
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <DeleteAssessmentButton id={test.id} title={test.title} />
                                        <Link href={`/dashboard/assessments/${test.id}`} className="group/btn inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:gap-2 transition-all">
                                            Kelola <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
