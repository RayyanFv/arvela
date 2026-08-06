'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ToastBanner } from '@/components/ui/ToastBanner'
import { Medal, Plus, Save, Loader2, Pencil, Trash2, X, ArrowUp, ArrowDown, GripVertical } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const LEVEL_COLORS = [
    'bg-slate-100 text-slate-600',    // 1
    'bg-blue-100 text-blue-700',      // 2
    'bg-emerald-100 text-emerald-700',// 3
    'bg-amber-100 text-amber-700',    // 4
    'bg-violet-100 text-violet-700',  // 5
    'bg-rose-100 text-rose-700',      // 6
    'bg-primary/10 text-primary',     // 7+
]

function gradeColor(level) {
    return LEVEL_COLORS[Math.min(level - 1, LEVEL_COLORS.length - 1)]
}

export default function GradesClient({ companyId, initialGrades }) {
    const supabase = createClient()
    const { toast, showToast } = useToast()
    const [grades, setGrades]   = useState(initialGrades)
    const [selected, setSelected] = useState(null)
    const [mode, setMode]       = useState('view')  // view | edit | create
    const [saving, setSaving]   = useState(false)
    const [deleting, setDeleting] = useState(false)

    const maxLevel = Math.max(0, ...grades.map(g => g.level || 0))
    const emptyForm = { name: '', code: '', level: maxLevel + 1, description: '' }
    const [form, setForm] = useState(emptyForm)

    const openCreate = () => {
        const nextLevel = Math.max(0, ...grades.map(g => g.level || 0)) + 1
        setForm({ ...emptyForm, level: nextLevel })
        setSelected(null)
        setMode('create')
    }

    const openEdit = (grade) => {
        setForm({
            name:        grade.name || '',
            code:        grade.code || '',
            level:       grade.level || 1,
            description: grade.description || '',
        })
        setMode('edit')
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = {
                company_id:  companyId,
                name:        form.name.trim(),
                code:        form.code.trim() || null,
                level:       parseInt(form.level),
                description: form.description.trim() || null,
            }

            if (mode === 'create') {
                const { data, error } = await supabase.from('job_grades').insert(payload).select('*').single()
                if (error) throw error
                const updated = [...grades, data].sort((a, b) => a.level - b.level)
                setGrades(updated)
                setSelected(data)
                showToast('Pangkat berhasil ditambahkan.')
            } else if (mode === 'edit' && selected) {
                const { data, error } = await supabase.from('job_grades').update(payload).eq('id', selected.id).select('*').single()
                if (error) throw error
                const updated = grades.map(g => g.id === data.id ? data : g).sort((a, b) => a.level - b.level)
                setGrades(updated)
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
        if (!confirm(`Hapus pangkat "${selected.name}"? Karyawan yang memiliki pangkat ini akan kehilangan relasi.`)) return
        setDeleting(true)
        const { error } = await supabase.from('job_grades').delete().eq('id', selected.id)
        if (error) showToast(error.message, 'error')
        else {
            setGrades(prev => prev.filter(g => g.id !== selected.id))
            setSelected(null)
            setMode('view')
            showToast('Pangkat dihapus.')
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
                        <Medal className="w-5 h-5 text-primary" /> Manajemen Pangkat / Golongan
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Kelola tingkatan struktural karyawan. Pangkat berbeda dengan jabatan fungsional.
                    </p>
                </div>
                <Button onClick={openCreate} className="bg-primary text-white font-semibold gap-2 rounded-md">
                    <Plus className="w-4 h-4" /> Tambah Pangkat
                </Button>
            </div>

            {/* Clarification note */}
            <div className="p-4 bg-blue-50 rounded-md border border-blue-100 flex items-start gap-3">
                <Medal className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 font-medium leading-relaxed">
                    <strong className="font-semibold">Pangkat</strong> adalah tingkatan struktural dalam hierarki organisasi (contoh: Staf → Manager → Direktur).
                    Ini berbeda dengan <strong className="font-semibold">Jabatan</strong> yang merupakan fungsi spesifik karyawan (contoh: Software Engineer, Analis Marketing).
                    Satu jabatan bisa dipegang oleh berbagai pangkat.
                </div>
            </div>

            {/* Main infoleft + inforight */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* ── infoleft: Pangkat List ────────────────────────────────── */}
                <Card className="lg:col-span-2 rounded-md border border-slate-200 p-3 self-start">
                    <div className="px-3 py-2 mb-2">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Jenjang Pangkat</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Diurutkan dari tertinggi ke terendah</p>
                    </div>

                    {grades.length === 0 ? (
                        <div className="py-10 text-center">
                            <Medal className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-400">Belum ada pangkat</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {grades.map((grade, idx) => {
                                const isSelected = selected?.id === grade.id
                                return (
                                    <button
                                        key={grade.id}
                                        onClick={() => { setSelected(grade); setMode('view') }}
                                        aria-pressed={isSelected}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors
                                            ${isSelected
                                                ? 'bg-primary text-white'
                                                : 'hover:bg-slate-50'}`}
                                    >
                                        {/* Level pill */}
                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-xs font-bold
                                            ${isSelected ? 'bg-white/20 text-white' : gradeColor(grade.level)}`}>
                                            {grade.level}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                                {grade.name}
                                            </p>
                                            {grade.code && (
                                                <p className={`text-[10px] font-mono font-semibold ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                                    {grade.code}
                                                </p>
                                            )}
                                        </div>
                                        {/* Position indicators */}
                                        <div className={`text-[10px] font-semibold ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                            {idx === 0 ? 'Tertinggi' : idx === grades.length - 1 ? 'Terendah' : ''}
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
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold mb-2 ${gradeColor(selected.level)}`}>
                                        <Medal className="w-3.5 h-3.5" /> Level {selected.level}
                                        {selected.code && ` · ${selected.code}`}
                                    </div>
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
                                        aria-label="Hapus pangkat"
                                        className="rounded-md gap-1.5 font-semibold text-rose-600 border-rose-200 hover:bg-rose-50">
                                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Hierarchy position */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Posisi dalam Jenjang</p>
                                <div className="flex items-center gap-2 overflow-x-auto py-2">
                                    {grades.map((g, i) => (
                                        <div key={g.id} className="flex items-center gap-2 shrink-0">
                                            <div className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap
                                                ${g.id === selected.id
                                                    ? 'bg-primary text-white ring-2 ring-primary/30 ring-offset-2'
                                                    : 'bg-slate-100 text-slate-500'}`}>
                                                {g.name}
                                            </div>
                                            {i < grades.length - 1 && (
                                                <span className="text-slate-300 text-xs">→</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Empty state */}
                    {mode === 'view' && !selected && (
                        <Card className="rounded-md border border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
                            <Medal className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-slate-400 font-semibold">Pilih pangkat di sebelah kiri</p>
                            <p className="text-xs text-slate-400 mt-1 font-medium">atau klik &quot;Tambah Pangkat&quot; untuk membuat baru</p>
                        </Card>
                    )}

                    {/* CREATE / EDIT form */}
                    {(mode === 'create' || mode === 'edit') && (
                        <Card className="rounded-md border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-base font-bold text-slate-900">
                                    {mode === 'create' ? 'Tambah Pangkat Baru' : `Edit Pangkat: ${selected?.name}`}
                                </h3>
                                <Button variant="ghost" size="icon" className="rounded-md" onClick={() => setMode('view')} aria-label="Tutup">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                            Nama Pangkat <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="Cth: Pelaksana Senior"
                                            className="w-full border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Kode</label>
                                        <input
                                            value={form.code}
                                            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                            placeholder="SNR, MGR, DIR..."
                                            className="w-full border border-slate-200 rounded-md px-4 py-2.5 text-sm font-mono outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                        Urutan Level <span className="text-slate-400 font-medium normal-case text-[10px]">(angka kecil = lebih rendah)</span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min={1}
                                            value={form.level}
                                            onChange={e => setForm(f => ({ ...f, level: parseInt(e.target.value) || 1 }))}
                                            className="w-24 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-semibold text-center outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                        />
                                        <div className={`px-3 py-1.5 rounded-md text-xs font-semibold ${gradeColor(parseInt(form.level) || 1)}`}>
                                            Preview level {form.level}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Deskripsi</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Tanggung jawab dan kriteria pangkat ini..."
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
                                        {mode === 'create' ? 'Simpan Pangkat' : 'Simpan Perubahan'}
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
