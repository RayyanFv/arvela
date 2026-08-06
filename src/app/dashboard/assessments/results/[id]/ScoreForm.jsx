'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAssignmentScore } from '@/lib/actions/assessments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ShieldCheck, Trophy, Loader2 } from 'lucide-react'

/**
 * Client island for the interactive scoring form. Everything else on the
 * results page is server-rendered — this is the only part that needs state.
 */
export function ScoreInputsCard({ assignmentId, initialPoints, initialNotes }) {
    const router = useRouter()
    const [points, setPoints] = useState(initialPoints)
    const [notes, setNotes] = useState(initialNotes)
    const [saving, setSaving] = useState(false)

    async function handleSubmitScore() {
        setSaving(true)
        try {
            await updateAssignmentScore({
                assignment_id: assignmentId,
                points: Number(points),
                notes
            })
            router.refresh()
            alert('Hasil penilaian berhasil diperbarui!')
        } catch (err) {
            alert(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-slate-900 rounded-md p-6 text-white space-y-6">
            <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" /> Penilaian Final
                </h3>
                <div className="flex items-baseline gap-3">
                    <Input
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        className="h-16 w-28 rounded-md bg-white/5 border-white/10 text-3xl font-bold text-center focus:ring-primary/20 placeholder:text-white/10"
                    />
                    <div className="text-slate-500 text-4xl font-bold leading-none opacity-30">/</div>
                    <span className="text-xl font-semibold text-slate-500">100</span>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Catatan Peninjauan</Label>
                <Textarea
                    placeholder="Tambahkan feedback untuk kandidat..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-28 rounded-md bg-white/5 border-white/10 text-sm resize-none focus:ring-primary/20 placeholder:text-slate-600"
                />
            </div>

            <Button
                onClick={handleSubmitScore}
                disabled={saving}
                className="w-full h-10 rounded-md font-semibold gap-2"
            >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Simpan Hasil Review
            </Button>
        </div>
    )
}
