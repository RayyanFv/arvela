'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from '@/components/ui/select'
import {
    Clock,
    Plus,
    CheckCircle2,
    XCircle,
    Loader2,
    Timer,
    Calendar,
    Search,
    Filter,
    Users,
    TrendingUp,
    AlertCircle
} from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

const STATUS_MAP = {
    pending: { label: 'Menunggu', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    approved: { label: 'Disetujui', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
}

export default function AdminOvertimePage() {
    const supabase = createClient()
    const { profile } = useProfile()
    const [requests, setRequests] = useState([])
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [reviewDialog, setReviewDialog] = useState({ open: false, request: null })
    const [submitting, setSubmitting] = useState(false)

    // Form state for creating new overtime
    const [form, setForm] = useState({
        employee_id: '',
        overtime_date: '',
        start_time: '',
        end_time: '',
        reason: '',
        tasks_completed: '',
    })

    // Review form state
    const [reviewNote, setReviewNote] = useState('')

    const fetchData = useCallback(async () => {
        if (!profile?.company_id) return
        setLoading(true)

        const [overtimeRes, employeeRes] = await Promise.all([
            supabase
                .from('overtime_requests')
                .select('*, employees(department, job_title, profile_id, profiles!employees_profile_id_fkey(full_name, avatar_url))')
                .eq('company_id', profile.company_id)
                .order('created_at', { ascending: false }),
            supabase
                .from('employees')
                .select('id, department, job_title, profiles!employees_profile_id_fkey(full_name)')
                .eq('company_id', profile.company_id)
                .eq('status', 'active')
        ])

        if (overtimeRes.data) setRequests(overtimeRes.data)
        if (employeeRes.data) setEmployees(employeeRes.data)
        setLoading(false)
    }, [profile?.company_id])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    async function handleCreate(e) {
        e.preventDefault()
        setSubmitting(true)

        const { error } = await supabase.from('overtime_requests').insert({
            employee_id: form.employee_id,
            company_id: profile.company_id,
            overtime_date: form.overtime_date,
            start_time: form.start_time,
            end_time: form.end_time,
            reason: form.reason,
            tasks_completed: form.tasks_completed,
            status: 'approved', // Admin-created = auto-approved
            reviewed_by: profile.id,
            reviewed_at: new Date().toISOString(),
        })

        if (error) {
            alert('Gagal membuat pengajuan: ' + error.message)
        } else {
            setDialogOpen(false)
            setForm({ employee_id: '', overtime_date: '', start_time: '', end_time: '', reason: '', tasks_completed: '' })
            fetchData()
        }
        setSubmitting(false)
    }

    async function handleReview(status) {
        if (!reviewDialog.request) return
        setSubmitting(true)

        const { error } = await supabase
            .from('overtime_requests')
            .update({
                status,
                reviewed_by: profile.id,
                reviewed_at: new Date().toISOString(),
                review_note: reviewNote,
            })
            .eq('id', reviewDialog.request.id)

        if (error) {
            alert('Gagal memproses: ' + error.message)
        } else {
            setReviewDialog({ open: false, request: null })
            setReviewNote('')
            fetchData()
        }
        setSubmitting(false)
    }

    // ── useMemo: filtered list — tidak recompute kecuali deps berubah ─────────
    const filtered = useMemo(() => requests.filter(r => {
        if (filterStatus !== 'all' && r.status !== filterStatus) return false
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            const empName = r.employees?.profiles?.full_name?.toLowerCase() || ''
            const dept = r.employees?.department?.toLowerCase() || ''
            return empName.includes(q) || dept.includes(q) || r.reason?.toLowerCase().includes(q)
        }
        return true
    }), [requests, filterStatus, searchQuery])

    // ── useMemo: stats — tidak recompute setiap render ────────────────────────
    const stats = useMemo(() => ({
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        totalHours: requests
            .filter(r => r.status === 'approved')
            .reduce((s, r) => s + (parseFloat(r.total_hours) || 0), 0),
    }), [requests])

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Breadcrumbs />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Pengajuan Lembur</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola semua pengajuan lembur karyawan</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-11 px-5 shadow-lg shadow-primary/20 gap-2">
                            <Plus className="w-4 h-4" /> Tambah Lembur
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black">Tambah Lembur Karyawan</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 mt-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Karyawan</Label>
                                <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue placeholder="Pilih karyawan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map(emp => (
                                            <SelectItem key={emp.id} value={emp.id}>
                                                {emp.profiles?.full_name} — {emp.department}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Tanggal Lembur</Label>
                                <Input type="date" value={form.overtime_date} onChange={e => setForm({ ...form, overtime_date: e.target.value })} className="h-11 rounded-xl" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Jam Mulai</Label>
                                    <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="h-11 rounded-xl" required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Jam Selesai</Label>
                                    <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="h-11 rounded-xl" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Alasan</Label>
                                <Textarea
                                    value={form.reason}
                                    onChange={e => setForm({ ...form, reason: e.target.value })}
                                    placeholder="Jelaskan alasan lembur..."
                                    className="rounded-xl min-h-[60px] resize-none"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Tugas yang Diselesaikan</Label>
                                <Textarea
                                    value={form.tasks_completed}
                                    onChange={e => setForm({ ...form, tasks_completed: e.target.value })}
                                    placeholder="Apa saja yang dikerjakan saat lembur..."
                                    className="rounded-xl min-h-[60px] resize-none"
                                    required
                                />
                            </div>
                            <DialogFooter className="gap-2 pt-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost" className="rounded-xl font-bold">Batal</Button>
                                </DialogClose>
                                <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl gap-2">
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Pengajuan', value: stats.total, icon: Users, color: 'from-slate-500 to-slate-600' },
                    { label: 'Menunggu Review', value: stats.pending, icon: AlertCircle, color: 'from-amber-500 to-orange-500' },
                    { label: 'Disetujui', value: stats.approved, icon: CheckCircle2, color: 'from-emerald-500 to-green-600' },
                    { label: 'Total Jam (Disetujui)', value: `${stats.totalHours.toFixed(1)}h`, icon: TrendingUp, color: 'from-blue-500 to-indigo-600' },
                ].map(stat => (
                    <Card key={stat.label} className="rounded-2xl border-none shadow-lg p-5 bg-white relative overflow-hidden group hover:shadow-xl transition-shadow">
                        <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-5 rounded-full -translate-y-6 translate-x-6 group-hover:opacity-10 transition-opacity`} />
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                            <stat.icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-900 mt-0.5">{stat.value}</p>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="rounded-2xl border-none shadow-lg p-4 bg-white">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Cari nama, divisi, atau alasan..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-100"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'pending', 'approved', 'rejected'].map(s => (
                            <Button
                                key={s}
                                variant={filterStatus === s ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setFilterStatus(s)}
                                className={`rounded-xl font-bold text-xs ${filterStatus === s ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                {s === 'all' ? 'Semua' : STATUS_MAP[s]?.label}
                                {s === 'pending' && stats.pending > 0 && (
                                    <span className="ml-1.5 bg-amber-400 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{stats.pending}</span>
                                )}
                            </Button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card className="rounded-2xl border-none shadow-lg overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="text-left px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Karyawan</th>
                                <th className="text-left px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Tanggal</th>
                                <th className="text-left px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Waktu</th>
                                <th className="text-left px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Durasi</th>
                                <th className="text-left px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Alasan</th>
                                <th className="text-left px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Status</th>
                                <th className="text-left px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* ── Skeleton rows saat loading — konten langsung terlihat ── */}
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-slate-50">
                                        {[...Array(7)].map((_, j) => (
                                            <td key={j} className="px-5 py-4">
                                                <Skeleton className={`h-4 ${j === 0 ? 'w-32' : j === 4 ? 'w-28' : 'w-16'}`} />
                                                {j === 0 && <Skeleton className="h-3 w-24 mt-1.5" />}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16">
                                        <Timer className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-slate-400">Belum ada pengajuan lembur</p>
                                        <p className="text-xs text-slate-300 mt-1">Pengajuan lembur karyawan akan muncul di sini</p>
                                    </td>
                                </tr>
                            ) : filtered.map(req => {
                                const statusInfo = STATUS_MAP[req.status]
                                const StatusIcon = statusInfo?.icon || Clock
                                return (
                                    <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{req.employees?.profiles?.full_name}</p>
                                                <p className="text-[11px] text-slate-400 font-semibold">{req.employees?.department} • {req.employees?.job_title}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {new Date(req.overtime_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-700 font-semibold text-sm">
                                            {req.start_time?.slice(0, 5)} — {req.end_time?.slice(0, 5)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="font-black text-slate-900">{parseFloat(req.total_hours || 0).toFixed(1)}h</span>
                                        </td>
                                        <td className="px-5 py-3.5 max-w-[200px]">
                                            <p className="text-slate-600 text-sm truncate" title={req.reason}>{req.reason}</p>
                                            <p className="text-slate-400 text-[10px] truncate" title={req.tasks_completed}>Tugas: {req.tasks_completed}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <Badge className={`${statusInfo?.color} border font-bold text-[11px] gap-1 rounded-lg px-2.5 py-1`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusInfo?.label}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {req.status === 'pending' && (
                                                <div className="flex gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 px-3 rounded-lg text-emerald-600 hover:bg-emerald-50 font-bold text-xs gap-1"
                                                        onClick={() => { setReviewDialog({ open: true, request: req }); setReviewNote('') }}
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Review
                                                    </Button>
                                                </div>
                                            )}
                                            {req.status !== 'pending' && req.review_note && (
                                                <p className="text-[11px] text-slate-400 italic max-w-[150px] truncate" title={req.review_note}>
                                                    {req.review_note}
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Review Dialog */}
            <Dialog open={reviewDialog.open} onOpenChange={(open) => setReviewDialog({ open, request: open ? reviewDialog.request : null })}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black">Review Pengajuan Lembur</DialogTitle>
                    </DialogHeader>
                    {reviewDialog.request && (
                        <div className="space-y-4 mt-2">
                            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                                <p className="font-bold text-slate-900 text-base">{reviewDialog.request.employees?.profiles?.full_name}</p>
                                <p className="text-xs text-slate-500 mb-2">
                                    {new Date(reviewDialog.request.overtime_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-sm font-semibold text-slate-700">
                                    {reviewDialog.request.start_time?.slice(0, 5)} — {reviewDialog.request.end_time?.slice(0, 5)}
                                    <span className="ml-2 text-primary font-black">({parseFloat(reviewDialog.request.total_hours || 0).toFixed(1)} jam)</span>
                                </p>
                                
                                <div className="mt-3 pt-3 border-t border-slate-200/60">
                                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Alasan</p>
                                    <p className="text-sm text-slate-600 bg-white p-2 rounded-lg border border-slate-100">{reviewDialog.request.reason}</p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Tugas Diselesaikan</p>
                                    <p className="text-sm text-slate-600 bg-white p-2 rounded-lg border border-slate-100 whitespace-pre-wrap">{reviewDialog.request.tasks_completed}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Catatan Review (Opsional)</Label>
                                <Textarea
                                    value={reviewNote}
                                    onChange={e => setReviewNote(e.target.value)}
                                    placeholder="Tambahkan catatan..."
                                    className="rounded-xl min-h-[60px] resize-none"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button
                                    onClick={() => handleReview('rejected')}
                                    disabled={submitting}
                                    variant="ghost"
                                    className="flex-1 h-11 rounded-xl font-bold text-red-600 hover:bg-red-50 border border-red-200 gap-2"
                                >
                                    <XCircle className="w-4 h-4" /> Tolak
                                </Button>
                                <Button
                                    onClick={() => handleReview('approved')}
                                    disabled={submitting}
                                    className="flex-1 h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Setujui
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
