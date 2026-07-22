'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Building2, ChevronRight, ChevronDown, Plus, Save,
    Loader2, Pencil, Trash2, Settings, X, Users, User, LayoutGrid, Network
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// ─── Tree builder ─────────────────────────────────────────────────────────────
function buildTree(units, parentId = null) {
    return units
        .filter(u => u.parent_id === parentId)
        .sort((a, b) => (a.level || 0) - (b.level || 0) || a.name.localeCompare(b.name))
        .map(u => ({ ...u, children: buildTree(units, u.id) }))
}
function UnitNode({ node, depth, selected, onSelect, levelLabel }) {
    const [open, setOpen] = useState(true)
    const hasChildren = node.children?.length > 0
    const isSelected = selected?.id === node.id

    // Indent based on whichever is deeper: structural depth or numerical unit level
    const indentPx = 12 + Math.max(depth, (node.level || 1) - 1) * 20

    return (
        <div>
            <button
                onClick={() => onSelect(node)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all group
                    ${isSelected
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'hover:bg-slate-50 text-slate-700'}`}
                style={{ paddingLeft: `${indentPx}px` }}
            >
                {hasChildren ? (
                    <span onClick={e => { e.stopPropagation(); setOpen(!open) }}
                        className={`p-0.5 rounded ${isSelected ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                        {open
                            ? <ChevronDown className="w-3.5 h-3.5" />
                            : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                ) : (
                    <span className="w-5" />
                )}

                <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />

                <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                        {node.name}
                    </p>
                    <p className={`text-[10px] font-bold ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                        {levelLabel} {node.code ? `· ${node.code}` : ''}
                    </p>
                </div>
            </button>

            {open && hasChildren && (
                <div className="mt-0.5">
                    {node.children.map(child => (
                        <UnitNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            selected={selected}
                            onSelect={onSelect}
                            levelLabel={child._levelLabel}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Visual Org Chart Card Node Component ─────────────────────────────────────
function OrgChartCard({ node, onSelect, selectedId, parentLevel = 1 }) {
    const isSelected = selectedId === node.id
    const hasChildren = node.children && node.children.length > 0

    // Vertical drop offset if unit level is deeper than expected direct child level
    const levelDiff = Math.max(0, (node.level || 1) - parentLevel - 1)
    const topMarginPx = levelDiff * 28

    return (
        <div className="flex flex-col items-center" style={{ marginTop: `${topMarginPx}px` }}>
            {/* Card Node */}
            <div
                onClick={() => onSelect(node)}
                className={`relative cursor-pointer min-w-[220px] max-w-[260px] p-4 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md bg-white text-left
                    ${isSelected
                        ? 'border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/10'
                        : 'border-slate-200 hover:border-slate-300'}`}
            >
                <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-slate-100 text-slate-600">
                        {node._levelLabel}
                    </span>
                    {node.code && (
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                            {node.code}
                        </span>
                    )}
                </div>

                <h4 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                    {node.name}
                </h4>

                {node.head?.profiles?.full_name ? (
                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                            <User className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-600 truncate">
                            {node.head.profiles.full_name}
                        </span>
                    </div>
                ) : (
                    <p className="text-[10px] font-bold text-slate-300 mt-2 italic">
                        Tanpa Kepala Unit
                    </p>
                )}
            </div>

            {/* Connecting line to children */}
            {hasChildren && (
                <>
                    <div className="w-0.5 h-6 bg-slate-300"></div>

                    {/* Children Container */}
                    <div className="flex gap-6 relative pt-4">
                        {/* Horizontal connecting line across siblings */}
                        {node.children.length > 1 && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-slate-300"
                                style={{
                                    width: `calc(100% - ${220 / node.children.length}px)`
                                }}
                            />
                        )}

                        {node.children.map(child => (
                            <div key={child.id} className="relative flex flex-col items-center">
                                {/* Line from horizontal bar down to child */}
                                <div className="absolute -top-4 w-0.5 bg-slate-300" style={{ height: `${16 + Math.max(0, (child.level || 1) - (node.level || 1) - 1) * 28}px` }} />
                                <OrgChartCard node={child} onSelect={onSelect} selectedId={selectedId} parentLevel={node.level || 1} />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function UnitsClient({
    companyId, companyName, initialUnits, initialLevelConfigs, employees
}) {
    const supabase = createClient()

    const [units, setUnits]               = useState(initialUnits)
    const [levelConfigs, setLevelConfigs]  = useState(initialLevelConfigs)
    const [selected, setSelected]          = useState(null)
    const [mode, setMode]                  = useState('view')   // view | edit | create | config
    const [viewTab, setViewTab]            = useState('split')  // split | chart
    const [saving, setSaving]              = useState(false)
    const [deleting, setDeleting]          = useState(false)

    // Form state
    const emptyForm = { name: '', code: '', description: '', level: 1, parent_id: '', head_id: '' }
    const [form, setForm] = useState(emptyForm)

    // Level labels map
    const levelMap = useMemo(() => {
        const m = {}
        levelConfigs.forEach(c => { m[c.level] = c.label })
        return m
    }, [levelConfigs])

    // Build tree with label injection
    const tree = useMemo(() => {
        const annotated = units.map(u => ({ ...u, _levelLabel: levelMap[u.level] || `Level ${u.level}` }))
        return buildTree(annotated)
    }, [units, levelMap])

    const maxLevel = useMemo(() => Math.max(...levelConfigs.map(c => c.level), 3), [levelConfigs])

    // Available parents (units with level < current form level)
    const availableParents = useMemo(() =>
        units.filter(u => u.level < (parseInt(form.level) || 1) && u.id !== selected?.id),
        [units, form.level, selected]
    )

    const openCreate = () => {
        setForm(emptyForm)
        setSelected(null)
        setMode('create')
    }

    const openEdit = (unit) => {
        setForm({
            name:        unit.name || '',
            code:        unit.code || '',
            description: unit.description || '',
            level:       unit.level || 1,
            parent_id:   unit.parent_id || '',
            head_id:     unit.head?.id || '',
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
                description: form.description.trim() || null,
                level:       parseInt(form.level),
                parent_id:   form.parent_id || null,
                head_id:     form.head_id || null,
            }

            if (mode === 'create') {
                const { data, error } = await supabase
                    .from('departments')
                    .insert(payload)
                    .select('id, name, code, description, level, parent_id, head:head_id(id, profiles!employees_profile_id_fkey(full_name))')
                    .single()
                if (error) throw error
                setUnits(prev => [...prev, data])
                setSelected(data)
                setMode('view')
            } else if (mode === 'edit' && selected) {
                const { data, error } = await supabase
                    .from('departments')
                    .update(payload)
                    .eq('id', selected.id)
                    .select('id, name, code, description, level, parent_id, head:head_id(id, profiles!employees_profile_id_fkey(full_name))')
                    .single()
                if (error) throw error
                setUnits(prev => prev.map(u => u.id === data.id ? data : u))
                setSelected(data)
                setMode('view')
            }
        } catch (err) {
            alert('Gagal menyimpan: ' + err.message)
        }
        setSaving(false)
    }

    const handleDelete = async () => {
        if (!selected) return
        const childCount = units.filter(u => u.parent_id === selected.id).length
        if (childCount > 0) {
            alert(`Unit "${selected.name}" masih memiliki ${childCount} sub-unit. Pindahkan atau hapus sub-unit terlebih dahulu.`)
            return
        }
        if (!confirm(`Hapus unit "${selected.name}"? Karyawan yang terhubung akan kehilangan relasi ke unit ini.`)) return
        setDeleting(true)
        const { error } = await supabase.from('departments').delete().eq('id', selected.id)
        if (error) alert(error.message)
        else {
            setUnits(prev => prev.filter(u => u.id !== selected.id))
            setSelected(null)
            setMode('view')
        }
        setDeleting(false)
    }

    const handleSaveLevelConfig = async (level, label) => {
        const { error } = await supabase.from('unit_level_configs').upsert(
            { company_id: companyId, level, label },
            { onConflict: 'company_id,level' }
        )
        if (!error) {
            setLevelConfigs(prev => {
                const exists = prev.find(c => c.level === level)
                if (exists) return prev.map(c => c.level === level ? { ...c, label } : c)
                return [...prev, { level, label }]
            })
        }
    }

    const handleAddLevel = async () => {
        const newLevel = maxLevel + 1
        await handleSaveLevelConfig(newLevel, `Level ${newLevel}`)
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-primary" /> Manajemen Unit Organisasi
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Kelola hierarki Divisi, Departemen, dan Unit di perusahaan Anda.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* View Switcher */}
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                        <button
                            onClick={() => setViewTab('split')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                ${viewTab === 'split' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" /> Kelola & Form
                        </button>
                        <button
                            onClick={() => setViewTab('chart')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                ${viewTab === 'chart' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            <Network className="w-3.5 h-3.5" /> Bagan Organisasi
                        </button>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setMode(mode === 'config' ? 'view' : 'config')}
                        className={`rounded-xl gap-2 font-bold text-sm ${mode === 'config' ? 'border-primary text-primary' : ''}`}
                    >
                        <Settings className="w-4 h-4" /> Label Level
                    </Button>
                    <Button
                        onClick={openCreate}
                        className="bg-primary text-white font-black gap-2 rounded-xl shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4" /> Tambah Unit
                    </Button>
                </div>
            </div>

            {/* Level Config panel */}
            {mode === 'config' && (
                <Card className="p-5 rounded-2xl border-2 border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-black text-slate-800">Konfigurasi Label Level Unit</p>
                        <Button variant="ghost" size="icon" onClick={() => setMode('view')} className="rounded-xl">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {levelConfigs.sort((a, b) => a.level - b.level).map(cfg => (
                            <div key={cfg.level} className="flex items-center gap-3">
                                <span className="w-20 text-xs font-black text-slate-500 uppercase tracking-widest shrink-0">
                                    Level {cfg.level}
                                </span>
                                <input
                                    defaultValue={cfg.label}
                                    onBlur={e => handleSaveLevelConfig(cfg.level, e.target.value)}
                                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={handleAddLevel} className="rounded-xl gap-1.5 text-xs font-bold mt-2">
                            <Plus className="w-3.5 h-3.5" /> Tambah Level
                        </Button>
                    </div>
                </Card>
            )}

            {/* ─── TAB: Visual Bagan Organisasi ──────────────────────────────────────── */}
            {viewTab === 'chart' && (
                <Card className="rounded-3xl border-none shadow-sm p-8 overflow-x-auto min-h-[500px] flex justify-center items-start">
                    {units.length === 0 ? (
                        <div className="py-20 text-center">
                            <Network className="w-14 h-14 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold">Belum ada struktur organisasi</p>
                            <p className="text-xs text-slate-300 mt-1">Tambahkan unit untuk melihat bagan hierarki</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-4">
                            {/* Company Root Card Node */}
                            <div className="min-w-[240px] p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 text-center shadow-sm">
                                <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-primary text-white">
                                    Perusahaan Utama
                                </span>
                                <h3 className="font-black text-slate-900 text-base mt-2 flex items-center justify-center gap-2">
                                    <Building2 className="w-5 h-5 text-primary" /> {companyName}
                                </h3>
                            </div>

                            {/* Line from Company Root to Divisi */}
                            <div className="w-0.5 h-6 bg-slate-300"></div>

                            {/* Level 1 Nodes Container */}
                            <div className="flex gap-8 relative pt-4">
                                {tree.length > 1 && (
                                    <div
                                        className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-slate-300"
                                        style={{ width: `calc(100% - ${220 / tree.length}px)` }}
                                    />
                                )}
                                {tree.map(rootNode => (
                                    <div key={rootNode.id} className="relative flex flex-col items-center">
                                        <div className="absolute -top-4 w-0.5 h-4 bg-slate-300" />
                                        <OrgChartCard
                                            node={rootNode}
                                            onSelect={u => { setSelected(u); setViewTab('split'); setMode('view') }}
                                            selectedId={selected?.id}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* ─── TAB: Split View (infoleft + inforight) ────────────────────────────── */}
            {viewTab === 'split' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* ── infoleft: Unit Tree ───────────────────────────────────── */}
                    <Card className="lg:col-span-2 rounded-3xl border-none shadow-sm p-3 self-start">
                        <div className="px-3 py-2 mb-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Struktur Organisasi</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{units.length} unit terdaftar</p>
                        </div>

                        {units.length === 0 ? (
                            <div className="py-12 text-center">
                                <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-400">Belum ada unit</p>
                                <p className="text-xs text-slate-300 mt-1">Klik "Tambah Unit" untuk memulai</p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {tree.map(node => (
                                    <UnitNode
                                        key={node.id}
                                        node={node}
                                        depth={0}
                                        selected={selected}
                                        onSelect={u => { setSelected(u); setMode('view') }}
                                        levelLabel={node._levelLabel}
                                    />
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* ── inforight: Detail / Form ──────────────────────────────── */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* VIEW mode */}
                        {mode === 'view' && selected && (
                            <Card className="rounded-3xl border-none shadow-sm p-7 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2.5 py-0.5 text-[10px] font-black bg-primary/10 text-primary rounded-full uppercase tracking-widest">
                                                {levelMap[selected.level] || `Level ${selected.level}`}
                                            </span>
                                            {selected.code && (
                                                <span className="px-2.5 py-0.5 text-[10px] font-black bg-slate-100 text-slate-600 rounded-full font-mono">
                                                    {selected.code}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-xl font-black text-slate-900">{selected.name}</h2>
                                        {selected.description && (
                                            <p className="text-sm text-slate-500 font-medium mt-1">{selected.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button onClick={() => openEdit(selected)} variant="outline" size="sm" className="rounded-xl gap-1.5 font-bold">
                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                        </Button>
                                        <Button onClick={handleDelete} disabled={deleting} variant="outline" size="sm"
                                            className="rounded-xl gap-1.5 font-bold text-red-500 border-red-200 hover:bg-red-50">
                                            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            Hapus
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Induk</p>
                                        <p className="text-sm font-bold text-slate-700">
                                            {selected.parent_id
                                                ? units.find(u => u.id === selected.parent_id)?.name || '—'
                                                : <span className="text-slate-400 italic">Root (tidak ada induk)</span>}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kepala Unit</p>
                                        <p className="text-sm font-bold text-slate-700">
                                            {selected.head?.profiles?.full_name || <span className="text-slate-400 italic">Belum ditentukan</span>}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sub-Unit Langsung</p>
                                        <p className="text-sm font-bold text-slate-700">
                                            {units.filter(u => u.parent_id === selected.id).length} unit
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Level</p>
                                        <p className="text-sm font-bold text-slate-700">
                                            {levelMap[selected.level] || `Level ${selected.level}`} ({selected.level})
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* VIEW mode — nothing selected */}
                        {mode === 'view' && !selected && (
                            <Card className="rounded-3xl border-none shadow-sm p-12 flex flex-col items-center justify-center text-center">
                                <Building2 className="w-14 h-14 text-slate-200 mb-4" />
                                <p className="text-slate-400 font-bold">Pilih unit di sebelah kiri</p>
                                <p className="text-xs text-slate-300 mt-1 font-medium">atau klik "Tambah Unit" untuk membuat baru</p>
                            </Card>
                        )}

                        {/* CREATE / EDIT form */}
                        {(mode === 'create' || mode === 'edit') && (
                            <Card className="rounded-3xl border-none shadow-sm p-7">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-black text-slate-900">
                                        {mode === 'create' ? 'Buat Unit Baru' : `Edit Unit: ${selected?.name}`}
                                    </h3>
                                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setMode('view')}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {/* Level */}
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Level Unit</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {levelConfigs.sort((a, b) => a.level - b.level).map(cfg => (
                                                <button
                                                    key={cfg.level}
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, level: cfg.level, parent_id: '' }))}
                                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all
                                                        ${parseInt(form.level) === cfg.level
                                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                >
                                                    {cfg.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                            Nama Unit <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder={`Nama ${levelMap[form.level] || 'Unit'}...`}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>

                                    {/* Code */}
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Kode Unit</label>
                                        <input
                                            value={form.code}
                                            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                            placeholder="Cth: DIV-TI, DEPT-HR"
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>

                                    {/* Parent */}
                                    {parseInt(form.level) > 1 && (
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                                Unit Induk ({levelMap[(parseInt(form.level) - 1)] || `Level ${parseInt(form.level) - 1}`})
                                            </label>
                                            <select
                                                value={form.parent_id}
                                                onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                                            >
                                                <option value="">— Pilih Unit Induk —</option>
                                                {availableParents.map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.name} ({levelMap[u.level] || `L${u.level}`})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Head */}
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                            Kepala Unit <span className="text-slate-400 font-medium normal-case text-[10px]">(opsional)</span>
                                        </label>
                                        <select
                                            value={form.head_id}
                                            onChange={e => setForm(f => ({ ...f, head_id: e.target.value }))}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                                        >
                                            <option value="">— Belum Ditentukan —</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.profiles?.full_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Deskripsi</label>
                                        <textarea
                                            value={form.description}
                                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                            placeholder="Tugas pokok dan fungsi unit..."
                                            rows={3}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 pt-2">
                                        <Button
                                            onClick={handleSave}
                                            disabled={saving || !form.name.trim()}
                                            className="flex-1 bg-primary text-white font-black gap-2 rounded-2xl shadow-lg shadow-primary/20"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {mode === 'create' ? 'Buat Unit' : 'Simpan Perubahan'}
                                        </Button>
                                        <Button variant="outline" onClick={() => setMode('view')} className="rounded-2xl font-bold">
                                            Batal
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
