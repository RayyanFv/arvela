'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveQuestions } from '@/lib/actions/assessments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Plus,
    Trash2,
    MoreVertical,
    GripVertical,
    FileQuestion,
    CheckCircle2,
    Save,
    Loader2,
    Sparkles,
    ArrowUp,
    ArrowDown
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const QUESTION_TYPES = [
    { value: 'multiple_choice', label: 'Pilihan Ganda' },
    { value: 'essay', label: 'Esai/Jawaban Teks' },
    { value: 'multiple_select', label: 'Pilihan Ganda (Multi)' },
    { value: 'ranking', label: 'Ranking/Ordering' },
    { value: 'numeric_input', label: 'Input Angka' },
    { value: 'matrix', label: 'Matrix/Likert Grid' }
]

export default function QuestionsManager({ assessmentId, initialQuestions = [] }) {
    const [questions, setQuestions] = useState(initialQuestions || [])
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    function addQuestion(type = 'multiple_choice') {
        const newQuestion = {
            id: 'new-' + Date.now(),
            type,
            prompt: '',
            options: (type === 'multiple_choice' || type === 'multiple_select')
                ? ['', '', '', '']
                : type === 'ranking'
                    ? ['', '', '']
                    : type === 'matrix'
                        ? { statements: ['', ''], scale: { min: 1, max: 5 } }
                        : type === 'game_task'
                            ? { game_variant: 'stroop' }
                            : null,
            correct_answer: '',
            points: 10
        }
        setQuestions([...questions, newQuestion])
    }

    function removeQuestion(index) {
        setQuestions(questions.filter((_, i) => i !== index))
    }

    function updateQuestion(index, fields) {
        const updated = [...questions]
        updated[index] = { ...updated[index], ...fields }
        setQuestions(updated)
    }

    function updateOption(qIndex, oIndex, value) {
        const updated = [...questions]
        updated[qIndex].options[oIndex] = value
        setQuestions(updated)
    }

    function moveQuestion(index, direction) {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === questions.length - 1) return

        const brandNew = [...questions]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        // Swap
        const temp = brandNew[index]
        brandNew[index] = brandNew[targetIndex]
        brandNew[targetIndex] = temp

        setQuestions(brandNew)
    }

    async function handleSave() {
        setLoading(true)
        try {
            await saveQuestions(assessmentId, questions)
            alert('Pertanyaan berhasil disimpan!')
        } catch (error) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Daftar Pertanyaan</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Atur soal & tentukan kunci jawaban di bawah ini.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-dashed h-9 px-4 gap-2 hover:border-primary hover:text-primary transition-all group"
                        onClick={() => addQuestion('multiple_choice')}
                    >
                        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /> Tambah Soal
                    </Button>
                    <Button
                        size="sm"
                        className="h-9 px-5 rounded-xl gap-2 font-bold shadow-sm"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Semua
                    </Button>
                </div>
            </div>

            {questions.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center group transition-colors hover:border-slate-300">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-5 rotate-3 group-hover:rotate-0 transition-transform shadow-sm">
                        <FileQuestion className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium max-w-xs mb-6">Belum ada soal. Klik tombol tambah soal untuk memulai.</p>
                    <div className="flex gap-4">
                        <Button onClick={() => addQuestion('multiple_choice')} variant="secondary" className="rounded-xl h-10 px-6 gap-2 border bg-white border-slate-200">
                            <CheckCircle2 className="w-4 h-4 text-primary" /> Pilihan Ganda
                        </Button>
                        <Button onClick={() => addQuestion('essay')} variant="secondary" className="rounded-xl h-10 px-6 gap-2 border bg-white border-slate-200">
                            Esai
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {questions.map((q, qIdx) => (
                        <div key={q.id} className="group relative bg-white border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/20 transition-all duration-300 overflow-hidden">
                            {/* Number badge */}
                            <div className="absolute top-0 right-0 w-12 h-12 bg-slate-50 flex items-center justify-center font-bold text-slate-300 text-lg rounded-bl-3xl border-l border-b border-border transition-colors group-hover:bg-primary/5 group-hover:text-primary/20">
                                {qIdx + 1}
                            </div>

                            <div className="flex gap-4 mb-6">
                                <div className="shrink-0 flex flex-col gap-1 mt-1">
                                    <button
                                        disabled={qIdx === 0}
                                        onClick={() => moveQuestion(qIdx, 'up')}
                                        className="w-8 h-7 rounded-lg bg-slate-100 flex items-center justify-center border border-border hover:bg-white hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        disabled={qIdx === questions.length - 1}
                                        onClick={() => moveQuestion(qIdx, 'down')}
                                        className="w-8 h-7 rounded-lg bg-slate-100 flex items-center justify-center border border-border hover:bg-white hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={q.type}
                                            onChange={(e) => {
                                                const newType = e.target.value;
                                                const defaultOptions =
                                                    newType === 'multiple_choice' || newType === 'multiple_select' ? ['', '', '', ''] :
                                                        newType === 'ranking' ? ['', '', ''] :
                                                            newType === 'matrix' ? { statements: ['', ''], scale: { min: 1, max: 5 } } :
                                                                newType === 'game_task' ? { game_variant: 'stroop' } :
                                                                    null;
                                                updateQuestion(qIdx, { type: newType, options: defaultOptions, correct_answer: newType === 'multiple_select' ? [] : '' });
                                            }}
                                            className="h-8 rounded-lg bg-slate-100 px-3 text-xs font-bold uppercase tracking-wider text-slate-600 border border-border focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer hover:bg-slate-200"
                                        >
                                            {QUESTION_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                                            Skor:
                                            <input
                                                type="number"
                                                value={q.points}
                                                onChange={(e) => updateQuestion(qIdx, { points: parseInt(e.target.value) })}
                                                className="w-10 bg-transparent text-primary text-center outline-none border-b border-transparent hover:border-primary transition-all"
                                            />
                                        </div>
                                    </div>
                                    <Textarea
                                        placeholder="Tuliskan pertanyaan disini..."
                                        className="min-h-[80px] rounded-xl font-medium text-foreground bg-slate-50/50 border-slate-200 focus:bg-white transition-all resize-none"
                                        value={q.prompt}
                                        onChange={(e) => updateQuestion(qIdx, { prompt: e.target.value })}
                                    />
                                </div>
                            </div>

                            {(q.type === 'multiple_choice' || q.type === 'multiple_select') && (
                                <div className="pl-12 grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                    {(q.options && Array.isArray(q.options) ? q.options : []).map((option, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-3 group/opt">
                                            <div
                                                className={`w-4 h-4 rounded-full border-2 transition-all cursor-pointer shrink-0 ${q.type === 'multiple_choice'
                                                    ? (q.correct_answer === option && option !== '' ? 'bg-primary border-primary ring-4 ring-primary/10' : 'border-slate-300')
                                                    : (Array.isArray(q.correct_answer) && q.correct_answer.includes(option) && option !== '' ? 'bg-primary border-primary ring-4 ring-primary/10 rounded-sm' : 'border-slate-300 rounded-sm')
                                                    }`}
                                                onClick={() => {
                                                    if (q.type === 'multiple_choice') {
                                                        updateQuestion(qIdx, { correct_answer: option })
                                                    } else {
                                                        const current = Array.isArray(q.correct_answer) ? q.correct_answer : []
                                                        const next = current.includes(option)
                                                            ? current.filter(o => o !== option)
                                                            : [...current, option]
                                                        updateQuestion(qIdx, { correct_answer: next })
                                                    }
                                                }}
                                            />
                                            <div className="flex-1 relative">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-slate-300 transition-colors group-hover/opt:text-slate-400">
                                                    {String.fromCharCode(65 + oIdx)}
                                                </div>
                                                <Input
                                                    placeholder={`Opsi ${oIdx + 1}`}
                                                    className={`h-10 rounded-xl pl-8 border-slate-100 ${(q.type === 'multiple_choice' && q.correct_answer === option) ||
                                                        (q.type === 'multiple_select' && Array.isArray(q.correct_answer) && q.correct_answer.includes(option))
                                                        ? 'bg-primary/5 border-primary/20 font-bold' : 'bg-slate-50/30'
                                                        }`}
                                                    value={option}
                                                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {q.type === 'ranking' && (
                                <div className="pl-12 space-y-3 mb-4">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Item untuk diurutkan (Urutan Ideal):</Label>
                                    {(q.options && Array.isArray(q.options) ? q.options : []).map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-300 w-4">{oIdx + 1}.</span>
                                            <Input
                                                value={opt}
                                                onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                                placeholder={`Item ${oIdx + 1}`}
                                                className="h-9 rounded-xl text-sm"
                                            />
                                        </div>
                                    ))}
                                    <Button variant="ghost" size="sm" onClick={() => updateQuestion(qIdx, { options: [...(Array.isArray(q.options) ? q.options : []), ''] })} className="h-8 rounded-lg text-xs">+ Tambah Item</Button>
                                </div>
                            )}

                            {q.type === 'numeric_input' && (
                                <div className="pl-12 grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-primary">Jawaban Benar</Label>
                                        <Input
                                            type="number"
                                            value={q.correct_answer}
                                            onChange={(e) => updateQuestion(qIdx, { correct_answer: e.target.value })}
                                            className="h-10 rounded-xl font-bold bg-slate-50 focus:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Unit (%, kg, dll)</Label>
                                        <Input
                                            placeholder="Opsional unit..."
                                            value={q.options?.unit || ''}
                                            onChange={(e) => updateQuestion(qIdx, { options: { ...q.options, unit: e.target.value } })}
                                            className="h-10 rounded-xl"
                                        />
                                    </div>
                                </div>
                            )}

                            {q.type === 'matrix' && (
                                <div className="pl-12 space-y-4 mb-4">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Pernyataan (Baris):</Label>
                                        {(q.options?.statements || []).map((stmt, sIdx) => (
                                            <div key={sIdx} className="flex items-center gap-3">
                                                <span className="text-xs font-black text-slate-300 w-4">{sIdx + 1}.</span>
                                                <Input
                                                    value={stmt}
                                                    onChange={(e) => {
                                                        const newStmts = [...q.options.statements]
                                                        newStmts[sIdx] = e.target.value
                                                        updateQuestion(qIdx, { options: { ...q.options, statements: newStmts } })
                                                    }}
                                                    placeholder="Contoh: Saya lebih suka bekerja dalam tim"
                                                    className="h-9 rounded-xl text-sm"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newStmts = q.options.statements.filter((_, i) => i !== sIdx)
                                                        updateQuestion(qIdx, { options: { ...q.options, statements: newStmts } })
                                                    }}
                                                    className="text-slate-300 hover:text-destructive transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => updateQuestion(qIdx, { options: { ...q.options, statements: [...(q.options?.statements || []), ''] } })}
                                            className="h-8 rounded-lg text-xs"
                                        >
                                            + Tambah Pernyataan
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400">Skala (1 - N)</Label>
                                            <Select
                                                value={String(q.options?.scale?.max || 5)}
                                                onValueChange={(val) => updateQuestion(qIdx, { options: { ...q.options, scale: { ...q.options.scale, max: parseInt(val) } } })}
                                            >
                                                <SelectTrigger className="h-9 rounded-lg">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="3">Skala 3 (1-3)</SelectItem>
                                                    <SelectItem value="5">Skala 5 (1-5)</SelectItem>
                                                    <SelectItem value="7">Skala 7 (1-7)</SelectItem>
                                                    <SelectItem value="10">Skala 10 (1-10)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400">Label Kolom (Kiri/Kanan Ekstrim)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Tdk Setuju"
                                                    className="h-9 text-xs"
                                                    value={q.options?.scale?.labels?.["1"] || ''}
                                                    onChange={(e) => updateQuestion(qIdx, { options: { ...q.options, scale: { ...q.options.scale, labels: { ...q.options.scale.labels, "1": e.target.value } } } })}
                                                />
                                                <Input
                                                    placeholder="Setuju"
                                                    className="h-9 text-xs"
                                                    value={q.options?.scale?.labels?.[String(q.options?.scale?.max || 5)] || ''}
                                                    onChange={(e) => updateQuestion(qIdx, { options: { ...q.options, scale: { ...q.options.scale, labels: { ...q.options.scale.labels, [String(q.options?.scale?.max || 5)]: e.target.value } } } })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {q.type === 'game_task' && (
                                <div className="pl-12 mb-4">
                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2">
                                        <Sparkles className="w-5 h-5 text-amber-500" />
                                        <p className="text-xs font-bold text-amber-800 uppercase">Tipe Soal Game-Based (BETA)</p>
                                        <p className="text-[10px] text-amber-600 max-w-xs leading-relaxed">
                                            Fungsionalitas game saat ini dinonaktifkan sementara untuk meningkatkan akurasi data psikometri.
                                        </p>
                                        <Select
                                            value={q.options?.game_variant || 'stroop'}
                                            disabled
                                            onValueChange={(v) => updateQuestion(qIdx, { options: { ...q.options, game_variant: v } })}
                                        >
                                            <SelectTrigger className="h-10 rounded-xl bg-white border-amber-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="stroop">Stroop Task (Attention)</SelectItem>
                                                <SelectItem value="dot_memory">Dot Memory (Working Memory)</SelectItem>
                                                <SelectItem value="bart">BART (Risk Tolerance)</SelectItem>
                                                <SelectItem value="task_switching">Task Switching (Flexibility)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            <div className="pl-12 flex justify-end gap-3 mt-4 mt-auto">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 px-4 rounded-xl text-destructive hover:bg-destructive/10 transition-colors gap-2"
                                    onClick={() => removeQuestion(qIdx)}
                                >
                                    <Trash2 className="w-4 h-4" /> Hapus Soal
                                </Button>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => addQuestion('multiple_choice')}
                        className="w-full h-16 rounded-3xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all group flex items-center justify-center gap-3 text-slate-400 font-bold"
                    >
                        <div className="bg-slate-50 group-hover:bg-primary group-hover:text-white w-8 h-8 rounded-full flex items-center justify-center shadow-inner transition-all">
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </div>
                        Tambah Soal Baru
                    </button>

                    <div className="sticky bottom-6 left-0 right-0 flex justify-center pt-8 pointer-events-none">
                        <Button
                            className="pointer-events-auto h-12 px-10 rounded-2xl gap-3 font-bold shadow-2xl shadow-primary/30 transform hover:-translate-y-1 active:scale-95 transition-all"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Menyiapkan...</>
                            ) : (
                                <><Sparkles className="w-5 h-5" /> Simpan Perubahan Assessment</>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
