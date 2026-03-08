'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { bulkAssignAssessment } from '@/lib/actions/assessments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Users,
    Search,
    Send,
    Loader2,
    CheckCircle2,
    AlertCircle,
    UserCircle,
    Mail
} from 'lucide-react'

export default function BulkAssigner({ assessmentId, candidates = [] }) {
    const [search, setSearch] = useState('')
    const [selectedIds, setSelectedIds] = useState([])
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const router = useRouter()

    const filtered = candidates.filter(c =>
        c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.jobs?.title?.toLowerCase().includes(search.toLowerCase())
    )

    function toggleSelect(id) {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id))
        } else {
            setSelectedIds([...selectedIds, id])
        }
    }

    function toggleSelectAll() {
        if (selectedIds.length === filtered.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filtered.map(c => c.id))
        }
    }

    async function handleBulkAssign() {
        if (selectedIds.length === 0) return
        setLoading(true)
        setResult(null)

        try {
            const res = await bulkAssignAssessment({
                assessment_id: assessmentId,
                application_ids: selectedIds
            })
            setResult(res)
            setSelectedIds([])
            router.refresh()
        } catch (error) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Undang Kandidat</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Pilih kandidat yang ingin diberikan assessment ini via email.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Cari nama, email, atau posisi..."
                            className="pl-9 h-10 rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        disabled={selectedIds.length === 0 || loading}
                        onClick={handleBulkAssign}
                        className="h-10 px-6 rounded-xl gap-2 font-bold shadow-lg shadow-primary/20"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3 h-3" />}
                        Kirim Undangan ({selectedIds.length})
                    </Button>
                </div>
            </div>

            {result && (
                <div className={`p-4 rounded-2xl border flex items-center gap-4 animate-in fade-in slide-in-from-top-2 ${result.failed === 0 ? 'bg-green-50 border-green-100 text-green-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${result.failed === 0 ? 'bg-green-100' : 'bg-amber-100'}`}>
                        {result.failed === 0 ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
                    </div>
                    <div>
                        <p className="font-bold">Proses Selesai</p>
                        <p className="text-sm opacity-90">
                            Berhasil mengirim: <strong>{result.success}</strong>.
                            Gagal: <strong>{result.failed}</strong>.
                        </p>
                    </div>
                    <button onClick={() => setResult(null)} className="ml-auto text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100">Tutup</button>
                </div>
            )}

            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-border">
                                <th className="p-4 w-12 text-center">
                                    <Checkbox
                                        checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                                        onCheckedChange={toggleSelectAll}
                                        className="rounded-md"
                                    />
                                </th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Kandidat</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Posisi Melamar</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-slate-400 italic">
                                        Tidak ada kandidat ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(c => (
                                    <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.includes(c.id) ? 'bg-primary/5' : ''}`}>
                                        <td className="p-4 text-center">
                                            <Checkbox
                                                checked={selectedIds.includes(c.id)}
                                                onCheckedChange={() => toggleSelect(c.id)}
                                                className="rounded-md"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0 border border-border">
                                                    <UserCircle className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">{c.full_name}</p>
                                                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {c.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-slate-700">{c.jobs?.title}</p>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-100 text-slate-500">
                                                {c.stage}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                    <strong>Catatan:</strong> Kandidat yang sudah pernah diberikan assessment ini tidak akan dikirimi email ganda untuk mencegah spam. Gunakan fitur "Bulk Assign" untuk efisiensi waktu saat mengundang banyak peserta sekaligus.
                </p>
            </div>
        </div>
    )
}
