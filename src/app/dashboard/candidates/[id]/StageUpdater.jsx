'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STAGE_CONFIG, STAGE_ORDER } from '@/lib/constants/stages'
import { updateStage, updateNotes } from '@/lib/actions/applications'
import { CheckCircle2, Loader2, StickyNote } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function StageUpdater({ application, userRole }) {
    const router = useRouter()
    const [stage, setStage] = useState(application.stage)
    const [notes, setNotes] = useState(application.internal_notes ?? '')
    const [loadingStage, setLoadingStage] = useState(false)
    const [loadingNotes, setLoadingNotes] = useState(false)
    const [savedNotes, setSavedNotes] = useState(false)
    const [stageError, setStageError] = useState('')

    const canEdit = ['hr', 'super_admin', 'hiring_manager', 'boss'].includes(userRole)

    async function handleStageChange(newStage) {
        if (newStage === stage) return
        setStageError('')
        setLoadingStage(true)
        try {
            await updateStage(application.id, newStage)
            setStage(newStage)
            router.refresh()
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

    return (
        <>
            {/* Stage selector */}
            <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Pindah Stage</h3>

                <Select value={stage} onValueChange={handleStageChange} disabled={!canEdit || loadingStage}>
                    <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {STAGE_ORDER.map(s => {
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

                {loadingStage && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" /> Memperbarui stage...
                    </p>
                )}
                {stageError && (
                    <p className="text-xs text-destructive mt-2">{stageError}</p>
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
