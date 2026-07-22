'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Plus, Save, Loader2, ChevronDown, ChevronRight, Lock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const MODULE_LABELS = {
    attendance:   'Kehadiran',
    organization: 'Organisasi',
    hiring:       'Rekrutmen',
    performance:  'Performa',
}

export default function RolesClient({ companyId, initialRoles, allPermissions, myLevel }) {
    const supabase = createClient()
    const [roles, setRoles]           = useState(initialRoles)
    const [selectedRole, setSelected] = useState(initialRoles[0] || null)
    const [saving, setSaving]         = useState(false)
    const [savedMsg, setSavedMsg]     = useState(null)
    const [newRoleName, setNewRoleName] = useState('')
    const [creatingRole, setCreating]  = useState(false)
    const [showNew, setShowNew]        = useState(false)

    // Build permission set for selected role
    const activePerms = useMemo(() => {
        if (!selectedRole) return new Set()
        return new Set(selectedRole.role_permissions?.map(rp => rp.permission_id) || [])
    }, [selectedRole])

    // Group permissions by module
    const grouped = useMemo(() => {
        const map = {}
        for (const p of allPermissions) {
            if (!map[p.module]) map[p.module] = []
            map[p.module].push(p)
        }
        return map
    }, [allPermissions])

    const togglePerm = (permId) => {
        if (selectedRole?.is_system && !selectedRole?.company_id) return // global system roles are read-only

        setSelected(prev => {
            const current = new Set(prev.role_permissions?.map(rp => rp.permission_id) || [])
            if (current.has(permId)) current.delete(permId)
            else current.add(permId)
            return { ...prev, role_permissions: [...current].map(pid => ({ permission_id: pid })) }
        })
    }

    const handleSave = async () => {
        if (!selectedRole) return
        setSaving(true)
        try {
            // Delete existing then re-insert
            await supabase.from('role_permissions').delete().eq('role_id', selectedRole.id)

            const toInsert = [...activePerms].map(pid => ({
                role_id: selectedRole.id,
                permission_id: pid,
            }))

            if (toInsert.length > 0) {
                await supabase.from('role_permissions').insert(toInsert)
            }

            setRoles(prev => prev.map(r => r.id === selectedRole.id ? selectedRole : r))
            setSavedMsg('Hak akses berhasil disimpan!')
            setTimeout(() => setSavedMsg(null), 3000)
        } catch (err) {
            alert('Gagal menyimpan: ' + err.message)
        }
        setSaving(false)
    }

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) return
        setCreating(true)
        try {
            const { data, error } = await supabase.from('roles').insert({
                company_id: companyId,
                name: newRoleName.trim(),
                description: '',
                is_system: false,
                // New custom roles are always at employee level or below
                level: Math.max((myLevel ?? 3) + 1, 4),
            }).select('id, name, description, is_system, company_id, level, role_permissions(permission_id)').single()

            if (error) throw error
            setRoles(prev => [...prev, data])
            setSelected(data)
            setNewRoleName('')
            setShowNew(false)
        } catch (err) {
            alert('Gagal membuat role: ' + err.message)
        }
        setCreating(false)
    }

    const isReadOnly = selectedRole?.is_system && !selectedRole?.company_id

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-primary" /> Manajemen Role & Hak Akses
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Atur hak akses setiap role. Klik role di kiri, centang izin di kanan.
                    </p>
                </div>
                <Button
                    onClick={() => setShowNew(!showNew)}
                    className="bg-primary text-white font-black gap-2 rounded-2xl shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" /> Role Baru
                </Button>
            </div>

            {/* Create role form */}
            {showNew && (
                <Card className="p-5 rounded-2xl border-primary/20 border-2 bg-primary/5">
                    <p className="text-sm font-black text-slate-700 mb-3">Buat Role Perusahaan Baru</p>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newRoleName}
                            onChange={e => setNewRoleName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateRole()}
                            placeholder="Contoh: Supervisor Lapangan"
                            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <Button onClick={handleCreateRole} disabled={creatingRole} className="rounded-xl font-black">
                            {creatingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat'}
                        </Button>
                        <Button onClick={() => setShowNew(false)} variant="outline" className="rounded-xl font-bold">Batal</Button>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ─── Role List ────────────────────────────────────────────────── */}
                <Card className="rounded-3xl border-none shadow-sm p-2 self-start">
                    <div className="space-y-1">
                        {roles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => setSelected(role)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-all
                                    ${selectedRole?.id === role.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'hover:bg-slate-50 text-slate-700'}`}
                            >
                                <div>
                                    <p className={`text-sm font-black ${selectedRole?.id === role.id ? 'text-white' : 'text-slate-800'}`}>
                                        {role.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md
                                            ${selectedRole?.id === role.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            Lv.{role.level ?? '?'}
                                        </span>
                                        {role.is_system && !role.company_id && (
                                            <p className={`text-[10px] font-bold ${selectedRole?.id === role.id ? 'text-white/70' : 'text-slate-400'}`}>
                                                Global
                                            </p>
                                        )}
                                        {role.company_id && !role.is_system && (
                                            <p className={`text-[10px] font-bold ${selectedRole?.id === role.id ? 'text-white/70' : 'text-slate-400'}`}>
                                                Kustom
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {selectedRole?.id === role.id
                                    ? <ChevronRight className="w-4 h-4 text-white/70" />
                                    : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* ─── Permission Matrix ────────────────────────────────────────── */}
                <div className="md:col-span-2 space-y-4">
                    {selectedRole && (
                        <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">{selectedRole.name}</h2>
                                    {isReadOnly && (
                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-600 font-bold">
                                            <Lock className="w-3.5 h-3.5" /> Role sistem global — hanya bisa dibaca
                                        </div>
                                    )}
                                </div>
                                {!isReadOnly && (
                                    <div className="flex items-center gap-3">
                                        {savedMsg && <span className="text-xs text-emerald-600 font-bold">{savedMsg}</span>}
                                        <Button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="bg-primary text-white font-black gap-2 rounded-2xl shadow-lg shadow-primary/20"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Simpan
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {Object.entries(grouped).map(([module, perms]) => (
                                <Card key={module} className="rounded-2xl border-none shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                                        <p className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                            {MODULE_LABELS[module] || module}
                                        </p>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {perms.map(perm => {
                                            const isOn = activePerms.has(perm.id)
                                            return (
                                                <label
                                                    key={perm.id}
                                                    className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors
                                                        ${isReadOnly ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                                                >
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{perm.name}</p>
                                                        <p className="text-[11px] text-slate-400 font-mono">{perm.code}</p>
                                                    </div>
                                                    <div
                                                        onClick={() => !isReadOnly && togglePerm(perm.id)}
                                                        className={`relative w-11 h-6 rounded-full transition-all duration-200 shrink-0
                                                            ${isOn ? 'bg-primary' : 'bg-slate-200'}`}
                                                    >
                                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200
                                                            ${isOn ? 'left-[calc(100%-22px)]' : 'left-0.5'}`}
                                                        />
                                                    </div>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </Card>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
