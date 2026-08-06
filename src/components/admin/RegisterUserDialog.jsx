'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { registerUser, getRegisterableRoles } from '@/lib/actions/register-user'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from '@/components/ui/dialog'
import { UserPlus, Loader2, CheckCircle2, Copy, AlertTriangle } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/constants/roles'

export function RegisterUserDialog() {
    const [open, setOpen] = useState(false)
    const [roles, setRoles] = useState([])
    const [companies, setCompanies] = useState([])
    const [units, setUnits] = useState([])
    const [grades, setGrades] = useState([])
    const [contractTypes, setContractTypes] = useState([])
    const [managers, setManagers] = useState([])
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [copied, setCopied] = useState(false)

    // Form state
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState('')
    const [companyId, setCompanyId] = useState('')
    const [jobTitle, setJobTitle] = useState('')
    const [homeUnitId, setHomeUnitId] = useState('')
    const [workUnitId, setWorkUnitId] = useState('')
    const [jobGradeId, setJobGradeId] = useState('')
    const [contractTypeId, setContractTypeId] = useState('')
    const [managerId, setManagerId] = useState('')
    const [password, setPassword] = useState('')
    const [applicationId, setApplicationId] = useState('')

    const searchParams = useSearchParams()

    useEffect(() => {
        if (open) {
            getRegisterableRoles().then((data) => {
                setRoles(data.roles || [])
                setCompanies(data.companies || [])
                setUnits(data.units || [])
                setGrades(data.grades || [])
                setContractTypes(data.contractTypes || [])
                setManagers(data.managers || [])
                setIsSuperAdmin(data.isSuperAdmin || false)
            }).catch(() => {
                setRoles([])
                setCompanies([])
                setUnits([])
                setGrades([])
                setContractTypes([])
                setManagers([])
            })
            // Reset form
            setResult(null)
            setError(null)
            setEmail('')
            setFullName('')
            setRole('')
            setCompanyId('')
            setJobTitle('')
            setHomeUnitId('')
            setWorkUnitId('')
            setJobGradeId('')
            setContractTypeId('')
            setPassword('')
            setApplicationId('')

            // Pre-fill from URL if exists
            const emailParam = searchParams.get('email')
            const nameParam = searchParams.get('full_name')
            const roleParam = searchParams.get('role')
            const jobParam = searchParams.get('job_title')
            const appIdParam = searchParams.get('app_id')

            if (emailParam) setEmail(emailParam)
            if (nameParam) setFullName(nameParam)
            if (roleParam) setRole(roleParam)
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
                    company_id: companyId,
                    job_title: jobTitle,
                    home_unit_id: homeUnitId || null,
                    work_unit_id: workUnitId || homeUnitId || null,
                    job_grade_id: jobGradeId || null,
                    contract_type_id: contractTypeId || null,
                    manager_id: managerId || null,
                    password,
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

            <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                    <DialogTitle className="text-lg font-black">Daftarkan Pengguna / Karyawan Baru</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Pengguna akan otomatis memiliki akun, hak akses role, unit kerja, dan jenjang pangkat.
                    </DialogDescription>
                </DialogHeader>

                {result ? (
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3 text-emerald-600">
                            <CheckCircle2 className="w-6 h-6 shrink-0" />
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
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                        {error && (
                            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 rounded-xl px-4 py-3 text-xs font-bold">
                                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Nama Lengkap <span className="text-rose-500">*</span>
                                </label>
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
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Email <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="email@perusahaan.com"
                                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Role / System Access <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white text-slate-900"
                                >
                                    <option value="">Pilih Role...</option>
                                    {(roles.length > 0 ? roles : [{ value: 'employee', label: 'Karyawan (ESS Portal)' }]).map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            {isSuperAdmin ? (
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                        Perusahaan Tujuan <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={companyId}
                                        onChange={e => setCompanyId(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                                    >
                                        <option value="">Pilih Perusahaan...</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                        Pangkat / Golongan Struktural
                                    </label>
                                    <select
                                        value={jobGradeId}
                                        onChange={e => setJobGradeId(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                                    >
                                        <option value="">— Pilih Pangkat (Opsional) —</option>
                                        {grades.map(g => (
                                            <option key={g.id} value={g.id}>
                                                Lv.{g.level} - {g.name} {g.code ? `(${g.code})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {!isSuperAdmin && (
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Tipe Kontrak <span className="text-slate-300">(opsional)</span>
                                </label>
                                <select
                                    value={contractTypeId}
                                    onChange={e => setContractTypeId(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                                >
                                    <option value="">— Pilih Tipe Kontrak —</option>
                                    {contractTypes.map(ct => (
                                        <option key={ct.id} value={ct.id}>
                                            {ct.code ? `${ct.code} - ` : ''}{ct.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Additional fields for Employee role or standard user */}
                        <div className="pt-2 border-t border-slate-100 space-y-4">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                Struktur Organisasi & Jabatan Fungsional
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                        Homebase (Unit Asal)
                                    </label>
                                    <select
                                        value={homeUnitId}
                                        onChange={e => {
                                            setHomeUnitId(e.target.value)
                                            if (!workUnitId) setWorkUnitId(e.target.value)
                                        }}
                                        className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                                    >
                                        <option value="">— Pilih Unit Asal —</option>
                                        {units.map(u => (
                                            <option key={u.id} value={u.id}>
                                                [{u.levelLabel}] {u.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                        Unit Penugasan (Lokasi Kerja)
                                    </label>
                                    <select
                                        value={workUnitId}
                                        onChange={e => setWorkUnitId(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                                    >
                                        <option value="">— Samakan dengan Homebase —</option>
                                        {units.map(u => (
                                            <option key={u.id} value={u.id}>
                                                [{u.levelLabel}] {u.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                        Jabatan Fungsional
                                    </label>
                                    <input
                                        type="text"
                                        value={jobTitle}
                                        onChange={e => setJobTitle(e.target.value)}
                                        placeholder="Contoh: Senior Backend Engineer"
                                        className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                        Atasan Langsung (Direct Manager)
                                    </label>
                                    <select
                                        value={managerId}
                                        onChange={e => setManagerId(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                                    >
                                        <option value="">— Otomatis Ikut Kepala Unit Kerja —</option>
                                        {managers.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.full_name} ({m.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {isSuperAdmin && (
                                <>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                            Pangkat / Golongan Struktural
                                        </label>
                                        <select
                                            value={jobGradeId}
                                            onChange={e => setJobGradeId(e.target.value)}
                                            className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                                        >
                                            <option value="">— Pilih Pangkat —</option>
                                            {grades.map(g => (
                                                <option key={g.id} value={g.id}>
                                                    Lv.{g.level} - {g.name} {g.code ? `(${g.code})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                            Tipe Kontrak
                                        </label>
                                        <select
                                            value={contractTypeId}
                                            onChange={e => setContractTypeId(e.target.value)}
                                            className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                                        >
                                            <option value="">— Pilih Tipe Kontrak —</option>
                                            {contractTypes.map(ct => (
                                                <option key={ct.id} value={ct.id}>
                                                    {ct.code ? `${ct.code} - ` : ''}{ct.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Password Initial <span className="text-slate-300">(opsional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Kosongkan untuk kata sandi acak"
                                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-12 rounded-xl font-black text-sm gap-2 mt-4 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
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
