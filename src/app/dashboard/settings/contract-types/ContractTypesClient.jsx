'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ToastBanner } from '@/components/ui/ToastBanner'
import { FileText, Plus, Save, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ContractTypesClient({ companyId, initialContractTypes }) {
    const supabase = createClient()
    const { toast, showToast } = useToast()
    const [contractTypes, setContractTypes] = useState(initialContractTypes)
    const [selected, setSelected] = useState(null)
    const [mode, setMode] = useState('view') // view | edit | create
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const emptyForm = { name: '', code: '', description: '' }
    const [form, setForm] = useState(emptyForm)

    const openCreate = () => {
        setForm(emptyForm)
        setSelected(null)
        setMode('create')
    }

    const openEdit = (ct) => {
        setForm({
            name: ct.name || '',
            code: ct.code || '',
            description: ct.description || '',
        })
        setMode('edit')
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = {
                company_id: companyId,
                name: form.name.trim(),
                code: form.code.trim() || null,
                description: form.description.trim() || null,
            }

            if (mode === 'create') {
                const { data, error } = await supabase.from('contract_types').insert(payload).select('*').single()
                if (error) throw error
                setContractTypes(prev => [...prev, data])
                setSelected(data)
                showToast('Tipe kontrak berhasil ditambahkan.')
            } else if (mode === 'edit' && selected) {
                const { data, error } = await supabase.from('contract_types').update(payload).eq('id', selected.id).select('*').single()
                if (error) throw error
                setContractTypes(prev => prev.map(ct => ct.id === data.id ? data : ct))
                setSelected(data)
                showToast('Perubahan berhasil disimpan.')
            }
            setMode('view')
        } catch (err) {
            showToast('Gagal menyimpan: ' + err.message, 'error')
        }
        setSaving(false)
    }

    const handleDelete = async () => {
        if (!selected) return
        if (!confirm(`Hapus tipe kontrak "${selected.name}"? Karyawan yang memiliki tipe ini akan kehilangan relasi.`)) return
        setDeleting(true)
        const { error } = await supabase.from('contract_types').delete().eq('id', selected.id)
        if (error) showToast(error.message, 'error')
        else {
            setContractTypes(prev => prev.filter(ct => ct.id !== selected.id))
            setSelected(null)
            setMode('view')
            showToast('Tipe kontrak dihapus.')
        }
        setDeleting(false)
    }

    return (
        <div className="space-y-6 pb-20">
            <ToastBanner toast={toast} />

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" /> Manajemen Tipe Kontrak
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Kelola data master status hubungan kerja (PKWT, PKWTT, dsb) untuk di-mapping ke karyawan.
                    </p>
                </div>
                <Button onClick={openCreate} className="bg-primary text-white font-semibold gap-2 rounded-md">
                    <Plus className="w-4 h-4" /> Tambah Tipe Kontrak
                </Button>
            </div>

            {/* Main infoleft + inforight */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* ── infoleft: List ────────────────────────────────── */}
                <Card className="lg:col-span-2 rounded-md border border-slate-200 p-3 self-start">
                    <div className="px-3 py-2 mb-2">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Tipe Kontrak Terdaftar</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{contractTypes.length} tipe</p>
                    </div>

                    {contractTypes.length === 0 ? (
                        <div className="py-10 text-center">
                            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-400">Belum ada tipe kontrak</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {contractTypes.map(ct => {
                                const isSelected = selected?.id === ct.id
                                return (
                                    <button
                                        key={ct.id}
                                        onClick={() => { setSelected(ct); setMode('view') }}
                                        aria-pressed={isSelected}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors
                                            ${isSelected ? 'bg-primary text-white' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20' : 'bg-brand-50'}`}>
                                            <FileText className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-primary'}`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                                {ct.name}
                                            </p>
                                            {ct.code && (
                                                <p className={`text-[10px] font-mono font-semibold ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                                    {ct.code}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </Card>

                {/* ── inforight: Detail / Form ──────────────────────────────── */}
                <div className="lg:col-span-3 space-y-4">
                    {/* VIEW */}
                    {mode === 'view' && selected && (
                        <Card className="rounded-md border border-slate-200 p-6 space-y-6">
                            <div className="flex items-start justify-between flex-wrap gap-3">
                                <div>
                                    {selected.code && (
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold mb-2 bg-brand-50 text-primary font-mono">
                                            {selected.code}
                                        </div>
                                    )}
                                    <h2 className="text-lg font-bold text-slate-900">{selected.name}</h2>
                                    {selected.description && (
                                        <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">{selected.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button onClick={() => openEdit(selected)} variant="outline" size="sm" className="rounded-md gap-1.5 font-semibold">
                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                    </Button>
                                    <Button onClick={handleDelete} disabled={deleting} variant="outline" size="sm"
                                        aria-label="Hapus tipe kontrak"
                                        className="rounded-md gap-1.5 font-semibold text-rose-600 border-rose-200 hover:bg-rose-50">
                                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Empty state */}
                    {mode === 'view' && !selected && (
                        <Card className="rounded-md border border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
                            <FileText className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-slate-400 font-semibold">Pilih tipe kontrak di sebelah kiri</p>
                            <p className="text-xs text-slate-400 mt-1 font-medium">atau klik &quot;Tambah Tipe Kontrak&quot; untuk membuat baru</p>
                        </Card>
                    )}

                    {/* CREATE / EDIT form */}
                    {(mode === 'create' || mode === 'edit') && (
                        <Card className="rounded-md border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-base font-bold text-slate-900">
                                    {mode === 'create' ? 'Tambah Tipe Kontrak Baru' : `Edit Tipe Kontrak: ${selected?.name}`}
                                </h3>
                                <Button variant="ghost" size="icon" className="rounded-md" onClick={() => setMode('view')} aria-label="Tutup">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                            Nama Tipe Kontrak <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="Cth: PKWT (Kontrak)"
                                            className="w-full border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Kode</label>
                                        <input
                                            value={form.code}
                                            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                            placeholder="PKWT, PKWTT..."
                                            className="w-full border border-slate-200 rounded-md px-4 py-2.5 text-sm font-mono outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Deskripsi</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Penjelasan singkat tipe hubungan kerja ini..."
                                        rows={3}
                                        className="w-full border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving || !form.name.trim()}
                                        className="flex-1 bg-primary text-white font-semibold gap-2 rounded-md"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {mode === 'create' ? 'Simpan Tipe Kontrak' : 'Simpan Perubahan'}
                                    </Button>
                                    <Button variant="outline" onClick={() => setMode('view')} className="rounded-md font-semibold">Batal</Button>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
