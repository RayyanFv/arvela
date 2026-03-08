'use client'

import React from 'react'

export function MatrixQuestion({ question, value, onChange }) {
    const scale = question.options?.scale || { max: 5 }
    const statements = question.options?.statements || []
    const labels = scale.labels || {}

    return (
        <div className="space-y-8 overflow-x-auto pb-6 scrollbar-hide">
            <div className="min-w-[640px] px-2">
                <table className="w-full border-separate border-spacing-0">
                    <thead>
                        <tr>
                            <th className="text-left py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                Pernyataan
                            </th>
                            {Array.from({ length: scale.max }).map((_, i) => {
                                const val = i + 1
                                return (
                                    <th key={i} className="text-center py-6 px-2 text-[10px] font-black text-slate-400 border-b border-slate-100">
                                        <div className="mb-1">{val}</div>
                                        {labels[String(val)] && (
                                            <div className="text-[8px] font-bold normal-case text-slate-300 leading-tight max-w-[60px] mx-auto opacity-60">
                                                {labels[String(val)]}
                                            </div>
                                        )}
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {statements.map((stmt, sIdx) => (
                            <tr key={sIdx} className="group hover:bg-primary/[0.02] transition-colors">
                                <td className="py-6 px-4 text-sm font-bold text-slate-700 border-b border-slate-50 transition-colors group-hover:text-primary leading-relaxed">
                                    {stmt}
                                </td>
                                {Array.from({ length: scale.max }).map((_, i) => {
                                    const val = i + 1
                                    const isSelected = value?.[sIdx] === val
                                    return (
                                        <td key={i} className="py-6 px-2 text-center border-b border-slate-50 relative">
                                            <button
                                                type="button"
                                                onClick={() => onChange(sIdx, val)}
                                                className={`w-8 h-8 rounded-xl border-2 transition-all mx-auto flex items-center justify-center relative ${isSelected
                                                        ? 'bg-primary border-primary shadow-lg shadow-primary/20 scale-110'
                                                        : 'border-slate-100 bg-slate-50/50 hover:border-primary/40 hover:bg-white active:scale-90'
                                                    }`}
                                            >
                                                {isSelected && <div className="w-2 h-2 bg-white rounded-full animate-in zoom-in-50 duration-300" />}
                                            </button>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Guide for users */}
            <div className="flex justify-between items-center text-[10px] font-black text-slate-300 uppercase tracking-widest px-2 md:hidden">
                <span>Santai / Tidak Setuju</span>
                <span>Sangat Setuju / Cepat</span>
            </div>
        </div>
    )
}
