'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
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
    Clock,
    Plus,
    CheckCircle2,
    XCircle,
    Loader2,
    Timer,
    Calendar,
    TrendingUp,
    AlertCircle,
    History,
    FileText
} from 'lucide-react'

const STATUS_MAP = {
    pending: { label: 'Menunggu', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    approved: { label: 'Disetujui', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
}

export default function StaffOvertimePage() {
    const supabase = createClient()
    const [employee, setEmployee] = useState(null)
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState('all')

    const [form, setForm] = useState({
        overtime_date: '',
        start_time: '',
        end_time: '',
        reason: '',
        tasks_completed: '',
    })

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: emp } = await supabase
            .from('employees')
            .select('id, company_id, department, job_title, profiles!employees_profile_id_fkey(full_name)')
            .eq('profile_id', user.id)
            .single()

        if (!emp) { setLoading(false); return }
        setEmployee(emp)

        const { data: overtime } = await supabase
            .from('overtime_requests')
            .select('*')
            .eq('employee_id', emp.id)
            .order('created_at', { ascending: false })

        if (overtime) setRequests(overtime)
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    async function handleSubmit(e) {
        e.preventDefault()
        if (!employee) return
        setSubmitting(true)

        const { error } = await supabase.from('overtime_requests').insert({
            employee_id: employee.id,
            company_id: employee.company_id,
            overtime_date: form.overtime_date,
            start_time: form.start_time,
            end_time: form.end_time,
            reason: form.reason,
            tasks_completed: form.tasks_completed,
        })

        if (error) {
            alert('Gagal mengajukan lembur: ' + error.message)
        } else {
            setDialogOpen(false)
            setForm({ overtime_date: '', start_time: '', end_time: '', reason: '', tasks_completed: '' })
            fetchData()
        }
        setSubmitting(false)
    }

    const filtered = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab)

    // Stats
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        totalHours: requests.filter(r => r.status === 'approved').reduce((s, r) => s + (parseFloat(r.total_hours) || 0), 0),
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Pengajuan Lembur</h1>
                    <p className="text-sm text-slate-500 mt-1">Ajukan dan pantau status lembur kamu</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl h-12 px-6 shadow-lg shadow-primary/20 gap-2 text-sm">
                            <Plus className="w-4 h-4" /> Ajukan Lembur
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black">Ajukan Lembur Baru</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Tanggal Lembur</Label>
                                <Input
                                    type="date"
                                    value={form.overtime_date}
                                    onChange={e => setForm({ ...form, overtime_date: e.target.value })}
                                    className="h-11 rounded-xl"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Jam Mulai</Label>
                                    <Input
                                        type="time"
                                        value={form.start_time}
                                        onChange={e => setForm({ ...form, start_time: e.target.value })}
                                        className="h-11 rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Jam Selesai</Label>
                                    <Input
                                        type="time"
                                        value={form.end_time}
                                        onChange={e => setForm({ ...form, end_time: e.target.value })}
                                        className="h-11 rounded-xl"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Alasan Lembur</Label>
                                <Textarea
                                    value={form.reason}
                                    onChange={e => setForm({ ...form, reason: e.target.value })}
                                    placeholder="Jelaskan alasan lembur kamu, misalnya: Deadline proyek aplikasi XYZ..."
                                    className="rounded-xl min-h-[80px] resize-none"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase">Apa yang sudah dikerjakan?</Label>
                                <Textarea
                                    value={form.tasks_completed}
                                    onChange={e => setForm({ ...form, tasks_completed: e.target.value })}
                                    placeholder="Deskripsikan pekerjaan yang telah diselesaikan selama lembur..."
                                    className="rounded-xl min-h-[80px] resize-none"
                                    required
                                />
                            </div>
                            <DialogFooter className="gap-2 pt-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost" className="rounded-xl font-bold">Batal</Button>
                                </DialogClose>
                                <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl gap-2">
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Kirim Pengajuan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total', value: stats.total, icon: History, gradient: 'from-slate-500 to-slate-600' },
                    { label: 'Menunggu', value: stats.pending, icon: AlertCircle, gradient: 'from-amber-500 to-orange-500' },
                    { label: 'Disetujui', value: stats.approved, icon: CheckCircle2, gradient: 'from-emerald-500 to-green-600' },
                    { label: 'Total Jam', value: `${stats.totalHours.toFixed(1)}h`, icon: TrendingUp, gradient: 'from-blue-500 to-indigo-600' },
                ].map(stat => (
                    <Card key={stat.label} className="rounded-2xl border-none shadow-md p-4 bg-white">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-2`}>
                            <stat.icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{stat.label}</p>
                        <p className="text-xl font-black text-slate-900 mt-0.5">{stat.value}</p>
                    </Card>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50 w-fit">
                {['all', 'pending', 'approved', 'rejected'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${activeTab === tab
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab === 'all' ? 'Semua' : STATUS_MAP[tab].label}
                        {tab === 'pending' && stats.pending > 0 && (
                            <span className="ml-1.5 bg-amber-400 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{stats.pending}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Request Cards */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <Card className="rounded-2xl border-none shadow-md p-12 bg-white text-center">
                        <Timer className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="font-bold text-slate-400 text-base">Belum ada pengajuan</p>
                        <p className="text-sm text-slate-300 mt-1">Tekan tombol "Ajukan Lembur" untuk memulai</p>
                    </Card>
                ) : filtered.map(req => {
                    const statusInfo = STATUS_MAP[req.status]
                    const StatusIcon = statusInfo?.icon || Clock

                    return (
                        <Card key={req.id} className="rounded-2xl border-none shadow-md p-5 bg-white hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 min-w-0">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                                        <Calendar className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 text-sm">
                                            {new Date(req.overtime_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-semibold">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {req.start_time?.slice(0, 5)} — {req.end_time?.slice(0, 5)}
                                            </span>
                                            <span className="text-primary font-black">
                                                {parseFloat(req.total_hours || 0).toFixed(1)} jam
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-start gap-1.5">
                                            <FileText className="w-3 h-3 text-slate-300 mt-0.5 shrink-0" />
                                            <p className="text-xs text-slate-500 leading-relaxed">{req.reason}</p>
                                        </div>
                                        {req.review_note && (
                                            <div className="mt-2 p-2.5 bg-slate-50 rounded-xl">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Catatan Reviewer</p>
                                                <p className="text-xs text-slate-600">{req.review_note}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Badge className={`${statusInfo?.color} border font-bold text-[11px] gap-1 rounded-lg px-2.5 py-1 shrink-0`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {statusInfo?.label}
                                </Badge>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
