'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { assignAssessment, updateAssignmentScore } from '@/lib/actions/assessments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
    CheckCircle2,
    Clock,
    FileText,
    ExternalLink
} from 'lucide-react'

export default function CandidateAssessmentBox({ application, assessments = [], existingAssignments = [] }) {
    const router = useRouter()
    const [selectedId, setSelectedId] = useState('')
    const [loading, setLoading] = useState(false)
    const [reviewingId, setReviewingId] = useState(null)
    const [points, setPoints] = useState(0)
    const [notes, setNotes] = useState('')
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

    async function handleSubmitScore() {
        if (!reviewingId) return
        setLoading(true)
        try {
            await updateAssignmentScore({
                assignment_id: reviewingId.id,
                points: parseInt(points),
                notes
            })
            setReviewingId(null)
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
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                    {asgn.status === 'sent' && <Clock className="w-3 h-3 inline mr-1" />}
                                    {asgn.status === 'completed' && (
                                        <button
                                            onClick={() => {
                                                setReviewingId(asgn)
                                                setPoints(asgn.total_score || 0)
                                                setNotes('')
                                            }}
                                            className="ml-2 bg-white border border-slate-200 px-2 py-0.5 rounded text-[9px] font-bold text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm"
                                        >
                                            {asgn.total_score === null ? 'Beri Nilai' : 'Ubah Nilai'}
                                        </button>
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

            {/* Review Modal Simple */}
            {reviewingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 transform animate-in slide-in-from-bottom-5 duration-400 flex flex-col max-h-[90vh]">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                                <ClipboardCheck className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Review Hasil Assessment</h3>
                                <p className="text-[11px] text-slate-500 font-medium tracking-tight">Tinjau jawaban kandidat & berikan skor final.</p>
                            </div>
                        </div>

                        {/* Answers Review Area */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            {reviewingId?.answers?.length > 0 ? (
                                reviewingId.answers.map((ans, idx) => (
                                    <div key={ans.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Soal {idx + 1}</p>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                                                {ans.questions?.points} Poin
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 leading-relaxed">{ans.questions?.prompt}</p>
                                        <div className="bg-white border border-slate-200/60 rounded-xl p-3 shadow-sm border-l-4 border-l-primary/30">
                                            <p className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1.5">Jawaban Kandidat:</p>
                                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{ans.answer_text || '(Tidak ada jawaban)'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center space-y-2">
                                    <FileText className="w-10 h-10 text-slate-200 mx-auto" />
                                    <p className="text-sm text-slate-400 font-medium">Beban jawaban tidak ditemukan.</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 space-y-4 shrink-0">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Skor Akhir (0-100)</Label>
                                    <Input
                                        type="number"
                                        value={points}
                                        onChange={(e) => setPoints(e.target.value)}
                                        className="h-11 rounded-2xl font-black text-lg focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Status Assessment</Label>
                                    <div className="h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center px-4">
                                        <span className="text-sm font-bold text-green-600">Selesai (Completed)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Catatan Reviewer</Label>
                                <Textarea
                                    placeholder="Opsional: Tambahkan alasan atau feedback..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="h-20 rounded-2xl text-sm resize-none focus:ring-primary/20"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="ghost"
                                    className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100"
                                    onClick={() => setReviewingId(null)}
                                >
                                    Tutup
                                </Button>
                                <Button
                                    className="flex-[1.5] h-12 rounded-2xl font-bold gap-2 shadow-xl shadow-primary/20"
                                    onClick={handleSubmitScore}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Skor Final'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
