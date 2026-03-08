'use client'

// ──────────────────────────────────────────────────
// MODULE  : OKR Table (Staff Side)
// FILE    : components/staff/OKRTable.jsx
// TABLES  : okrs, key_results, initiatives
// ACCESS  : PROTECTED — employee
// SKILL   : baca Arvela/SKILL.md sebelum edit file ini
// ──────────────────────────────────────────────────

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Target, Plus, Check, Loader2, Edit2, Zap, Info, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// ─── Tooltip (simple hover) ───────────────────────────────────────────────────
function Tooltip({ children, content }) {
    const [show, setShow] = useState(false)
    return (
        <div
            className="relative inline-flex"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 rounded-xl shadow-xl bg-slate-900 text-white text-[11px] leading-relaxed p-3 pointer-events-none">
                    {content}
                    {/* arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
            )}
        </div>
    )
}

// ─── Row-type badge with tooltip ──────────────────────────────────────────────
const ROW_META = {
    O: {
        label: 'O',
        title: 'Objective (O)',
        desc: 'Tujuan besar yang ingin dicapai — bersifat kualitatif, inspiratif, dan terikat waktu (1 kuartal). Merupakan "apa yang ingin kita raih?"',
        bg: 'bg-emerald-100 text-emerald-800',
    },
    KR: {
        label: 'KR',
        title: 'Key Result (KR)',
        desc: 'Indikator terukur yang membuktikan bahwa Objective tercapai. Selalu berupa angka dengan baseline → target. Progres KR menentukan progres Objective secara otomatis.',
        bg: 'bg-blue-100 text-blue-800',
    },
    IN: {
        label: 'IN',
        title: 'Initiative / Action Plan (IN)',
        desc: 'Rencana aksi konkret yang dilakukan untuk mendorong Key Result. Berbeda dengan KR, Initiative adalah aktivitas, bukan angka. Contoh: "Revamp halaman landing" atau "Conduct 10 customer interviews".',
        bg: 'bg-slate-100 text-slate-600',
    },
}

function RowBadge({ type, index }) {
    const meta = ROW_META[type]
    const shortLabel = type === 'O' ? `O${index + 1}` : type === 'KR' ? `KR-${index + 1}` : `IN-${index + 1}`
    return (
        <Tooltip content={
            <div>
                <p className="font-black text-white mb-1">{meta.title}</p>
                <p className="text-white/70">{meta.desc}</p>
            </div>
        }>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-black text-[10px] cursor-help ${meta.bg}`}>
                {shortLabel}
                <Info className="w-2.5 h-2.5 opacity-50" />
            </span>
        </Tooltip>
    )
}

// ─── Main Table ───────────────────────────────────────────────────────────────
export function OKRTable({ okrs = [], onUpdate }) {
    const supabase = createClient()
    const [loadingKr, setLoadingKr] = useState(null)
    const [loadingInit, setLoadingInit] = useState(null)
    const [addingInit, setAddingInit] = useState(null)
    const [addingKR, setAddingKR] = useState(null)
    const [newInit, setNewInit] = useState({ title: '', delivery_window: '' })
    const [newKR, setNewKR] = useState({ title: '', target_value: '', unit: '' })
    const [editingKr, setEditingKr] = useState(null)
    const [editKrValue, setEditKrValue] = useState('')

    if (okrs.length === 0) {
        return (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
                <Trophy className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase">Belum ada target OKR</p>
                <p className="text-[10px] text-slate-300 mt-2">Hubungi manajer Anda untuk menetapkan target kuartal ini.</p>
            </div>
        )
    }

    async function updateKRQuick(krId, newValue) {
        setLoadingKr(krId)
        try {
            await supabase.from('key_results').update({ current_value: newValue }).eq('id', krId)
            onUpdate()
            setEditingKr(null)
        } catch (_) { }
        setLoadingKr(null)
    }

    async function updateInitiativeStatus(initId, newStatus) {
        setLoadingInit(initId)
        try {
            await supabase.from('initiatives').update({ status: newStatus }).eq('id', initId)
            onUpdate()
        } catch (_) { }
        setLoadingInit(null)
    }

    async function saveKR(okrId) {
        if (!newKR.title || !newKR.target_value) return
        try {
            await supabase.from('key_results').insert({
                okr_id: okrId,
                title: newKR.title,
                target_value: Number(newKR.target_value),
                unit: newKR.unit || '',
                current_value: 0
            })
            setNewKR({ title: '', target_value: '', unit: '' })
            setAddingKR(null)
            onUpdate()
        } catch (_) { }
    }

    async function saveInitiative(okrId) {
        if (!newInit.title) return
        try {
            await supabase.from('initiatives').insert({
                okr_id: okrId,
                title: newInit.title,
                delivery_window: newInit.delivery_window || 'TBD'
            })
            setNewInit({ title: '', delivery_window: '' })
            setAddingInit(null)
            onUpdate()
        } catch (_) { }
    }

    const getStatusColor = (status) => {
        if (status === 'Done') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
        if (status === 'In progress') return 'bg-amber-100 text-amber-700 border-amber-200'
        return 'bg-slate-100 text-slate-500 border-slate-200'
    }

    return (
        <div className="space-y-3">
            {/* ── Legend strip ──────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 px-1 pb-1">
                {Object.entries(ROW_META).map(([key, meta]) => (
                    <Tooltip key={key} content={
                        <div>
                            <p className="font-black text-white mb-1">{meta.title}</p>
                            <p className="text-white/70">{meta.desc}</p>
                        </div>
                    }>
                        <div className="flex items-center gap-1.5 cursor-help group">
                            <span className={`px-2 py-0.5 rounded font-black text-[10px] ${meta.bg}`}>{key}</span>
                            <span className="text-xs text-slate-400 font-medium group-hover:text-slate-600 transition-colors">
                                {meta.title}
                            </span>
                            <Info className="w-3 h-3 text-slate-300 group-hover:text-slate-400 transition-colors" />
                        </div>
                    </Tooltip>
                ))}
                <span className="ml-auto text-[10px] text-slate-300 font-bold italic hidden sm:block">
                    Hover badge untuk penjelasan
                </span>
            </div>

            {/* ── Table ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm text-sm overflow-x-auto">
                <table className="w-full min-w-[760px] text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                            <th className="p-4 w-16 text-center">
                                <Tooltip content={
                                    <div>
                                        <p className="font-black text-white mb-1">Tipe Baris</p>
                                        <p className="text-white/70">O = Objective · KR = Key Result · IN = Initiative</p>
                                    </div>
                                }>
                                    <span className="cursor-help flex items-center gap-1">Tipe <Info className="w-2.5 h-2.5" /></span>
                                </Tooltip>
                            </th>
                            <th className="p-4 w-[40%]">Deskripsi</th>
                            <th className="p-4 w-24 text-center">Baseline</th>
                            <th className="p-4 w-24 text-center">
                                <Tooltip content={
                                    <div>
                                        <p className="font-black text-white mb-1">Current Value</p>
                                        <p className="text-white/70">Nilai terkini. Klik angka pada baris KR untuk update langsung.</p>
                                    </div>
                                }>
                                    <span className="cursor-help flex items-center gap-1 justify-center">Aktual <Info className="w-2.5 h-2.5" /></span>
                                </Tooltip>
                            </th>
                            <th className="p-4 w-24 text-center">Target</th>
                            <th className="p-4 w-32">Progress / Status</th>
                            <th className="p-4 w-16 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="align-top font-medium">
                        {okrs.map((okr, oIdx) => (
                            <React.Fragment key={okr.id}>
                                {/* OBJECTIVE ROW */}
                                <tr className="bg-[#E6F4EA] border-b border-slate-200/50 hover:bg-[#DDF0E3] transition-colors">
                                    <td className="p-4 font-black border-r border-[#CDE7D5] text-center">
                                        <RowBadge type="O" index={oIdx} />
                                    </td>
                                    <td className="p-4 font-black text-emerald-900">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-4 h-4 text-emerald-600 shrink-0" />
                                            {okr.title}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center text-emerald-700">—</td>
                                    <td className="p-4 text-center font-bold text-emerald-800">{Math.round(okr.total_progress)}%</td>
                                    <td className="p-4 text-center text-emerald-700">100%</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold ${okr.total_progress >= 70
                                            ? 'bg-emerald-200 text-emerald-800'
                                            : okr.total_progress >= 30
                                                ? 'bg-amber-200 text-amber-800'
                                                : 'bg-red-200 text-red-800'}`}>
                                            {okr.total_progress >= 70 ? 'ON-TRACK' : okr.total_progress >= 30 ? 'AT RISK' : 'OFF-TRACK'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center"></td>
                                </tr>

                                {/* KEY RESULTS ROWS */}
                                {okr.key_results?.map((kr, kIdx) => (
                                    <tr key={kr.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                        <td className="p-3 border-r border-slate-100 text-center">
                                            <RowBadge type="KR" index={kIdx} />
                                        </td>
                                        <td className="p-3 text-slate-700">{kr.title}</td>
                                        <td className="p-3 text-center text-slate-400">0 {kr.unit}</td>
                                        {/* CURRENT VALUE EDIT */}
                                        <td className="p-3 text-center">
                                            {editingKr === kr.id ? (
                                                <div className="flex items-center gap-1 justify-center">
                                                    <Input
                                                        autoFocus
                                                        type="number"
                                                        value={editKrValue}
                                                        onChange={e => setEditKrValue(e.target.value)}
                                                        className="w-16 h-7 text-xs text-center p-1"
                                                    />
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700"
                                                        onClick={() => updateKRQuick(kr.id, editKrValue)}>
                                                        {loadingKr === kr.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div
                                                    className="font-bold text-slate-900 cursor-pointer hover:text-primary flex items-center justify-center gap-1 group/edit"
                                                    onClick={() => { setEditingKr(kr.id); setEditKrValue(kr.current_value) }}
                                                >
                                                    {kr.current_value} {kr.unit}
                                                    <Edit2 className="w-3 h-3 opacity-0 group-hover/edit:opacity-100 text-slate-300 transition-all" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-center text-slate-600">{kr.target_value} {kr.unit}</td>
                                        {/* PROGRESS */}
                                        <td className="p-3 pr-6">
                                            <div className="flex items-center gap-2 w-full">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-500"
                                                        style={{ width: `${Math.min(100, ((Number(kr.current_value) || 0) / (Number(kr.target_value) || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 w-11 text-right">
                                                    {((Number(kr.current_value) || 0) / (Number(kr.target_value) || 1)) * 100 < 1 && (Number(kr.current_value) || 0) > 0
                                                        ? (((Number(kr.current_value) || 0) / (Number(kr.target_value) || 1)) * 100).toFixed(1)
                                                        : Math.round(((Number(kr.current_value) || 0) / (Number(kr.target_value) || 1)) * 100)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center"></td>
                                    </tr>
                                ))}

                                {/* + ADD KR */}
                                {addingKR === okr.id ? (
                                    <tr className="bg-blue-50/30 border-b border-blue-100">
                                        <td className="p-2 border-r border-slate-100 text-center text-[10px] text-blue-400 font-bold">KR</td>
                                        <td className="p-2 px-3">
                                            <Input autoFocus placeholder="Nama Key Result (Contoh: Capai 100 pelanggan baru)"
                                                value={newKR.title} onChange={e => setNewKR({ ...newKR, title: e.target.value })}
                                                className="h-8 text-xs bg-white border-slate-200" />
                                        </td>
                                        <td className="p-2 px-3 text-center">
                                            <Input type="number" placeholder="0" value={newKR.target_value}
                                                onChange={e => setNewKR({ ...newKR, target_value: e.target.value })}
                                                className="h-8 text-xs text-center bg-white border-slate-200" />
                                        </td>
                                        <td className="p-2 px-2 text-center">
                                            <Input placeholder="%" value={newKR.unit}
                                                onChange={e => setNewKR({ ...newKR, unit: e.target.value })}
                                                className="h-8 text-xs text-center bg-white border-slate-200 w-14" />
                                        </td>
                                        <td className="p-2 px-3 text-center">—</td>
                                        <td className="p-2 px-3">
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" className="h-7 text-xs font-bold" onClick={() => saveKR(okr.id)}>Simpan</Button>
                                                <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400" onClick={() => setAddingKR(null)}>Batal</Button>
                                            </div>
                                        </td>
                                        <td className="p-2"></td>
                                    </tr>
                                ) : (
                                    <tr className="border-b border-slate-50">
                                        <td colSpan={7} className="p-1.5 hover:bg-blue-50 transition-colors cursor-pointer text-center text-[10px] font-bold text-slate-300 hover:text-blue-400"
                                            onClick={() => { setAddingKR(okr.id); setAddingInit(null) }}>
                                            <div className="flex items-center justify-center gap-1">
                                                <Plus className="w-3 h-3" /> Tambah Key Result
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* INITIATIVES ROWS */}
                                {okr.initiatives?.map((init, iIdx) => (
                                    <tr key={init.id} className="bg-[#f8fafc] border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-3 py-2 border-r border-slate-100 text-center">
                                            <RowBadge type="IN" index={iIdx} />
                                        </td>
                                        <td className="p-3 py-2 text-slate-600 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                                {init.title}
                                            </div>
                                        </td>
                                        <td colSpan={3} className="p-3 py-2 text-center text-xs text-slate-400 italic">
                                            Delivery: {init.delivery_window}
                                        </td>
                                        <td className="p-3 py-2">
                                            <div className="relative inline-block w-28">
                                                <select
                                                    value={init.status}
                                                    onChange={e => updateInitiativeStatus(init.id, e.target.value)}
                                                    disabled={loadingInit === init.id}
                                                    className={`appearance-none w-full px-2 py-1 rounded-md text-[10px] font-bold border cursor-pointer hover:brightness-95 transition-all outline-none ${getStatusColor(init.status)}`}
                                                >
                                                    <option value="Not started">Not started</option>
                                                    <option value="In progress">In progress</option>
                                                    <option value="Done">Done</option>
                                                    <option value="Unconfirmed">Unconfirmed</option>
                                                </select>
                                                {loadingInit === init.id && (
                                                    <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-1.5 text-slate-500" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 py-2 text-center"></td>
                                    </tr>
                                ))}

                                {/* ADD INITIATIVE */}
                                {addingInit === okr.id ? (
                                    <tr className="bg-[#f8fafc] border-b border-slate-200">
                                        <td className="p-2 border-r border-slate-100"></td>
                                        <td className="p-2 px-3">
                                            <Input autoFocus placeholder="Nama inisiatif (Cth: Revamp UI Landing Page)"
                                                value={newInit.title} onChange={e => setNewInit({ ...newInit, title: e.target.value })}
                                                className="h-8 text-xs bg-white border-slate-200" />
                                        </td>
                                        <td colSpan={3} className="p-2 px-3 text-center">
                                            <Input placeholder="Kapan? (Q1, 16 Jan, dll)"
                                                value={newInit.delivery_window} onChange={e => setNewInit({ ...newInit, delivery_window: e.target.value })}
                                                className="h-8 text-xs bg-white border-slate-200" />
                                        </td>
                                        <td className="p-2 px-3">
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" className="h-8 text-xs font-bold" onClick={() => saveInitiative(okr.id)}>Simpan</Button>
                                                <Button size="sm" variant="ghost" className="h-8 text-xs text-slate-400" onClick={() => setAddingInit(null)}>Batal</Button>
                                            </div>
                                        </td>
                                        <td className="p-2"></td>
                                    </tr>
                                ) : (
                                    <tr className="bg-white border-b-4 border-slate-100">
                                        <td colSpan={7} className="p-2 hover:bg-slate-50 transition-colors cursor-pointer text-center text-xs font-bold text-slate-400"
                                            onClick={() => setAddingInit(okr.id)}>
                                            <div className="flex items-center justify-center gap-1 group">
                                                <Plus className="w-3 h-3 group-hover:text-primary transition-colors" /> Tambah Inisiatif / Action Plan
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
