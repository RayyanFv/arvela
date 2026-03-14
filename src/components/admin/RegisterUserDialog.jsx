'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { registerUser, getRegisterableRoles } from '@/lib/actions/register-user'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from '@/components/ui/dialog'
import { UserPlus, Loader2, CheckCircle2, Copy, AlertTriangle } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/constants/roles'

export function RegisterUserDialog() {
    const [open, setOpen] = useState(false)
    const [roles, setRoles] = useState([])
    const [isPending, startTransition] = useTransition()
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [copied, setCopied] = useState(false)

    // Form state
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState('')
    const [department, setDepartment] = useState('')
    const [password, setPassword] = useState('')
    const [jobTitle, setJobTitle] = useState('')
    const [applicationId, setApplicationId] = useState('')

    const searchParams = useSearchParams()

    useEffect(() => {
        if (open) {
            getRegisterableRoles().then(setRoles).catch(() => setRoles([]))
            // Reset form
            setResult(null)
            setError(null)
            setEmail('')
            setRole('')
            setDepartment('')
            setPassword('')
            setJobTitle('')
            setApplicationId('')

            // Pre-fill from URL if exists
            const emailParam = searchParams.get('email')
            const nameParam = searchParams.get('full_name')
            const roleParam = searchParams.get('role')
            const deptParam = searchParams.get('department')
            const jobParam = searchParams.get('job_title')
            const appIdParam = searchParams.get('app_id')

            if (emailParam) setEmail(emailParam)
            if (nameParam) setFullName(nameParam)
            if (roleParam) setRole(roleParam)
            if (deptParam) setDepartment(deptParam)
            if (jobParam) setJobTitle(jobParam)
            if (appIdParam) setApplicationId(appIdParam)
        }
    }, [open, searchParams])

    // Auto-open if redirected from candidates
    useEffect(() => {
        if (searchParams.get('email')) {
            setOpen(true)
        }
    }, [searchParams])

    function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        setResult(null)

        startTransition(async () => {
            try {
                const res = await registerUser({
                    email,
                    full_name: fullName,
                    role,
                    department,
                    password,
                    job_title: jobTitle,
                    application_id: applicationId
                })
                setResult(res)
            } catch (err) {
                setError(err.message)
            }
        })
    }

    function handleCopy(text) {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-11 rounded-xl bg-foreground text-background font-black hover:bg-slate-800 gap-2 shadow-lg">
                    <UserPlus className="w-4 h-4" /> Daftarkan Akses Baru
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-0">
                    <DialogTitle className="text-lg font-black">Daftarkan Pengguna Baru</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Pengguna akan otomatis memiliki akses sesuai role yang ditetapkan.
                    </DialogDescription>
                </DialogHeader>

                {result ? (
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3 text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                            <p className="font-bold text-sm">{result.message}</p>
                        </div>
                        {result.resetUrl && (
                            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                                <p className="text-xs font-bold text-slate-500">Link Reset Password (kirim ke user):</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        value={result.resetUrl}
                                        readOnly
                                        className="flex-1 text-xs bg-white rounded-lg px-3 py-2 border border-slate-200 font-mono truncate"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-lg shrink-0"
                                        onClick={() => handleCopy(result.resetUrl)}
                                    >
                                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        )}
                        <Button onClick={() => setOpen(false)} className="w-full rounded-xl font-bold">
                            Selesai
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 rounded-xl px-4 py-3 text-xs font-bold">
                                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Nama Lengkap</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="Contoh: Budi Santoso"
                                className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="email@perusahaan.com"
                                className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Role / Hak Akses</label>
                            <select
                                required
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                            >
                                <option value="">Pilih Role...</option>
                                {roles.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Departemen <span className="text-slate-300">(opsional)</span></label>
                            <input
                                type="text"
                                value={department}
                                onChange={e => setDepartment(e.target.value)}
                                placeholder="Contoh: Engineering"
                                className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Password <span className="text-slate-300">(kosongkan untuk acak)</span></label>
                            <input
                                type="text"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min. 6 karakter"
                                className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-12 rounded-xl font-black text-sm gap-2"
                        >
                            {isPending ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Mendaftarkan...</>
                            ) : (
                                <><UserPlus className="w-4 h-4" /> Daftarkan Pengguna</>
                            )}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
