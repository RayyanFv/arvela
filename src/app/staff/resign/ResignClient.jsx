'use client'

import { useState } from 'react'
import { submitResignation } from '@/lib/actions/offboarding'
import {
    UserX, Calendar, FileText, CheckCircle2, Clock, XCircle,
    ArrowLeft, ShieldCheck, AlertCircle, Loader2, CheckSquare
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ResignClient({ employee, initialOffboardings, approvalRequests }) {
    const [offboardings, setOffboardings] = useState(initialOffboardings)
    const [submitting, setSubmitting] = useState(false)
    const [effectiveDate, setEffectiveDate] = useState('')
    const [reason, setReason] = useState('')
    const [handoverNotes, setHandoverNotes] = useState('')

    const latestOffboarding = offboardings[0] || null

    // Find approval request for latest offboarding
    const latestApproval = latestOffboarding
        ? approvalRequests.find(a => a.entity_id === latestOffboarding.id)
        : null

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!effectiveDate || !reason) {
            alert('Tanggal efektif (LWD) dan alasan wajib diisi.')
            return
        }

        setSubmitting(true)
        try {
            const newRes = await submitResignation({
                employee_id: employee.id,
                effective_date: effectiveDate,
                reason,
                handover_notes: handoverNotes,
            })
            setOffboardings([newRes, ...offboardings])
            alert('Pengajuan resign berhasil dikirim untuk proses validasi berjenjang.')
        } catch (err) {
            alert(err.message)
        }
        setSubmitting(false)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-4">
            <div className="flex items-center justify-between">
                <Link href="/staff">
                    <Button variant="ghost" className="rounded-xl font-bold text-xs gap-2 text-slate-500">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Workspace
                    </Button>
                </Link>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Portal Resign Mandiri</span>
            </div>

            <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl -z-10" />
                <h1 className="text-3xl font-black tracking-tight">Pengajuan Resign & Offboarding</h1>
                <p className="text-slate-400 text-sm font-medium mt-1">
                    Halo {employee.profiles?.full_name}, ajukan tanggal efektif resign dan pantau tahapan persetujuan berjenjang secara real-time.
                </p>
            </div>

            {/* Active Resignation Status Tracker */}
            {latestOffboarding ? (
                <Card className="rounded-3xl border-none shadow-sm p-7 space-y-6 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Pengajuan Anda</p>
                            <h3 className="text-lg font-black text-slate-900 mt-0.5">
                                Resign Efektif: {new Date(latestOffboarding.effective_date).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                            </h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            latestOffboarding.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            latestOffboarding.status === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                            'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                            {latestOffboarding.status === 'pending_manager' ? 'Step 1: Menunggu Atasan' :
                             latestOffboarding.status === 'pending_hr' ? 'Step 2: Menunggu HR Final' :
                             latestOffboarding.status === 'approved' ? 'Disetujui Final' : 'Ditolak'}
                        </span>
                    </div>

                    {/* Timeline Tracker Step 1 & Step 2 */}
                    <div className="space-y-4">
                        <p className="text-xs font-black text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-primary" /> Progress Validasi Berjenjang
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Step 1: Manager */}
                            <div className={`p-4 rounded-2xl border space-y-2 ${
                                latestOffboarding.status === 'pending_manager' ? 'bg-amber-50/50 border-amber-200' :
                                latestOffboarding.status === 'pending_hr' || latestOffboarding.status === 'approved' ? 'bg-emerald-50/50 border-emerald-200' :
                                'bg-slate-50 border-slate-200'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Langkah 1</span>
                                    {latestOffboarding.status === 'pending_manager' ? (
                                        <Clock className="w-4 h-4 text-amber-500" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    )}
                                </div>
                                <h4 className="font-extrabold text-slate-900 text-xs">Persetujuan Atasan Langsung</h4>
                                <p className="text-[11px] text-slate-500 font-medium">
                                    {latestOffboarding.status === 'pending_manager' ? 'Sedang ditinjau oleh Atasan / Kepala Unit Kerja.' : 'Telah disetujui Atasan Langsung.'}
                                </p>
                            </div>

                            {/* Step 2: HR Admin */}
                            <div className={`p-4 rounded-2xl border space-y-2 ${
                                latestOffboarding.status === 'pending_hr' ? 'bg-blue-50/50 border-blue-200' :
                                latestOffboarding.status === 'approved' ? 'bg-emerald-50/50 border-emerald-200' :
                                'bg-slate-50 border-slate-200'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Langkah 2</span>
                                    {latestOffboarding.status === 'approved' ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : latestOffboarding.status === 'pending_hr' ? (
                                        <Clock className="w-4 h-4 text-blue-500" />
                                    ) : (
                                        <Clock className="w-4 h-4 text-slate-300" />
                                    )}
                                </div>
                                <h4 className="font-extrabold text-slate-900 text-xs">Persetujuan Final HR Admin</h4>
                                <p className="text-[11px] text-slate-500 font-medium">
                                    {latestOffboarding.status === 'approved' ? 'Disetujui final oleh HR Admin & Owner.' : 'Menunggu verifikasi akhir dari HR Admin.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Asset Return Checklist */}
                    <div className="space-y-3 pt-2">
                        <p className="text-xs font-black text-slate-900 flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-primary" /> Checklist Serah Terima & Aset
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Array.isArray(latestOffboarding.asset_checklist) && latestOffboarding.asset_checklist.map((item, i) => (
                                <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">{item.item}</span>
                                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase ${
                                        item.returned ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {item.returned ? 'Dikembalikan' : 'Pending'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            ) : (
                /* Form Submission */
                <Card className="rounded-3xl border-none shadow-sm p-8 bg-white">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Form Pengajuan Resign</h3>
                            <p className="text-xs text-slate-500 font-medium">Isi tanggal hari terakhir bekerja (LWD) dan alasan pengajuan.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                                    Tanggal Hari Terakhir Bekerja (Last Working Day / LWD) *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={effectiveDate}
                                    onChange={e => setEffectiveDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                                    Alasan Resign *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="Jelaskan alasan pengajuan resign Anda..."
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                                    Catatan Serah Terima Tugas & Dokumen (Handover Notes)
                                </label>
                                <textarea
                                    rows={3}
                                    value={handoverNotes}
                                    onChange={e => setHandoverNotes(e.target.value)}
                                    placeholder="Tuliskan daftar tugas atau dokumen yang diserahkan ke tim..."
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm gap-2 shadow-lg shadow-rose-600/20"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                            Kirim Pengajuan Resign
                        </Button>
                    </form>
                </Card>
            )}
        </div>
    )
}
