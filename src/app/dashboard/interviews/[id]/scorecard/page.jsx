'use client'

// ──────────────────────────────────────────────────
// MODULE  : Interview Scorecard
// FILE    : app/dashboard/interviews/[id]/scorecard/page.jsx
// TABLES  : applications, interview_scorecards, profiles
// ACCESS  : PROTECTED — hr, super_admin
// ──────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { ArrowLeft, Star, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

const COMPETENCIES = [
    { key: 'score_communication', label: 'Komunikasi', desc: 'Kejelasan, listening, kemampuan menyampaikan ide' },
    { key: 'score_technical', label: 'Kompetensi Teknis', desc: 'Pengetahuan domain, skill relevan dengan posisi' },
    { key: 'score_problem_solving', label: 'Problem Solving', desc: 'Kemampuan analisis, pendekatan logis, kreativitas solusi' },
    { key: 'score_culture_fit', label: 'Culture Fit', desc: 'Alignment nilai, kolaborasi, adaptasi lingkungan kerja' },
    { key: 'score_leadership', label: 'Leadership / Drive', desc: 'Inisiatif, ownership, kemampuan mendrive hasil' },
]

const RECOMMENDATIONS = [
    { value: 'Strong Yes', label: 'Strong Yes', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
    { value: 'Yes', label: 'Yes', color: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500' },
    { value: 'Maybe', label: 'Maybe', color: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
    { value: 'No', label: 'No', color: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-500' },
]

function StarRating({ value, onChange }) {
    const [hover, setHover] = useState(0)
    return (
        <div className="flex gap-1 items-center">
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(n)}
                    className="transition-transform hover:scale-110"
                >
                    <Star className={`w-7 h-7 transition-colors ${(hover || value) >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                </button>
            ))}
            {value > 0 && (
                <span className="ml-2 text-sm font-black text-foreground">
                    {['', 'Sangat Kurang', 'Kurang', 'Cukup', 'Baik', 'Sangat Baik'][value]}
                </span>
            )}
        </div>
    )
}

export default function ScorecardPage() {
    const supabase = createClient()
    const params = useParams()
    const appId = params.id

    const [app, setApp] = useState(null)
    const [existing, setExisting] = useState(null)
    const [scores, setScores] = useState({
        score_communication: 0, score_technical: 0,
        score_problem_solving: 0, score_culture_fit: 0, score_leadership: 0,
    })
    const [recommendation, setRecommendation] = useState('')
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const { data: application } = await supabase
                .from('applications')
                .select('id, full_name, email, jobs(title)')
                .eq('id', appId)
                .single()
            setApp(application)

            const { data: sc } = await supabase
                .from('interview_scorecards')
                .select('*')
                .eq('application_id', appId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (sc) {
                setExisting(sc)
                setScores({
                    score_communication: sc.score_communication || 0,
                    score_technical: sc.score_technical || 0,
                    score_problem_solving: sc.score_problem_solving || 0,
                    score_culture_fit: sc.score_culture_fit || 0,
                    score_leadership: sc.score_leadership || 0,
                })
                setRecommendation(sc.recommendation || '')
                setNotes(sc.notes || '')
            }
            setLoading(false)
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appId])

    const totalAvg = Object.values(scores).reduce((a, b) => a + b, 0) / 5
    const filledCount = Object.values(scores).filter(v => v > 0).length
    const isComplete = filledCount === 5 && !!recommendation

    async function handleSave() {
        if (!isComplete) return
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        const payload = { ...scores, recommendation, notes, created_by: user.id, application_id: appId }

        if (existing) {
            await supabase.from('interview_scorecards').update(payload).eq('id', existing.id)
        } else {
            const { data: inserted } = await supabase.from('interview_scorecards').insert(payload).select().single()
            setExisting(inserted)
        }
        setSaved(true)
        setSaving(false)
        setTimeout(() => setSaved(false), 3000)
    }

    const scoreColor = (avg) => avg >= 4 ? 'text-emerald-600' : avg >= 3 ? 'text-blue-600' : avg >= 2 ? 'text-amber-600' : 'text-red-500'

    if (loading) return (
        <div className="p-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">Memuat scorecard...</p>
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-24">
            <Link href="/dashboard/interviews" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Kembali ke Jadwal Interview
            </Link>

            <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">Interview Scorecard</h1>
                {app && (
                    <p className="text-muted-foreground text-sm mt-1">
                        <span className="font-bold text-foreground">{app.full_name}</span> · {app.jobs?.title}
                    </p>
                )}
            </div>

            {existing && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                    <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
                    <p className="text-xs font-semibold text-blue-700">
                        Scorecard sudah ada — edit dan simpan untuk memperbarui.
                        Dibuat: {new Date(existing.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            )}

            {/* Kompetensi */}
            <Card className="p-6 border-none shadow-sm rounded-2xl space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="font-black text-foreground">Penilaian Kompetensi</h2>
                    {filledCount > 0 && (
                        <div className="text-right">
                            <p className={`text-2xl font-black ${scoreColor(totalAvg)}`}>
                                {totalAvg.toFixed(1)}<span className="text-sm font-semibold text-muted-foreground">/5</span>
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rata-rata</p>
                        </div>
                    )}
                </div>
                <div className="space-y-5">
                    {COMPETENCIES.map(c => (
                        <div key={c.key} className="space-y-2">
                            <div>
                                <p className="font-bold text-foreground text-sm">{c.label}</p>
                                <p className="text-xs text-muted-foreground">{c.desc}</p>
                            </div>
                            <StarRating value={scores[c.key]} onChange={val => setScores(p => ({ ...p, [c.key]: val }))} />
                        </div>
                    ))}
                </div>
                {filledCount > 0 && (
                    <div className="pt-2 border-t border-border">
                        <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1.5">
                            <span>Overall Score</span><span>{((totalAvg / 5) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(totalAvg / 5) * 100}%` }} />
                        </div>
                    </div>
                )}
            </Card>

            {/* Rekomendasi */}
            <Card className="p-6 border-none shadow-sm rounded-2xl">
                <h2 className="font-black text-foreground mb-4">Rekomendasi Akhir</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {RECOMMENDATIONS.map(r => (
                        <button key={r.value} type="button" onClick={() => setRecommendation(r.value)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${recommendation === r.value ? `${r.color} border-current scale-105 shadow-sm` : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                            <div className={`w-2 h-2 rounded-full shrink-0 ${recommendation === r.value ? r.dot : 'bg-muted-foreground/30'}`} />
                            {r.label}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Catatan */}
            <Card className="p-6 border-none shadow-sm rounded-2xl">
                <h2 className="font-black text-foreground mb-3">Catatan Interviewer</h2>
                <Textarea
                    placeholder="Tuliskan observasi spesifik, kekuatan, area improvement, atau hal yang perlu dipertimbangkan..."
                    value={notes} onChange={e => setNotes(e.target.value)}
                    className="rounded-xl min-h-[120px] text-sm resize-none"
                />
            </Card>

            {/* Simpan */}
            <div className="flex items-center gap-3">
                <Button onClick={handleSave} disabled={!isComplete || saving}
                    className="h-11 px-8 rounded-xl bg-primary text-primary-foreground font-bold gap-2">
                    {saving
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                        : saved
                            ? <><CheckCircle2 className="w-4 h-4" /> Tersimpan!</>
                            : <><Save className="w-4 h-4" /> Simpan Scorecard</>
                    }
                </Button>
                {!isComplete && (
                    <p className="text-xs font-medium text-muted-foreground">
                        {filledCount < 5 ? `${5 - filledCount} kompetensi belum dinilai` : 'Pilih rekomendasi untuk menyimpan'}
                    </p>
                )}
            </div>
        </div>
    )
}
