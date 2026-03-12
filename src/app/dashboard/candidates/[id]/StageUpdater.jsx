'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STAGE_CONFIG, STAGE_ORDER } from '@/lib/constants/stages'
import { updateStage, updateNotes, createOfferLetter, getMagicLink } from '@/lib/actions/applications'
import {
    CheckCircle2,
    Loader2,
    StickyNote,
    FileText,
    Send,
    ExternalLink,
    Copy
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ADMIN_ROLES } from '@/lib/constants/roles'

export default function StageUpdater({ application, userRole }) {
    const router = useRouter()
    const [stage, setStage] = useState(application.stage)
    const [notes, setNotes] = useState(application.internal_notes ?? '')
    const [loadingStage, setLoadingStage] = useState(false)
    const [loadingNotes, setLoadingNotes] = useState(false)
    const [savedNotes, setSavedNotes] = useState(false)
    const [stageError, setStageError] = useState('')

    const [newStage, setNewStage] = useState(null)
    const [candidateMessage, setCandidateMessage] = useState('')

    // Offer Letter Data
    const [offerData, setOfferData] = useState({
        salary: '',
        startDate: '',
        expiryDate: '',
        content: ''
    })
    const [lastUpdateSuccess, setLastUpdateSuccess] = useState(false)
    const [mounted, setMounted] = useState(false)
    const supabaseClient = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    const canEdit = ADMIN_ROLES.includes(userRole)

    async function handlePerformUpdate() {
        if (!newStage || newStage === stage) return
        setStageError('')
        setLoadingStage(true)
        try {
            if (newStage === 'offering') {
                if (!offerData.salary || !offerData.startDate) {
                    throw new Error('Gaji dan Tanggal Mulai wajib diisi untuk penawaran.')
                }
                await createOfferLetter({
                    applicationId: application.id,
                    ...offerData,
                    salary: parseFloat(offerData.salary)
                })
            } else {
                await updateStage(application.id, newStage, candidateMessage)
            }
            setStage(newStage)
            setNewStage(null)
            setCandidateMessage('')
            setLastUpdateSuccess(true)
            router.refresh()
            // Reset success message after 10s
            setTimeout(() => setLastUpdateSuccess(false), 10000)
        } catch (err) {
            setStageError(err.message)
        } finally {
            setLoadingStage(false)
        }
    }

    async function handleSaveNotes() {
        setLoadingNotes(true)
        try {
            await updateNotes(application.id, notes)
            setSavedNotes(true)
            setTimeout(() => setSavedNotes(false), 2500)
        } catch {
            //
        } finally {
            setLoadingNotes(false)
        }
    }

    const [showPreview, setShowPreview] = useState(false)

    return (
        <>
            {/* Stage selector */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Update Status Lamaran</h3>
                    {newStage && newStage !== stage && (
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className="text-[10px] font-medium text-primary hover:underline"
                        >
                            {showPreview ? 'Tutup Preview' : 'Preview Email'}
                        </button>
                    )}
                </div>

                {/* Quick Stage Links */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
                    {STAGE_ORDER.filter(s => s !== 'hired').map(s => {
                        const cfg = STAGE_CONFIG[s]
                        const isCurrent = (newStage || stage) === s
                        return (
                            <button
                                key={s}
                                type="button"
                                disabled={!canEdit || loadingStage}
                                onClick={() => { setNewStage(s); setShowPreview(false); }}
                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${isCurrent
                                        ? 'bg-white text-primary border-primary/20 shadow-sm ring-1 ring-primary/10'
                                        : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-white/50'
                                    }`}
                            >
                                {cfg.label}
                            </button>
                        )
                    })}
                </div>

                {mounted ? (
                    <Select value={newStage || stage} onValueChange={(v) => { setNewStage(v); setShowPreview(false); }} disabled={!canEdit || loadingStage}>
                        <SelectTrigger className="h-10 w-full rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STAGE_ORDER.filter(s => s !== 'hired').map(s => {
                                const cfg = STAGE_CONFIG[s]
                                return (
                                    <SelectItem key={s} value={s}>
                                        <span className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                                            {cfg.label}
                                        </span>
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="h-10 w-full rounded-xl border border-input bg-background" />
                )}

                {newStage && newStage !== stage && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {showPreview ? (
                            <div className="mb-4 p-4 border rounded-xl bg-slate-50 text-[11px] space-y-2 border-brand-200">
                                <p className="font-semibold text-primary">Preview Email:</p>
                                <div className="bg-white p-3 border rounded shadow-sm leading-relaxed">
                                    <p>Halo <strong>{application.full_name}</strong>,</p>
                                    <p className="mt-2">Ada kabar baru! Lamaran kamu sebagai <strong>{application.jobs.title}</strong> telah berlanjut ke tahap: <strong>{STAGE_CONFIG[newStage]?.label}</strong>.</p>
                                    {candidateMessage && (
                                        <div className="my-2 p-2 border-l-2 border-brand-500 bg-brand-50 italic">
                                            "{candidateMessage}"
                                        </div>
                                    )}
                                    <p className="mt-2">Pantau terus portal kandidat untuk update selanjutnya.</p>
                                </div>
                            </div>
                        ) : newStage === 'offering' ? (
                            <div className="mb-4 p-4 border rounded-2xl bg-emerald-50/50 border-emerald-100 space-y-4">
                                <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Detail Offer Letter
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Gaji Bulanan</label>
                                        <input
                                            type="number"
                                            value={offerData.salary}
                                            onChange={e => setOfferData({ ...offerData, salary: e.target.value })}
                                            placeholder="Rp"
                                            className="w-full h-9 rounded-xl border border-border bg-white px-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Tgl Mulai Kerja</label>
                                        <input
                                            type="date"
                                            value={offerData.startDate}
                                            onChange={e => setOfferData({ ...offerData, startDate: e.target.value })}
                                            className="w-full h-9 rounded-xl border border-border bg-white px-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Batas Waktu Respon</label>
                                    <input
                                        type="date"
                                        value={offerData.expiryDate}
                                        onChange={e => setOfferData({ ...offerData, expiryDate: e.target.value })}
                                        className="w-full h-9 rounded-xl border border-border bg-white px-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                                <p className="text-[9px] text-emerald-600 font-medium">
                                    *Sistem akan otomatis menggenerate surat digital dan mengirimkan link tanda tangan ke email kandidat.
                                </p>
                            </div>
                        ) : (
                            <div className="mb-3">
                                <label className="text-xs font-medium text-muted-foreground block mb-2">
                                    Pesan untuk kandidat (opsional)
                                </label>
                                <Textarea
                                    value={candidateMessage}
                                    onChange={e => setCandidateMessage(e.target.value)}
                                    placeholder="Tuliskan pesan tambahan yang akan dikirim via email..."
                                    className="text-xs min-h-[80px]"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    *Kandidat akan menerima email notifikasi otomatis terkait perubahan ini.
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                className="flex-1 bg-primary hover:bg-brand-600 text-primary-foreground"
                                onClick={handlePerformUpdate}
                                disabled={loadingStage}
                            >
                                {loadingStage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Konfirmasi Update'}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setNewStage(null); setCandidateMessage(''); }}
                                disabled={loadingStage}
                            >
                                Batal
                            </Button>
                        </div>
                    </div>
                )}

                {lastUpdateSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl animate-in slide-in-from-top-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-emerald-700">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Status Diperbarui!</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[10px] font-black text-emerald-600 hover:bg-emerald-100/50 flex items-center gap-1.5"
                                onClick={async () => {
                                    try {
                                        const link = await getMagicLink({
                                            email: application.email,
                                            type: 'magiclink',
                                            redirectTo: `${window.location.origin}/portal`
                                        })
                                        if (link) {
                                            navigator.clipboard.writeText(link)
                                            alert('Link Portal Kandidat berhasil disalin!')
                                        }
                                    } catch (err) {
                                        alert('Gagal menyalin link: ' + err.message)
                                    }
                                }}
                            >
                                <Copy className="w-3 h-3" /> Salin Link WA
                            </Button>
                        </div>
                        <p className="text-[10px] text-emerald-600/70 mt-1 font-medium italic">
                            Email otomatis dikirim. Gunakan tombol "Salin Link" jika ingin update via WhatsApp.
                        </p>
                    </div>
                )}

                {stageError && (
                    <p className="text-xs text-destructive mt-1 font-medium">{stageError}</p>
                )}
            </div>

            {/* Internal notes */}
            <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-muted-foreground" />
                    Catatan Internal
                </h3>
                <p className="text-xs text-muted-foreground mb-3">Hanya terlihat oleh tim HR. Tidak dikirim ke kandidat.</p>

                <Textarea
                    value={notes}
                    onChange={e => { setNotes(e.target.value); setSavedNotes(false) }}
                    placeholder="Tuliskan catatan tentang kandidat ini..."
                    className="min-h-[100px] resize-y text-sm mb-3"
                    disabled={!canEdit}
                />

                {canEdit && (
                    <Button
                        size="sm"
                        className="w-full bg-primary hover:bg-brand-600 text-primary-foreground"
                        onClick={handleSaveNotes}
                        disabled={loadingNotes}
                    >
                        {loadingNotes ? (
                            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Menyimpan...</>
                        ) : savedNotes ? (
                            <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Tersimpan</>
                        ) : (
                            'Simpan Catatan'
                        )}
                    </Button>
                )}
            </div>
        </>
    )
}
