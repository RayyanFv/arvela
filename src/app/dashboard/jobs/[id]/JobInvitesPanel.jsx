'use client'

import { useState } from 'react'
import { addJobInvites, removeJobInvite } from '@/lib/actions/job-invites'
import { Button } from '@/components/ui/button'
import { Mail, Plus, Trash2, Loader2, Copy, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ToastBanner } from '@/components/ui/ToastBanner'

export default function JobInvitesPanel({ jobId, companySlug, jobSlug, initialInvites }) {
    const { toast, showToast } = useToast()
    const [invites, setInvites] = useState(initialInvites)
    const [emailsInput, setEmailsInput] = useState('')
    const [saving, setSaving] = useState(false)
    const [removingId, setRemovingId] = useState(null)

    async function handleAdd() {
        const emails = emailsInput.split(/[,\n]/).map(e => e.trim()).filter(Boolean)
        if (emails.length === 0) return
        setSaving(true)
        try {
            await addJobInvites(jobId, emails)
            setEmailsInput('')
            showToast(`${emails.length} undangan ditambahkan.`)
            // Re-fetch not wired to a server action here — reload invites via a light refetch instead.
            window.location.reload()
        } catch (err) {
            showToast(err.message, 'error')
        }
        setSaving(false)
    }

    async function handleRemove(inviteId) {
        setRemovingId(inviteId)
        try {
            await removeJobInvite(inviteId)
            setInvites(prev => prev.filter(i => i.id !== inviteId))
            showToast('Undangan dihapus.')
        } catch (err) {
            showToast(err.message, 'error')
        }
        setRemovingId(null)
    }

    function copyLink(token) {
        const url = `${window.location.origin}/${companySlug}/${jobSlug}?t=${token}`
        navigator.clipboard.writeText(url)
        showToast('Link undangan disalin.')
    }

    return (
        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4">
            <ToastBanner toast={toast} />
            <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-slate-900">Daftar Undangan</h3>
            </div>
            <p className="text-xs text-slate-400 font-medium">
                Setiap email mendapat link personal. Hanya email di daftar ini yang bisa membuka & melamar posisi ini.
            </p>

            <textarea
                value={emailsInput}
                onChange={e => setEmailsInput(e.target.value)}
                placeholder="Masukkan email, satu per baris atau dipisah koma..."
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-md p-3 font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none"
            />
            <Button onClick={handleAdd} disabled={saving || !emailsInput.trim()} className="rounded-md font-semibold gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Tambah Undangan
            </Button>

            {invites.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                    {invites.map(invite => (
                        <div key={invite.id} className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-md">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 truncate">{invite.email}</p>
                                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                    {invite.opened_at ? (
                                        <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Sudah dibuka</>
                                    ) : 'Belum dibuka'}
                                </p>
                            </div>
                            <Button size="icon" variant="ghost" className="w-8 h-8 rounded-md text-slate-400 hover:text-primary shrink-0" onClick={() => copyLink(invite.token)} aria-label="Salin link">
                                <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" disabled={removingId === invite.id} className="w-8 h-8 rounded-md text-slate-400 hover:text-rose-500 shrink-0" onClick={() => handleRemove(invite.id)} aria-label="Hapus undangan">
                                {removingId === invite.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
