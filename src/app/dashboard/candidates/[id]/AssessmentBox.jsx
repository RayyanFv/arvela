'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { assignAssessment } from '@/lib/actions/assessments'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ClipboardCheck,
    Send,
    Loader2,
    Clock,
    FileText,
    ExternalLink,
    ShieldAlert
} from 'lucide-react'

export default function CandidateAssessmentBox({ application, assessments = [], existingAssignments = [] }) {
    const router = useRouter()
    const [selectedId, setSelectedId] = useState('')
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    async function handleAssign() {
        if (!selectedId) return
        setLoading(true)

        try {
            await assignAssessment({
                assessment_id: selectedId,
                application_id: application.id
            })
            setSelectedId('')
            router.refresh()
        } catch (error) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                Assessment Online
            </h2>

            {existingAssignments.length > 0 && (
                <div className="space-y-3">
                    {existingAssignments.map(asgn => (
                        <div key={asgn.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden group">
                            <div className="flex items-start justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-700 truncate">{asgn.assessments?.title}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${asgn.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            asgn.status === 'expired' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {asgn.status === 'sent' ? 'TERKIRIM' : asgn.status}
                                        </span>
                                        {asgn.total_score !== null && (
                                            <span className="text-[10px] font-bold text-slate-500">
                                                Skor: <span className="text-primary">{asgn.total_score}</span>
                                            </span>
                                        )}
                                        {asgn.proctoring_logs?.length > 0 && (
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 rounded text-[10px] font-black">
                                                <ShieldAlert className="w-2.5 h-2.5" />
                                                PROCTORING ALERT ({asgn.proctoring_logs.length})
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                    {asgn.status === 'sent' && <Clock className="w-3 h-3 inline mr-1" />}
                                    {asgn.status === 'completed' && (
                                        <Link
                                            href={`/dashboard/assessments/results/${asgn.id}`}
                                            className="ml-2 bg-white border border-slate-200 px-3 py-1 rounded-lg text-[9px] font-bold text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm flex items-center gap-1.5"
                                        >
                                            <FileText className="w-2.5 h-2.5" />
                                            {asgn.total_score === null ? 'Detail & Review' : 'Hasil Assessment'}
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Action link for candidate view */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 mt-1">
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/assessment/${asgn.token}`
                                        navigator.clipboard.writeText(url)
                                        alert('Link Assessment disalin!')
                                    }}
                                    className="text-[10px] font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    Salin Link <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-3 pt-2">
                <p className="text-[11px] text-muted-foreground leading-tight">Berikan tes baru untuk kandidat ini:</p>
                <div className="flex items-center gap-2">
                    {mounted ? (
                        <Select value={selectedId} onValueChange={setSelectedId}>
                            <SelectTrigger className="h-9 rounded-xl text-xs flex-1">
                                <SelectValue placeholder="Pilih Test" />
                            </SelectTrigger>
                            <SelectContent>
                                {assessments.map(test => (
                                    <SelectItem key={test.id} value={test.id} className="text-xs">
                                        {test.title} ({test.duration_minutes}m)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="h-9 rounded-xl border border-input bg-background px-3 flex-1" />
                    )}
                    <Button
                        size="sm"
                        disabled={!selectedId || loading}
                        className="h-9 rounded-xl gap-2 px-3 shadow-sm transform active:scale-95 transition-all"
                        onClick={handleAssign}
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        <span className="hidden sm:inline">Kirim</span>
                    </Button>
                </div>
            </div>

            <p className="text-[10px] text-center text-slate-400 bg-slate-50 py-2 rounded-lg border border-dashed border-slate-200">
                Pengerjaan akan otomatis terdeteksi skor & statusnya.
            </p>
        </div>
    )
}
