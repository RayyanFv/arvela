'use client'

import { useState } from 'react'
import { processApprovalStep } from '@/lib/actions/approval-engine'
import { updateOffboardingChecklist } from '@/lib/actions/offboarding'
import {
    UserX, CheckCircle2, Clock, XCircle, FileText, CheckSquare,
    Loader2, Search, ArrowRight, ShieldCheck, ChevronRight, User
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { useToast } from '@/hooks/use-toast'
import { ToastBanner } from '@/components/ui/ToastBanner'

const STATUS_BADGES = {
    pending_manager: { label: 'Step 1: Menunggu Atasan', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    pending_hr:      { label: 'Step 2: Menunggu HR Final', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    approved:        { label: 'Disetujui Final', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    rejected:        { label: 'Ditolak', color: 'bg-rose-50 text-rose-600 border-rose-200' },
    completed:       { label: 'Selesai (Offboarded)', color: 'bg-purple-50 text-purple-600 border-purple-200' },
}

export default function OffboardingClient({ companyId, initialOffboardings, initialApprovalRequests }) {
    const { toast, showToast } = useToast()
    const [offboardings, setOffboardings] = useState(initialOffboardings)
    const [approvals, setApprovals] = useState(initialApprovalRequests)
    const [selected, setSelected] = useState(null)
    const [activeTab, setActiveTab] = useState('all')
    const [search, setSearch] = useState('')
    const [processing, setProcessing] = useState(false)
    const [actionNotes, setActionNotes] = useState('')
    const [togglingAsset, setTogglingAsset] = useState(null)

    const filtered = offboardings.filter(o => {
        const matchesTab = activeTab === 'all' || o.status === activeTab
        const empName = o.employee?.profiles?.full_name?.toLowerCase() || ''
        const matchesSearch = !search || empName.includes(search.toLowerCase())
        return matchesTab && matchesSearch
    })

    // Find approval request for selected offboarding
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

            // Update state
            setOffboardings(prev => prev.map(o => o.id === selected.id ? { ...o, status: res.status } : o))
            setApprovals(prev => prev.map(a => a.id === selectedApprovalReq.id ? { ...a, status: res.status } : a))
            setSelected(prev => prev ? { ...prev, status: res.status } : null)
            setActionNotes('')
            showToast(`Pengajuan berhasil di-${status === 'approved' ? 'setujui' : 'tolak'}.`)
        } catch (err) {
            showToast('Gagal memproses persetujuan: ' + err.message, 'error')
        }
        setProcessing(false)
    }

    const handleToggleAsset = async (itemIndex) => {
        if (!selected) return
        const currentChecklist = Array.isArray(selected.asset_checklist) ? [...selected.asset_checklist] : []
        if (currentChecklist[itemIndex]) {
            currentChecklist[itemIndex].returned = !currentChecklist[itemIndex].returned
        }
        setTogglingAsset(itemIndex)
        try {
            const updated = await updateOffboardingChecklist({
                offboarding_id: selected.id,
                asset_checklist: currentChecklist
            })
            setSelected(updated)
            setOffboardings(prev => prev.map(o => o.id === selected.id ? updated : o))
        } catch (err) {
            showToast(err.message, 'error')
        }
        setTogglingAsset(null)
    }

    return (
        <div className="space-y-6 pb-20">
            <ToastBanner toast={toast} />

            <PageHeader
                title="Manajemen Resign & Offboarding"
                description="Kelola validasi berjenjang pengajuan resign, serah terima pekerjaan, dan checklist pengembalian aset."
            />

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

                {/* ── infoleft: Offboardings List ───────────────────────────── */}
                <Card className="lg:col-span-2 rounded-md border border-slate-200 p-4 space-y-3 self-start">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-2">Daftar Pengajuan Resign</p>

                    {filtered.length === 0 ? (
                        <div className="py-12 text-center">
                            <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-400">Tidak ada pengajuan resign</p>
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
                                                LWD: {new Date(item.effective_date).toLocaleDateString('id-ID')}
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-slate-900 text-sm">{item.employee?.profiles?.full_name}</h4>
                                        <p className="text-xs text-slate-500 font-medium">{item.employee?.job_title}</p>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </Card>

                {/* ── inforight: Offboarding Detail & Approval ───────────────── */}
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
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Tanggal Efektif (LWD)</p>
                                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                                        {new Date(selected.effective_date).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                                    </p>
                                </div>
                            </div>

                            {/* Alasan & Handover */}
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Alasan Resign</p>
                                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md font-medium">{selected.reason}</p>
                                </div>
                                {selected.handover_notes && (
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Catatan Serah Terima Tugas</p>
                                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md font-medium">{selected.handover_notes}</p>
                                    </div>
                                )}
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

                            {/* Asset Checklist */}
                            <div className="space-y-3 pt-2">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Checklist Pengembalian Aset (Inventaris)</p>
                                <div className="space-y-2">
                                    {Array.isArray(selected.asset_checklist) && selected.asset_checklist.map((asset, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleToggleAsset(idx)}
                                            disabled={togglingAsset === idx}
                                            aria-pressed={!!asset.returned}
                                            className={`w-full flex items-center justify-between p-3 rounded-md text-left border transition-colors disabled:opacity-60
                                                ${asset.returned ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
                                        >
                                            <span className={`text-sm font-semibold ${asset.returned ? 'text-emerald-800 line-through' : 'text-slate-700'}`}>
                                                {asset.item}
                                            </span>
                                            {togglingAsset === idx ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                            ) : (
                                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase ${
                                                    asset.returned ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                                                }`}>
                                                    {asset.returned ? 'Sudah Dikembalikan' : 'Belum'}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="rounded-md border border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
                            <UserX className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-slate-400 font-semibold">Pilih pengajuan resign di sebelah kiri</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
