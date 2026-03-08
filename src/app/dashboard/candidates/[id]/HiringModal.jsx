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
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2 h-11 rounded-xl shadow-lg ring-offset-background transition-all active:scale-95">
                        <UserCheck className="w-4 h-4" /> Terima & Jadikan Karyawan
                    </Button>
                }
            />
            <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-brand-400 to-primary" />
                <DialogHeader className="pt-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                        <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-black text-center text-slate-900 tracking-tight">Selamat!</DialogTitle>
                    <DialogDescription className="text-center text-slate-500 font-medium px-4">
                        Anda akan memproses pengerjaan <strong>{application.full_name}</strong> sebagai karyawan baru.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                        <Label htmlFor="job_title" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Posisi Jabatan</Label>
                        <Input
                            id="job_title"
                            value={formData.jobTitle}
                            onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                            placeholder="Contoh: Senior Fullstack Developer"
                            className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-semibold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="department" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Departemen / Divisi</Label>
                        <Input
                            id="department"
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                            placeholder="Contoh: Engineering"
                            className="h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-semibold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="template" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Template Onboarding</Label>
                        <select
                            id="template"
                            value={formData.templateId}
                            onChange={e => setFormData({ ...formData, templateId: e.target.value })}
                            className="w-full h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-semibold px-4 text-sm appearance-none outline-none"
                        >
                            <option value="">-- Pilih Template --</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        {templates.length === 0 && (
                            <p className="text-[10px] text-amber-600 font-bold ml-1 flex items-center gap-1">
                                <ClipboardList className="w-3 h-3" /> Belum ada template. Buat di menu Onboarding.
                            </p>
                        )}
                    </div>
                </div>

                {error && <p className="text-xs text-destructive text-center font-bold animate-shake">{error}</p>}

                <DialogFooter className="flex-col sm:flex-row gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="rounded-2xl h-12 font-bold text-slate-500"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleHire}
                        disabled={loading}
                        className="flex-1 h-12 rounded-2xl bg-primary text-white font-black text-lg gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCheck className="w-5 h-5" />}
                        Konfirmasi Hiring
                    </Button>
                </DialogFooter>

                <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                    Kandidat akan menerima email notifikasi dan akses ke Portal Karyawan segera setelah dikonfirmasi.
                </p>
            </DialogContent>
        </Dialog>
    )
}
