'use client'

import { useState } from 'react'
import { processApprovalStep } from '@/lib/actions/approval-engine'
import { submitPromotionRequest } from '@/lib/actions/promotions'
import {
    TrendingUp, CheckCircle2, XCircle, Search, ShieldCheck, Plus, X, Loader2, ArrowRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/layout/PageHeader'
import { useToast } from '@/hooks/use-toast'
import { ToastBanner } from '@/components/ui/ToastBanner'

const STATUS_BADGES = {
    pending_manager: { label: 'Step 1: Menunggu Atasan', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    pending_hr:      { label: 'Step 2: Menunggu HR Final', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    approved:        { label: 'Disetujui', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    rejected:        { label: 'Ditolak', color: 'bg-rose-50 text-rose-600 border-rose-200' },
}

function NewPromotionModal({ employees, grades, onClose, onCreated, showToast }) {
    const [employeeId, setEmployeeId] = useState('')
    const [targetGradeId, setTargetGradeId] = useState('')
    const [effectiveDate, setEffectiveDate] = useState('')
    const [reason, setReason] = useState('')
    const [saving, setSaving] = useState(false)

    const selectedEmployee = employees.find(e => e.id === employeeId)
    const currentGrade = grades.find(g => g.id === selectedEmployee?.job_grade_id)

    async function handleSubmit() {
        setSaving(true)
        try {
            const promo = await submitPromotionRequest({
                employee_id: employeeId,
                target_grade_id: targetGradeId,
                effective_date: effectiveDate,
                reason,
            })
            showToast('Pengajuan promosi berhasil dibuat.')
            onCreated(promo)
            onClose()
        } catch (err) {
            showToast(err.message, 'error')
        }
        setSaving(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-md shadow-lg w-full max-w-lg">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">Ajukan Promosi / Naik Pangkat</h3>
                    <button onClick={onClose} aria-label="Tutup" className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <Label className="text-[10px] font-semibold text-slate-400 uppercase">Karyawan *</Label>
                        <select
                            value={employeeId}
                            onChange={e => setEmployeeId(e.target.value)}
                            className="mt-1 w-full h-10 rounded-md border border-slate-200 px-3 text-sm font-medium bg-white outline-none"
                        >
                            <option value="">Pilih karyawan...</option>
                            {employees.map(e => (
                                <option key={e.id} value={e.id}>{e.profiles?.full_name} — {e.job_title}</option>
                            ))}
                        </select>
                    </div>

                    {selectedEmployee && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 rounded-md p-3">
                            <span>Pangkat saat ini: {currentGrade ? currentGrade.name : '—'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span className="text-primary">{grades.find(g => g.id === targetGradeId)?.name || 'Pilih pangkat tujuan'}</span>
                        </div>
                    )}

                    <div>
                        <Label className="text-[10px] font-semibold text-slate-400 uppercase">Pangkat Tujuan *</Label>
                        <select
                            value={targetGradeId}
                            onChange={e => setTargetGradeId(e.target.value)}
                            className="mt-1 w-full h-10 rounded-md border border-slate-200 px-3 text-sm font-medium bg-white outline-none"
                        >
                            <option value="">Pilih pangkat tujuan...</option>
                            {grades.map(g => (
                                <option key={g.id} value={g.id}>Lv.{g.level} — {g.name} {g.code ? `(${g.code})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal Efektif *</Label>
                        <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="mt-1 h-10 rounded-md" />
                    </div>

                    <div>
                        <Label className="text-[10px] font-semibold text-slate-400 uppercase">Alasan / Justifikasi *</Label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Pencapaian kinerja, masa kerja, tanggung jawab baru, dsb..."
                            rows={3}
                            className="mt-1 w-full text-sm border border-slate-200 rounded-md p-3 font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none"
                        />
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={saving || !employeeId || !targetGradeId || !effectiveDate || !reason.trim()}
                        className="w-full h-11 font-semibold rounded-md bg-primary text-white gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Ajukan Promosi
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function PromotionsClient({ companyId, initialPromotions, initialApprovalRequests, employees, grades }) {
    const { toast, showToast } = useToast()
    const [promotions, setPromotions] = useState(initialPromotions)
    const [approvals, setApprovals] = useState(initialApprovalRequests)
    const [selected, setSelected] = useState(null)
    const [activeTab, setActiveTab] = useState('all')
    const [search, setSearch] = useState('')
    const [processing, setProcessing] = useState(false)
    const [actionNotes, setActionNotes] = useState('')
    const [showNewModal, setShowNewModal] = useState(false)

    const filtered = promotions.filter(p => {
        const matchesTab = activeTab === 'all' || p.status === activeTab
        const empName = p.employee?.profiles?.full_name?.toLowerCase() || ''
        const matchesSearch = !search || empName.includes(search.toLowerCase())
        return matchesTab && matchesSearch
    })

    const selectedApprovalReq = selected
        ? approvals.find(a => a.entity_id === selected.id)
        : null

    const handleApprovalAction = async (stepNumber, status) => {
        if (!selectedApprovalReq) return
        setProcessing(true)
        try {
            const res = await processApprovalStep({
                requestId: selectedApprovalReq.id,
                stepNumber,
                status,
                notes: actionNotes
            })

            setPromotions(prev => prev.map(p => p.id === selected.id ? { ...p, status: res.status } : p))
            setApprovals(prev => prev.map(a => a.id === selectedApprovalReq.id ? { ...a, status: res.status } : a))
            setSelected(prev => prev ? { ...prev, status: res.status } : null)
            setActionNotes('')
            showToast(`Pengajuan berhasil di-${status === 'approved' ? 'setujui' : 'tolak'}.`)
        } catch (err) {
            showToast('Gagal memproses persetujuan: ' + err.message, 'error')
        }
        setProcessing(false)
    }

    return (
        <div className="space-y-6 pb-20">
            <ToastBanner toast={toast} />

            {showNewModal && (
                <NewPromotionModal
                    employees={employees}
                    grades={grades}
                    onClose={() => setShowNewModal(false)}
                    onCreated={(promo) => setPromotions(prev => [promo, ...prev])}
                    showToast={showToast}
                />
            )}

            <div className="flex items-center justify-between flex-wrap gap-4">
                <PageHeader
                    title="Manajemen Naik Pangkat"
                    description="Kelola pengajuan dan validasi berjenjang promosi karyawan."
                />
                <Button onClick={() => setShowNewModal(true)} className="h-10 rounded-md bg-primary text-white font-semibold gap-2 shrink-0">
                    <Plus className="w-4 h-4" /> Ajukan Promosi
                </Button>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
                    {[
                        { id: 'all', label: 'Semua' },
                        { id: 'pending_manager', label: 'Step 1: Atasan' },
                        { id: 'pending_hr', label: 'Step 2: HR Final' },
                        { id: 'approved', label: 'Disetujui' },
                        { id: 'rejected', label: 'Ditolak' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors shrink-0
                                ${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari nama karyawan..."
                        aria-label="Cari nama karyawan"
                        className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                </div>
            </div>

            {/* Main infoleft + inforight */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* ── infoleft: Promotions List ───────────────────────────── */}
                <Card className="lg:col-span-2 rounded-md border border-slate-200 p-4 space-y-3 self-start">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-2">Daftar Pengajuan Promosi</p>

                    {filtered.length === 0 ? (
                        <div className="py-12 text-center">
                            <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-400">Tidak ada pengajuan promosi</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map(item => {
                                const isSelected = selected?.id === item.id
                                const badge = STATUS_BADGES[item.status] || STATUS_BADGES.pending_manager
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelected(item)}
                                        aria-pressed={isSelected}
                                        className={`w-full p-4 rounded-md text-left transition-colors border
                                            ${isSelected
                                                ? 'bg-brand-50 border-primary ring-1 ring-primary/30'
                                                : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md border ${badge.color}`}>
                                                {badge.label}
                                            </span>
                                            <span className="text-[10px] font-semibold text-slate-400">
                                                {new Date(item.effective_date).toLocaleDateString('id-ID')}
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-slate-900 text-sm">{item.employee?.profiles?.full_name}</h4>
                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                            {item.current_grade?.name || '—'} <ArrowRight className="w-3 h-3 shrink-0" /> {item.target_grade?.name}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </Card>

                {/* ── inforight: Detail & Approval ───────────────── */}
                <div className="lg:col-span-3">
                    {selected ? (
                        <Card className="rounded-md border border-slate-200 p-6 space-y-6">
                            <div className="flex items-start justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
                                <div>
                                    <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase rounded-md border ${STATUS_BADGES[selected.status]?.color}`}>
                                        {STATUS_BADGES[selected.status]?.label}
                                    </span>
                                    <h2 className="text-lg font-bold text-slate-900 mt-2">{selected.employee?.profiles?.full_name}</h2>
                                    <p className="text-xs text-slate-500 font-semibold">{selected.employee?.job_title} · {selected.employee?.department}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Tanggal Efektif</p>
                                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                                        {new Date(selected.effective_date).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                                    </p>
                                </div>
                            </div>

                            {/* Grade change */}
                            <div className="flex items-center gap-3 bg-slate-50 rounded-md p-4">
                                <div className="flex-1 text-center">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Pangkat Saat Ini</p>
                                    <p className="text-sm font-bold text-slate-700">{selected.current_grade?.name || '—'}</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-300 shrink-0" />
                                <div className="flex-1 text-center">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Pangkat Tujuan</p>
                                    <p className="text-sm font-bold text-primary">{selected.target_grade?.name}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Alasan / Justifikasi</p>
                                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md font-medium">{selected.reason}</p>
                            </div>

                            {/* Multi-Tier Approval Action */}
                            {selected.status !== 'approved' && selected.status !== 'rejected' && (
                                <div className="bg-brand-50 p-5 rounded-md border border-primary/20 space-y-4">
                                    <p className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-primary" /> Validasi Berjenjang
                                    </p>

                                    <textarea
                                        value={actionNotes}
                                        onChange={e => setActionNotes(e.target.value)}
                                        placeholder="Catatan persetujuan / penolakan (opsional)..."
                                        rows={2}
                                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-medium bg-white outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none"
                                    />

                                    <div className="flex gap-3 flex-wrap">
                                        {selected.status === 'pending_manager' && (
                                            <Button
                                                onClick={() => handleApprovalAction(1, 'approved')}
                                                disabled={processing}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm gap-1.5 rounded-md flex-1"
                                            >
                                                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                Setujui Step 1 (Atasan)
                                            </Button>
                                        )}

                                        {(selected.status === 'pending_hr' || selected.status === 'pending_manager') && (
                                            <Button
                                                onClick={() => handleApprovalAction(2, 'approved')}
                                                disabled={processing}
                                                className="bg-primary hover:bg-primary/90 text-white font-semibold text-sm gap-1.5 rounded-md flex-1"
                                            >
                                                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                {selected.status === 'pending_manager' ? 'Final Approval HR (Override)' : 'Setujui Final (HR)'}
                                            </Button>
                                        )}

                                        <Button
                                            onClick={() => handleApprovalAction(selected.status === 'pending_manager' ? 1 : 2, 'rejected')}
                                            disabled={processing}
                                            variant="outline"
                                            className="border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-sm gap-1.5 rounded-md bg-white"
                                        >
                                            <XCircle className="w-4 h-4" /> Tolak
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {selected.status === 'approved' && (
                                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Pangkat karyawan telah diperbarui otomatis ke {selected.target_grade?.name}.
                                </div>
                            )}
                        </Card>
                    ) : (
                        <Card className="rounded-md border border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
                            <TrendingUp className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-slate-400 font-semibold">Pilih pengajuan promosi di sebelah kiri</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
