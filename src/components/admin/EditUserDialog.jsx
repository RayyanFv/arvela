'use client'

import { useState, useEffect, useTransition } from 'react'
import { updateUser, getRegisterableRoles } from '@/lib/actions/register-user'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from '@/components/ui/dialog'
import { Pencil, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

export function EditUserDialog({ targetUser, onSaved }) {
    const [open, setOpen] = useState(false)
    const [roles, setRoles] = useState([])
    const [units, setUnits] = useState([])
    const [grades, setGrades] = useState([])
    const [contractTypes, setContractTypes] = useState([])
    const [managers, setManagers] = useState([])
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    // Form state
    const [fullName, setFullName] = useState(targetUser.full_name || '')
    const [role, setRole] = useState(targetUser.role || '')
    const [jobTitle, setJobTitle] = useState('')
    const [homeUnitId, setHomeUnitId] = useState('')
    const [workUnitId, setWorkUnitId] = useState('')
    const [jobGradeId, setJobGradeId] = useState('')
    const [contractTypeId, setContractTypeId] = useState('')
    const [managerId, setManagerId] = useState('')

    const supabase = createClient()

    useEffect(() => {
        if (open) {
            getRegisterableRoles().then((data) => {
                setRoles(data.roles || [])
                setUnits(data.units || [])
                setGrades(data.grades || [])
                setContractTypes(data.contractTypes || [])
                setManagers(data.managers || [])
            }).catch(() => {})

            // Fetch existing employee details for targetUser
            supabase
                .from('employees')
                .select('job_title, home_unit_id, work_unit_id, job_grade_id, contract_type_id, manager_id')
                .eq('profile_id', targetUser.id)
                .maybeSingle()
                .then(({ data: emp }) => {
                    if (emp) {
                        setJobTitle(emp.job_title || '')
                        setHomeUnitId(emp.home_unit_id || '')
                        setWorkUnitId(emp.work_unit_id || '')
                        setJobGradeId(emp.job_grade_id || '')
                        setContractTypeId(emp.contract_type_id || '')
                        setManagerId(emp.manager_id || '')
                    }
                })

            setError(null)
            setSuccess(false)
        }
    }, [open, targetUser])

    function handleSubmit(e) {
        e.preventDefault()
        setError(null)

        startTransition(async () => {
            try {
                await updateUser({
                    profile_id: targetUser.id,
                    full_name: fullName,
                    role,
                    job_title: jobTitle,
                    home_unit_id: homeUnitId || null,
                    work_unit_id: workUnitId || homeUnitId || null,
                    job_grade_id: jobGradeId || null,
                    contract_type_id: contractTypeId || null,
                    manager_id: managerId || null,
                })
                setSuccess(true)
                if (onSaved) onSaved()
                setTimeout(() => setOpen(false), 1200)
            } catch (err) {
                setError(err.message)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-xl border-slate-200 text-slate-700 font-bold gap-1.5 hover:bg-slate-50">
                    <Pencil className="w-3.5 h-3.5" /> Edit User
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                    <DialogTitle className="text-lg font-black">Edit Data Pengguna</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Ubah role, unit kerja, pangkat, dan atasan langsung untuk {targetUser.full_name}.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="p-6 text-center space-y-3">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                        <p className="font-extrabold text-sm text-slate-800">Data pengguna berhasil diperbarui!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                        {error && (
                            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 rounded-xl px-4 py-3 text-xs font-bold">
                                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                Nama Lengkap *
                            </label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Role / Hak Akses
                                </label>
                                <select
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white text-slate-900"
                                >
                                    <option value="">Pilih Role...</option>
                                    {(roles.length > 0 ? roles : [{ value: 'employee', label: 'Karyawan (ESS Portal)' }]).map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Pangkat / Golongan
                                </label>
                                <select
                                    value={jobGradeId}
                                    onChange={e => setJobGradeId(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                                >
                                    <option value="">— Pilih Pangkat —</option>
                                    {grades.map(g => (
                                        <option key={g.id} value={g.id}>
                                            Lv.{g.level} - {g.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Tipe Kontrak
                                </label>
                                <select
                                    value={contractTypeId}
                                    onChange={e => setContractTypeId(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                                >
                                    <option value="">— Pilih Tipe Kontrak —</option>
                                    {contractTypes.map(ct => (
                                        <option key={ct.id} value={ct.id}>
                                            {ct.code ? `${ct.code} - ` : ''}{ct.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Homebase (Unit Asal)
                                </label>
                                <select
                                    value={homeUnitId}
                                    onChange={e => setHomeUnitId(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
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
                                    Unit Penugasan
                                </label>
                                <select
                                    value={workUnitId}
                                    onChange={e => setWorkUnitId(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
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
                                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">
                                    Atasan Langsung (Direct Manager)
                                </label>
                                <select
                                    value={managerId}
                                    onChange={e => setManagerId(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                                >
                                    <option value="">— Otomatis Ikut Kepala Unit Kerja —</option>
                                    {managers.filter(m => m.id !== targetUser.id).map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.full_name} ({m.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-12 rounded-xl font-black text-sm gap-2 mt-4 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                        >
                            {isPending ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                            ) : (
                                <>Simpan Perubahan</>
                            )}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
