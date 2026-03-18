'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, GripVertical, HelpCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ScreeningQuestionsBuilder({ value, onChange }) {
    const [questions, setQuestions] = useState([])

    useEffect(() => {
        try {
            // Jika value sudah object (dari react-hook-form) atau string JSON
            const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : (value || [])
            setQuestions(Array.isArray(parsed) ? parsed : [])
        } catch (e) {
            setQuestions([])
        }
    }, [value])

    const updateQuestions = (newQuestions) => {
        setQuestions(newQuestions)
        // Kirim balik sebagai string JSON agar konsisten dengan schema backend
        onChange(JSON.stringify(newQuestions))
    }

    const addQuestion = () => {
        updateQuestions([...questions, { question: '', type: 'yes_no' }])
    }

    const removeQuestion = (index) => {
        const next = [...questions]
        next.splice(index, 1)
        updateQuestions(next)
    }

    const setQuestionPart = (index, part, val) => {
        const next = [...questions]
        next[index] = { ...next[index], [part]: val }
        updateQuestions(next)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-primary" />
                    <p className="text-sm font-bold text-slate-900 tracking-tight text-[11px] uppercase tracking-widest">Pertanyaan Pre-Screening</p>
                </div>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addQuestion}
                    className="h-8 rounded-lg border-primary/20 text-primary hover:bg-primary/5 font-black text-[10px] uppercase tracking-wider px-4"
                >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Kriteria
                </Button>
            </div>

            {questions.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
                    <p className="text-xs text-slate-400 font-bold leading-relaxed">
                        Belum ada pertanyaan tambahan.<br/>Gunakan fitur ini untuk memfilter kandidat secara otomatis.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {questions.map((q, i) => (
                        <div key={i} className="flex items-start gap-3 p-5 bg-white border border-slate-200 rounded-3xl shadow-sm transition-all hover:border-primary/30 group">
                            <div className="mt-2.5 text-slate-200">
                                <GripVertical className="w-4 h-4 cursor-grab" />
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-4">
                                <div className="sm:col-span-8">
                                    <Input
                                        placeholder="Tulis pertanyaan (mis. Apakah bersedia dinas luar kota?)"
                                        value={q.question}
                                        onChange={(e) => setQuestionPart(i, 'question', e.target.value)}
                                        className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-sm font-medium"
                                    />
                                </div>
                                <div className="sm:col-span-3">
                                    <Select value={q.type} onValueChange={(val) => setQuestionPart(i, 'type', val)}>
                                        <SelectTrigger className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 font-bold text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            <SelectItem value="yes_no">Pilihan Ya/Tidak</SelectItem>
                                            <SelectItem value="text">Jawaban Esai</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="sm:col-span-1 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeQuestion(i)}
                                        className="h-11 w-11 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <p className="text-[10px] text-primary/70 font-bold leading-relaxed italic">
                    Tips: Gunakan tipe "Pilihan Ya/Tidak" untuk pertanyaan syarat mutlak agar memudahkan Anda dalam memproses data lamaran secara cepat.
                </p>
            </div>
        </div>
    )
}
