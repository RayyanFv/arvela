'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { User, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PAGE_SIZE = 5

function formatAnswer(ans) {
    let displayAnswer = ans.answer_text
    try {
        const parsed = JSON.parse(ans.answer_text)
        if (ans.questions?.type === 'matrix') {
            const statements = ans.questions.options?.statements || []
            const labelsMap = ans.questions.options?.scale?.labels || {}
            displayAnswer = Object.entries(parsed)
                .map(([sIdx, val]) => {
                    const stmt = statements[sIdx] || `Pernyataan ${parseInt(sIdx) + 1}`
                    const lbl = labelsMap[String(val)] ? ` (${labelsMap[String(val)]})` : ''
                    return `• ${stmt}: ${val}${lbl}`
                })
                .join('\n')
        } else if (ans.questions?.type === 'ranking') {
            displayAnswer = Array.isArray(parsed) ? parsed.map((v, i) => `${i + 1}. ${v}`).join('\n') : String(parsed)
        } else if (Array.isArray(parsed)) {
            displayAnswer = parsed.join(', ')
        } else if (typeof parsed === 'object') {
            displayAnswer = Object.entries(parsed)
                .map(([k, v]) => `${k}: ${v}`)
                .join('\n')
        }
    } catch (e) { }
    return displayAnswer
}

/**
 * Client-side paginated answer review. All answers are already fetched
 * server-side (single query, no N+1) — pagination here is purely to keep
 * the DOM/scroll length manageable for assessments with many questions,
 * not to reduce network requests.
 */
export function AnswersList({ answers }) {
    const [page, setPage] = useState(1)

    const sorted = useMemo(
        () => [...answers].sort((a, b) => (a.questions?.sort_order || 0) - (b.questions?.sort_order || 0)),
        [answers]
    )

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)
    const startIdx = (currentPage - 1) * PAGE_SIZE
    const pageItems = sorted.slice(startIdx, startIdx + PAGE_SIZE)

    return (
        <div className="space-y-4">
            {pageItems.map((ans, i) => {
                const idx = startIdx + i
                const displayAnswer = formatAnswer(ans)
                const isCorrect = ans.is_reviewed && ans.points_earned === ans.questions?.points

                return (
                    <div key={ans.id} className="bg-white border border-slate-200 rounded-md p-6 space-y-4 relative overflow-hidden">
                        <div className={cn(
                            "absolute left-0 top-0 w-1 h-full",
                            isCorrect ? "bg-emerald-500" : (ans.points_earned > 0 ? "bg-amber-500" : "bg-rose-500")
                        )} />

                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-md text-[10px] font-semibold text-slate-500 uppercase tracking-wide leading-none">
                                    Soal {idx + 1} &bull; {ans.questions?.type?.split('_').join(' ').toUpperCase()}
                                </div>
                                <h4 className="text-base font-bold text-slate-900 leading-snug">{ans.questions?.prompt}</h4>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className="text-right">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide leading-none mb-0.5">Poin Didapat</p>
                                    <p className="text-xl font-bold text-slate-900 leading-none">{ans.points_earned}<span className="text-slate-300 text-sm font-semibold ml-1">/ {ans.questions?.points || 10}</span></p>
                                </div>
                                <span className={cn(
                                    "px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase border",
                                    isCorrect ? "bg-emerald-50 text-emerald-600 border-emerald-200" : (ans.points_earned > 0 ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-rose-50 text-rose-600 border-rose-200")
                                )}>
                                    {isCorrect ? 'Fully Correct' : (ans.points_earned > 0 ? 'Partial Points' : 'Incorrect / No Points')}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="bg-slate-50 rounded-md p-4 border border-slate-100">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> Jawaban Kandidat
                                </p>
                                <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap font-mono">
                                    {displayAnswer || '(Tidak ada jawaban disediakan)'}
                                </p>
                            </div>

                            {ans.questions?.correct_answer && (
                                <div className="bg-emerald-50 rounded-md p-4 border border-dashed border-emerald-200">
                                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Kunci Jawaban
                                    </p>
                                    <p className="text-sm font-semibold text-emerald-800 leading-relaxed font-mono whitespace-pre-wrap">
                                        {Array.isArray(ans.questions.correct_answer) ? ans.questions.correct_answer.join(', ') : String(ans.questions.correct_answer)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}

            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-md px-5 py-3">
                    <p className="text-xs font-medium text-slate-400">
                        Soal <span className="text-slate-900 font-semibold">{startIdx + 1}-{Math.min(startIdx + PAGE_SIZE, sorted.length)}</span> dari {sorted.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            disabled={currentPage <= 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-xs font-semibold text-slate-900 px-2">{currentPage} / {totalPages}</span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            disabled={currentPage >= totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
