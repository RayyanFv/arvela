'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { hireCandidate } from '@/lib/actions/applications'
import { UserCheck, Loader2, Sparkles, ClipboardList } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export default function HiringModal({ application }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        department: '',
        jobTitle: application.jobs?.title || '',
        templateId: ''
    })
    const [templates, setTemplates] = useState([])
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        if (open) {
            async function loadTemplates() {
                const { data } = await supabase
                    .from('onboarding_templates')
                    .select('id, name')
                    .order('name')
                setTemplates(data || [])
                if (data?.length > 0) {
                    setFormData(prev => ({ ...prev, templateId: data[0].id }))
                }
            }
            loadTemplates()
        }
    }, [open, supabase])

    async function handleHire() {
        setLoading(true)
        setError('')
        try {
            await hireCandidate({
                applicationId: application.id,
                department: formData.department,
                jobTitle: formData.jobTitle,
                templateId: formData.templateId
            })
            setOpen(false)
            router.refresh()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2 h-10 rounded-md font-semibold">
                        <UserCheck className="w-4 h-4" /> Terima & Jadikan Karyawan
                    </Button>
                }
            />
            <DialogContent className="sm:max-w-[425px] rounded-md">
                <DialogHeader>
                    <div className="w-11 h-11 bg-brand-50 rounded-md flex items-center justify-center mb-3 mx-auto">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <DialogTitle className="text-lg font-bold text-center text-slate-900 tracking-tight">Selamat!</DialogTitle>
                    <DialogDescription className="text-center text-slate-500 font-medium px-4">
                        Anda akan memproses pengerjaan <strong>{application.full_name}</strong> sebagai karyawan baru.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="job_title" className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Posisi Jabatan</Label>
                        <Input
                            id="job_title"
                            value={formData.jobTitle}
                            onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                            placeholder="Contoh: Senior Fullstack Developer"
                            className="h-10 rounded-md font-medium"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="department" className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Departemen / Divisi</Label>
                        <Input
                            id="department"
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                            placeholder="Contoh: Engineering"
                            className="h-10 rounded-md font-medium"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="template" className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Template Onboarding</Label>
                        <select
                            id="template"
                            value={formData.templateId}
                            onChange={e => setFormData({ ...formData, templateId: e.target.value })}
                            className="w-full h-10 rounded-md border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 transition-colors font-medium px-3 text-sm appearance-none outline-none"
                        >
                            <option value="">-- Pilih Template --</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        {templates.length === 0 && (
                            <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                                <ClipboardList className="w-3 h-3" /> Belum ada template. Buat di menu Onboarding.
                            </p>
                        )}
                    </div>
                </div>

                {error && <p className="text-xs text-destructive text-center font-semibold">{error}</p>}

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="rounded-md h-10 font-semibold text-slate-500"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleHire}
                        disabled={loading}
                        className="flex-1 h-10 rounded-md bg-primary text-white font-semibold gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                        Konfirmasi Hiring
                    </Button>
                </DialogFooter>

                <p className="text-[10px] text-center text-slate-400 mt-1 font-medium">
                    Kandidat akan menerima email notifikasi dan akses ke Portal Karyawan segera setelah dikonfirmasi.
                </p>
            </DialogContent>
        </Dialog>
    )
}
