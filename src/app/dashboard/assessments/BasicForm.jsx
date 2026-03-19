'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveAssessment } from '@/lib/actions/assessments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Clock,
    ArrowLeft,
    Save,
    Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function AssessmentBasicForm({ initialData = null }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState(initialData?.title || '')
    const [description, setDescription] = useState(initialData?.description || '')
    const [duration, setDuration] = useState(initialData?.duration_minutes || 60)
    const [showScore, setShowScore] = useState(initialData?.show_score || false)
    const [assessmentType, setAssessmentType] = useState(initialData?.assessment_type || 'custom')
    const [dimensionConfig, setDimensionConfig] = useState(initialData?.dimension_config || null)
    const [proctoringEnabled, setProctoringEnabled] = useState(initialData?.proctoring_enabled || false)

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await saveAssessment({
                id: initialData?.id,
                title,
                description,
                duration_minutes: parseInt(duration),
                show_score: showScore,
                assessment_type: assessmentType,
                dimension_config: dimensionConfig,
                proctoring_enabled: proctoringEnabled
            })

            if (res.success) {
                // If it's a new assessment, redirect to its detail page to add questions
                if (!initialData?.id) {
                    router.push(`/dashboard/assessments/${res.id}`)
                } else {
                    alert('Info dasar berhasil diperbarui!')
                    router.refresh()
                }
            }
        } catch (error) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
            {/* Design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16" />

            <div className="flex items-center gap-4 mb-2">
                <Link href="/dashboard/assessments">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold text-foreground">
                    {initialData ? 'Edit Info Dasar' : 'Langkah 1: Info Dasar Assessment'}
                </h1>
            </div>

            <div className="space-y-6 relative">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-bold text-slate-700">Judul Assessment <span className="text-destructive">*</span></Label>
                    <Input
                        id="title"
                        placeholder="Contoh: Logic Test, React.js Frontend Challenge"
                        className="h-11 rounded-xl"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="desc" className="text-sm font-bold text-slate-700">Deskripsi/Instruksi Singkat</Label>
                    <Textarea
                        id="desc"
                        placeholder="Jelaskan apa yang akan diuji dalam assessment ini..."
                        className="min-h-[120px] rounded-xl resize-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700">Jenis Assessment</Label>
                        <Select value={assessmentType} onValueChange={setAssessmentType}>
                            <SelectTrigger className="h-11 rounded-xl">
                                <SelectValue placeholder="Pilih jenis..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="custom">Custom (Bebas)</SelectItem>
                                <SelectItem value="cognitive">Cognitive (Kognitif)</SelectItem>
                                <SelectItem value="personality">Personality (Kepribadian)</SelectItem>
                                <SelectItem value="culture_fit">Culture Fit (Budaya)</SelectItem>
                                <SelectItem value="sjt">SJT (Judgement Situasional)</SelectItem>
                                <SelectItem value="game_based">Game-Based</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground italic">Mempengaruhi cara sistem menganalisis hasil.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="duration" className="text-sm font-bold text-slate-700">Durasi Pengerjaan (Menit)</Label>
                        <div className="relative group">
                            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="duration"
                                type="number"
                                className="h-11 rounded-xl pl-10"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <Checkbox
                            id="showScore"
                            checked={showScore}
                            onCheckedChange={setShowScore}
                            className="w-5 h-5 rounded-md"
                        />
                        <div className="space-y-1 leading-none">
                            <Label htmlFor="showScore" className="text-sm font-bold text-slate-800 cursor-pointer">Umumkan Nilai</Label>
                            <p className="text-[10px] text-slate-500 font-medium">Peserta dapat melihat skor.</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                        <Checkbox
                            id="proctoringEnabled"
                            checked={proctoringEnabled}
                            onCheckedChange={setProctoringEnabled}
                            className="w-5 h-5 rounded-md border-primary/30"
                        />
                        <div className="space-y-1 leading-none">
                            <Label htmlFor="proctoringEnabled" className="text-sm font-bold text-primary cursor-pointer flex items-center gap-1.5">
                                AI Integrity Proctoring
                            </Label>
                            <p className="text-[10px] text-primary/60 font-medium leading-tight">Pantau tab-switch, suara, dan kamera secara otomatis.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-8">
                <Link href="/dashboard/assessments">
                    <Button type="button" variant="ghost" className="h-11 px-6 rounded-xl font-medium">Batal</Button>
                </Link>
                <Button type="submit" className="h-11 px-8 rounded-xl gap-2 font-bold shadow-md shadow-primary/20" disabled={loading}>
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Sedang Menyimpan...</>
                    ) : (
                        <><Save className="w-4 h-4" /> {initialData ? 'Simpan Perubahan' : 'Lanjut Tambah Soal'}</>
                    )}
                </Button>
            </div>
        </form>
    )
}
