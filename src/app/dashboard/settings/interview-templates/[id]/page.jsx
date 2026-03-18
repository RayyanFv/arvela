'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, GripVertical, Save, HelpCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { saveInterviewTemplate } from '@/lib/actions/interviews'

export default function TemplateEditorPage({ params }) {
    const { id } = params
    const isNew = id === 'new'
    const router = useRouter()
    const [loading, setLoading] = useState(!isNew)
    const [template, setTemplate] = useState({ title: '', questions: [] })

    useEffect(() => {
        if (!isNew) {
            // Fetch template — in a real app you'd call a server action here
            // For now I'll assume we can pass it or fetch it.
            // Since it's a client component, I'll fetch it from the API/Action
            import('@/lib/actions/interviews').then(mod => {
                mod.getInterviewTemplates().then(list => {
                    const found = list.find(t => t.id === id)
                    if (found) setTemplate(found)
                    setLoading(false)
                })
            })
        }
    }, [id, isNew])

    const save = async () => {
        try {
            await saveInterviewTemplate(template)
            router.push('/dashboard/settings/interview-templates')
        } catch (e) {
            alert(e.message)
        }
    }

    const addQuestion = () => {
        setTemplate({
            ...template,
            questions: [...template.questions, { question: '', score_range: 5 }]
        })
    }

    const removeQuestion = (idx) => {
        const next = [...template.questions]
        next.splice(idx, 1)
        setTemplate({ ...template, questions: next })
    }

    const updateQuestion = (idx, part, val) => {
        const next = [...template.questions]
        next[idx] = { ...next[idx], [part]: val }
        setTemplate({ ...template, questions: next })
    }

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
            <Link href="/dashboard/settings/interview-templates" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors mb-8 group">
                <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Kembali ke Daftar Template
            </Link>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        {isNew ? 'Buat Template Baru' : 'Edit Template'}
                    </h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Standardisasi Pertanyaan Interview</p>
                </div>
                <Button onClick={save} className="h-12 px-8 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black shadow-xl">
                    <Save className="w-4 h-4 mr-2" /> Simpan Template
                </Button>
            </div>

            <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm space-y-10">
                <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Judul Template <span className="text-rose-500">*</span></label>
                    <Input 
                        placeholder="mis. Initial HR Interview / Technical Java Senior"
                        value={template.title}
                        onChange={e => setTemplate({ ...template, title: e.target.value })}
                        className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white text-xl font-black transition-all px-6"
                    />
                </div>

                <div className="pt-8 border-t border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Daftar Pertanyaan</h2>
                        </div>
                        <Button variant="outline" size="sm" onClick={addQuestion} className="h-9 rounded-xl border-primary/20 text-primary font-bold text-[10px] uppercase tracking-widest hover:bg-primary/5 px-4">
                            <Plus className="w-4 h-4 mr-1.5" /> Tambah Pertanyaan
                        </Button>
                    </div>

                    {template.questions.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-14 text-center">
                            <p className="text-xs text-slate-400 font-bold leading-relaxed">
                                Belum ada pertanyaan yang dibuat.<br/>Klik tombol di atas untuk menyusun pakem evaluasi.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {template.questions.map((q, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm transition-all hover:border-primary/20 hover:shadow-md group">
                                    <div className="mt-3.5 text-slate-200">
                                        <GripVertical className="w-5 h-5 cursor-grab" />
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-5">
                                        <div className="sm:col-span-8 space-y-2">
                                            <Input
                                                placeholder="Tuliskan pertanyaan (mis. Ceritakan pengalaman Anda menangani konflik...)"
                                                value={q.question}
                                                onChange={e => updateQuestion(idx, 'question', e.target.value)}
                                                className="h-12 rounded-2xl border-slate-50 bg-slate-50/50 focus:bg-white transition-all text-sm font-bold"
                                            />
                                            <p className="text-[10px] text-slate-400 font-medium pl-1 italic">
                                                Gunakan pertanyaan terbuka untuk menggali potensi kandidat lebih dalam.
                                            </p>
                                        </div>
                                        <div className="sm:col-span-3">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Max Skor</label>
                                                <Input
                                                    type="number"
                                                    value={q.score_range}
                                                    onChange={e => updateQuestion(idx, 'score_range', parseInt(e.target.value))}
                                                    className="h-12 rounded-2xl border-slate-50 bg-slate-50/50 text-center font-black"
                                                />
                                            </div>
                                        </div>
                                        <div className="sm:col-span-1 flex justify-end items-center pt-6">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeQuestion(idx)}
                                                className="h-12 w-12 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/10 space-y-3">
                    <p className="text-xs font-black text-primary uppercase tracking-widest">💡 Mengapa Standardisasi Penting?</p>
                    <p className="text-xs text-primary/70 font-medium leading-relaxed">
                        Dengan menggunakan template, setiap kandidat dinilai secara objektif menggunakan parameter yang sama. 
                        Ini membantu tim rekrutmen memberikan evaluasi yang lebih adil dan akurat.
                    </p>
                </div>
            </div>
        </div>
    )
}
