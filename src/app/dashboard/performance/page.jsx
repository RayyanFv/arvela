'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { useToast } from '@/hooks/use-toast'
import { ToastBanner } from '@/components/ui/ToastBanner'
import {
    Target, Trophy, TrendingUp, Users, Zap, Search,
    Star, CheckCircle2, Clock, ChevronDown, ChevronUp,
    MessageSquare, Award, BarChart3, Loader2, X, Save
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const OKR_LIST_LIMIT = 1000

const RATINGS = [
    { value: 'Exceeds', label: 'Exceeds Expectations', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', score: [90, 100] },
    { value: 'Meets', label: 'Meets Expectations', color: 'bg-blue-100 text-blue-700 border-blue-200', score: [70, 89] },
    { value: 'Below', label: 'Below Expectations', color: 'bg-amber-100 text-amber-700 border-amber-200', score: [50, 69] },
    { value: 'Poor', label: 'Needs Improvement', color: 'bg-red-100 text-red-700 border-red-200', score: [0, 49] },
]

function getRatingFromScore(score) {
    if (score == null) return null
    for (const r of RATINGS) {
        if (score >= r.score[0] && score <= r.score[1]) return r.value
    }
    return 'Poor'
}

function RatingBadge({ rating }) {
    if (!rating) return <span className="text-slate-400 text-[10px] font-semibold">Belum diulas</span>
    const r = RATINGS.find(x => x.value === rating)
    return <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${r?.color ?? ''}`}>{r?.label ?? rating}</span>
}

function ReviewModal({ okr, reviewerId, onClose, onSaved, showToast }) {
    const supabase = createClient()
    const [score, setScore] = useState(okr.final_score ?? Math.round(okr.total_progress ?? 0))
    const [notes, setNotes] = useState(okr.hr_notes ?? '')
    const [saving, setSaving] = useState(false)
    const rating = getRatingFromScore(score)

    async function handleSave() {
        setSaving(true)
        const { error } = await supabase.from('okrs').update({
            final_score: score,
            hr_notes: notes,
            rating: rating,
            reviewed_at: new Date().toISOString(),
            reviewed_by: reviewerId,
            status: 'completed'
        }).eq('id', okr.id)
        if (!error) {
            showToast('Review berhasil disimpan.')
            onSaved()
            onClose()
        } else {
            showToast(error.message, 'error')
        }
        setSaving(false)
    }

    const rObj = RATINGS.find(r => r.value === rating)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-md shadow-lg w-full max-w-lg">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Performance Review</p>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">{okr.title}</h3>
                        <p className="text-xs text-slate-400 font-medium">{okr.employees?.profiles?.full_name} · {okr.period}</p>
                    </div>
                    <button onClick={onClose} aria-label="Tutup" className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Auto Progress */}
                    <div className="bg-slate-50 rounded-md p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Auto Progress KR</p>
                            <p className="text-2xl font-bold text-slate-700">{Math.round(okr.total_progress ?? 0)}%</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">KR Selesai</p>
                            <p className="text-2xl font-bold text-slate-700">{okr.key_results?.filter(k => k.current_value >= k.target_value).length ?? 0}/{okr.key_results?.length ?? 0}</p>
                        </div>
                    </div>

                    {/* Score Slider */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Skor Final HR</label>
                            <div className={`px-3 py-1 rounded-md text-xs font-semibold border ${rObj?.color ?? 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                {score} — {rObj?.label ?? '-'}
                            </div>
                        </div>
                        <input
                            type="range" min={0} max={100} step={1}
                            value={score}
                            onChange={e => setScore(Number(e.target.value))}
                            aria-label="Skor final"
                            className="w-full accent-primary h-2 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                        </div>
                    </div>

                    {/* Rating Quick Select */}
                    <div className="grid grid-cols-2 gap-2">
                        {RATINGS.map(r => (
                            <button
                                key={r.value}
                                onClick={() => setScore(r.score[1])}
                                className={`p-2 rounded-md text-[11px] font-semibold border transition-colors text-left ${rating === r.value ? r.color + ' ring-2 ring-offset-1 ring-current' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                {r.label}
                                <span className="block text-[9px] opacity-70">{r.score[0]}–{r.score[1]}</span>
                            </button>
                        ))}
                    </div>

                    {/* HR Notes */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Catatan HR</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Tuliskan feedback, konteks, atau rekomendasi untuk karyawan ini..."
                            rows={3}
                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-md p-3 font-medium text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none"
                        />
                    </div>
                </div>

                <div className="p-6 pt-2 flex items-center gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1 h-11 rounded-md font-semibold">Batal</Button>
                    <Button onClick={handleSave} disabled={saving} className="flex-1 h-11 rounded-md font-semibold bg-primary text-white gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Review
                    </Button>
                </div>
            </div>
        </div>
    )
}

function OKRRow({ okr, onReview }) {
    const [expanded, setExpanded] = useState(false)
    const progress = Math.round(okr.total_progress ?? 0)
    const isReviewed = !!okr.final_score

    return (
        <div className="border-b border-slate-100 last:border-0">
            <div
                className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => setExpanded(e => !e)}
            >
                {/* Employee */}
                <div className="flex items-center gap-3 w-48 shrink-0">
                    <div className="w-9 h-9 rounded-md bg-brand-50 flex items-center justify-center font-bold text-sm text-primary shrink-0 overflow-hidden">
                        {okr.employees?.profiles?.avatar_url
                            ? <img src={okr.employees.profiles.avatar_url} className="w-full h-full object-cover" />
                            : okr.employees?.profiles?.full_name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{okr.employees?.profiles?.full_name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{okr.employees?.job_title}</p>
                    </div>
                </div>

                {/* Objective */}
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{okr.title}</p>
                    <p className="text-[10px] text-slate-400">{okr.period} · {okr.key_results?.length ?? 0} KR</p>
                </div>

                {/* Progress bar */}
                <div className="w-32 hidden md:block">
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[10px] text-right text-slate-400 font-semibold mt-0.5">{progress}%</p>
                </div>

                {/* Rating / Score */}
                <div className="w-36 hidden md:flex flex-col items-end gap-1">
                    <RatingBadge rating={okr.rating} />
                    {isReviewed && <span className="text-[10px] text-slate-400 font-semibold">Skor: {okr.final_score}</span>}
                </div>

                {/* Action */}
                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <Button
                        onClick={() => onReview(okr)}
                        size="sm"
                        className={`h-8 text-[11px] font-semibold rounded-md gap-1.5 ${isReviewed ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-primary text-white hover:bg-brand-600'}`}
                    >
                        <Star className="w-3 h-3" />
                        {isReviewed ? 'Edit Review' : 'Beri Review'}
                    </Button>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
            </div>

            {/* Expanded KR Details */}
            {expanded && (
                <div className="px-4 pb-4 ml-12 space-y-2">
                    {isReviewed && okr.hr_notes && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Catatan HR
                            </p>
                            <p className="text-xs text-blue-800 font-medium">{okr.hr_notes}</p>
                        </div>
                    )}
                    <div className="bg-white border border-slate-200 rounded-md overflow-hidden text-[11px]">
                        <div className="grid grid-cols-4 bg-slate-50 px-3 py-2 font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <span className="col-span-2">Key Result</span>
                            <span className="text-center">Current / Target</span>
                            <span className="text-right">Progress</span>
                        </div>
                        {okr.key_results?.length === 0 && (
                            <p className="p-3 text-slate-400 text-center">Belum ada KR.</p>
                        )}
                        {okr.key_results?.map(kr => {
                            const pct = Math.min(100, Math.round(((Number(kr.current_value) || 0) / (Number(kr.target_value) || 1)) * 100))
                            return (
                                <div key={kr.id} className="grid grid-cols-4 px-3 py-2 border-b border-slate-100 last:border-0 items-center hover:bg-slate-50">
                                    <span className="col-span-2 text-slate-700 font-medium truncate pr-2">{kr.title}</span>
                                    <span className="text-center font-semibold text-slate-600">{kr.current_value} / {kr.target_value} {kr.unit}</span>
                                    <div className="flex items-center gap-2 justify-end">
                                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-slate-400 font-semibold w-8 text-right">{pct}%</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function PerformanceDashboardPage() {
    const { profile } = useProfile()
    const { toast, showToast } = useToast()
    const [okrs, setOkrs] = useState([])
    const [stats, setStats] = useState({ avgProgress: 0, totalOKRs: 0, reviewed: 0, topScore: 0 })
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterPeriod, setFilterPeriod] = useState('')
    const [filterRating, setFilterRating] = useState('')
    const [reviewingOKR, setReviewingOKR] = useState(null)
    const supabase = createClient()
    const companyId = profile?.company_id

    const fetchPerformance = useCallback(async () => {
        if (!companyId) return
        setLoading(true)

        const { data } = await supabase
            .from('okrs')
            .select(`
                *,
                employees!inner (
                    job_title,
                    company_id,
                    profiles!employees_profile_id_fkey (full_name, avatar_url)
                ),
                key_results (*)
            `)
            .eq('employees.company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(OKR_LIST_LIMIT)

        const filtered = data ?? []
        setOkrs(filtered)
        const total = filtered.length
        const avg = filtered.reduce((a, c) => a + (c.total_progress || 0), 0) / (total || 1)
        const reviewed = filtered.filter(o => o.final_score != null).length
        const topScore = Math.max(...filtered.map(o => o.final_score ?? 0), 0)
        setStats({ totalOKRs: total, avgProgress: Math.round(avg), reviewed, topScore })
        setLoading(false)
    }, [supabase, companyId])

    useEffect(() => { fetchPerformance() }, [fetchPerformance])

    const periods = [...new Set(okrs.map(o => o.period))].sort().reverse()

    const filtered = okrs.filter(o => {
        const matchSearch = !search ||
            o.employees?.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            o.title.toLowerCase().includes(search.toLowerCase())
        const matchPeriod = !filterPeriod || o.period === filterPeriod
        const matchRating = !filterRating ||
            (filterRating === 'unreviewed' ? !o.rating : o.rating === filterRating)
        return matchSearch && matchPeriod && matchRating
    })

    const statCards = [
        { label: 'Avg. Progress', value: `${stats.avgProgress}%`, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Aktif Objektif', value: stats.totalOKRs, icon: Target, color: 'text-primary', bg: 'bg-brand-50' },
        { label: 'Sudah Diulas', value: `${stats.reviewed}/${stats.totalOKRs}`, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Skor Tertinggi', value: stats.topScore, icon: Award, color: 'text-violet-500', bg: 'bg-violet-50' },
    ]

    return (
        <div className="space-y-6 pb-20">
            <ToastBanner toast={toast} />

            {reviewingOKR && (
                <ReviewModal
                    okr={reviewingOKR}
                    reviewerId={profile?.id}
                    onClose={() => setReviewingOKR(null)}
                    onSaved={fetchPerformance}
                    showToast={showToast}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Target & Performa</h1>
                    <p className="text-sm text-slate-500 font-medium">Pantau target kerja seluruh karyawan dan beri penilaian kuartal di sini.</p>
                </div>
                <div className="flex gap-3">
                    <Badge className="h-9 px-4 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-xs">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        {periods[0] ?? 'Q1 2026'}
                    </Badge>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s, i) => (
                    <Card key={i} className="p-5 border border-slate-200 rounded-md flex items-center gap-4">
                        <div className={`w-11 h-11 ${s.bg} rounded-md flex items-center justify-center shrink-0`}>
                            <s.icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wide leading-none mb-1">{s.label}</p>
                            <p className="text-xl font-bold text-slate-900">{s.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-3 bg-white flex-1 p-2 pr-4 rounded-md border border-slate-200">
                    <Search className="w-4 h-4 ml-2 text-slate-400 shrink-0" />
                    <input
                        placeholder="Cari karyawan atau sasaran..."
                        aria-label="Cari karyawan atau sasaran"
                        className="flex-1 border-none bg-transparent text-sm font-medium outline-none p-1"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={filterPeriod}
                    onChange={e => setFilterPeriod(e.target.value)}
                    className="bg-white border border-slate-200 rounded-md px-4 py-2 text-sm font-semibold text-slate-600 outline-none"
                >
                    <option value="">Semua Periode</option>
                    {periods.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                    value={filterRating}
                    onChange={e => setFilterRating(e.target.value)}
                    className="bg-white border border-slate-200 rounded-md px-4 py-2 text-sm font-semibold text-slate-600 outline-none"
                >
                    <option value="">Semua Rating</option>
                    <option value="unreviewed">Belum Diulas</option>
                    {RATINGS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
            </div>

            {/* Table */}
            <Card className="border border-slate-200 rounded-md overflow-hidden bg-white">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-[192px_1fr_128px_144px_160px] px-4 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    <span>Karyawan</span>
                    <span>Sasaran Utama</span>
                    <span>Progres</span>
                    <span>Rating</span>
                    <span className="text-right">Aksi</span>
                </div>

                {loading ? (
                    <div className="space-y-0 divide-y divide-slate-100">
                        {Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-16 animate-pulse bg-slate-50 mx-4 my-3 rounded-md" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center">
                        <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-semibold">Tidak ada data OKR ditemukan.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.map(okr => (
                            <OKRRow key={okr.id} okr={okr} onReview={setReviewingOKR} />
                        ))}
                    </div>
                )}
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 justify-center">
                {RATINGS.map(r => (
                    <span key={r.value} className={`px-3 py-1 rounded-md text-[10px] font-semibold border ${r.color}`}>
                        {r.label} ({r.score[0]}–{r.score[1]})
                    </span>
                ))}
            </div>
        </div>
    )
}
