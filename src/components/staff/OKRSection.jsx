'use client'

import { Trophy, Target, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function OKRSection({ okrs = [] }) {
    if (okrs.length === 0) {
        return (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
                <Trophy className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase">Belum ada target OKR</p>
                <p className="text-[10px] text-slate-300 mt-2">Hubungi manajer Anda untuk menetapkan target kuartal ini.</p>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            {okrs.map(okr => (
                <Card key={okr.id} className="rounded-3xl border-none shadow-lg p-6 space-y-4 group transition-all hover:shadow-2xl hover:shadow-primary/5">
                    <div className="space-y-1">
                        <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 rounded-lg text-[9px] font-black border-none uppercase">
                            {okr.period}
                        </Badge>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{okr.title}</h3>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>Progress Keseluruhan</span>
                            <span className="text-primary font-black">{Math.round(okr.total_progress)}%</span>
                        </div>
                        <Progress value={okr.total_progress} className="h-2 bg-slate-50" />
                    </div>

                    <div className="pt-4 space-y-3">
                        {okr.key_results?.map(kr => (
                            <div key={kr.id} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-medium text-slate-500">
                                    <span>{kr.title}</span>
                                    <span className="font-bold text-slate-700">{kr.current_value} / {kr.target_value} {kr.unit}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary/40 rounded-full transition-all duration-700"
                                        style={{ width: `${(kr.current_value / kr.target_value) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            ))}
            <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-200 text-slate-500 font-bold text-xs gap-2 group">
                Lihat Semua Progress <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
    )
}
