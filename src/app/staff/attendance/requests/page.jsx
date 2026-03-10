'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    CalendarDays, Clock, FileText, ChevronRight,
    CheckCircle2, AlertCircle, Loader2, Plus, FolderOpen
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AttendanceRequestsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [employee, setEmployee] = useState(null)
    const [balances, setBalances] = useState([])
    const [requests, setRequests] = useState([])
    const [leaveTypes, setLeaveTypes] = useState([])

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)

    const [formData, setFormData] = useState({
        type: 'LEAVE', // 'LEAVE', 'SICK', 'PERMISSION', 'CORRECTION', 'EARLY_LEAVE'
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
        time_in: '',
        time_out: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: emp } = await supabase
            .from('employees')
            .select('id, company_id')
            .eq('profile_id', user.id)
            .single()

        if (emp) {
            setEmployee(emp)

            // Fetch balances
            const currentYear = new Date().getFullYear()
            const { data: bals } = await supabase
                .from('leave_balances')
                .select(`
                    id, year, balance, used,
                    leave_types ( id, name, code, is_paid )
                `)
                .eq('employee_id', emp.id)
                .eq('year', currentYear)
            setBalances(bals || [])

            // Fetch leave types for the company
            const { data: types } = await supabase
                .from('leave_types')
                .select('*')
                .eq('company_id', emp.company_id)
            setLeaveTypes(types || [])

            if (types && types.length > 0) {
                setFormData(prev => ({ ...prev, leave_type_id: types[0].id }))
            }

            // Fetch requests
            const { data: reqs } = await supabase
                .from('attendance_requests')
                .select(`
                    id, type, start_date, end_date, time_in, time_out, reason, status, created_at, rejection_reason,
                    leave_types ( name )
                `)
                .eq('employee_id', emp.id)
                .order('created_at', { ascending: false })
            setRequests(reqs || [])
        }
        setLoading(false)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!employee) return
        setError(null)
        setSubmitting(true)

        // Validation based on type
        if (formData.start_date > formData.end_date) {
            setError('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.')
            setSubmitting(false)
            return
        }

        const payload = {
            employee_id: employee.id,
            company_id: employee.company_id,
            type: formData.type,
            start_date: formData.start_date,
            end_date: formData.end_date || formData.start_date,
            reason: formData.reason,
            status: 'PENDING'
        }

        if (formData.type === 'LEAVE' || formData.type === 'SICK' || formData.type === 'PERMISSION') {
            if (formData.type === 'LEAVE') {
                payload.leave_type_id = formData.leave_type_id
            }
        }
        // CORRECTION & EARLY_LEAVE: time_in/time_out will be set by HR/Admin upon approval — NOT by employee

        const { error: insErr } = await supabase.from('attendance_requests').insert(payload)

        if (insErr) {
            setError(insErr.message)
        } else {
            setIsFormOpen(false)
            setFormData({
                type: 'LEAVE',
                leave_type_id: leaveTypes[0]?.id || '',
                start_date: '',
                end_date: '',
                reason: '',
                time_in: '',
                time_out: ''
            })
            fetchData()
        }
        setSubmitting(false)
    }

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Disetujui</Badge>
            case 'REJECTED': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Ditolak</Badge>
            default: return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Menunggu</Badge>
        }
    }

    const typeLabels = {
        'LEAVE': 'CutiTahunan',
        'SICK': 'Sakit',
        'PERMISSION': 'Izin Khusus',
        'CORRECTION': 'Koreksi Absen',
        'EARLY_LEAVE': 'Pulang Cepat'
    }

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Izin & Cuti</h1>
                <p className="text-slate-500 font-medium">Ajukan ketidakhadiran, cuti tahunan, atau koreksi absen Anda di sini.</p>
            </div>

            {/* Balances Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {balances.length === 0 ? (
                    <Card className="p-6 md:col-span-3 bg-slate-50 border-dashed text-center flex flex-col items-center justify-center">
                        <FolderOpen className="w-8 h-8 text-slate-300 mb-3" />
                        <p className="text-slate-500 text-sm font-medium">Belum ada saldo cuti yang diatribusikan ke Anda untuk tahun ini.</p>
                    </Card>
                ) : (
                    balances.map(b => (
                        <Card key={b.id} className="p-6 flex flex-col border-slate-200/60 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0" />
                            <div className="relative z-10 flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-bold text-slate-900">{b.leave_types?.name}</h3>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Tahun {b.year}</p>
                                </div>
                                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <CalendarDays className="w-5 h-5 text-primary" />
                                </div>
                            </div>
                            <div className="mt-auto relative z-10">
                                <span className="text-4xl font-black text-slate-900">{b.balance}</span>
                                <span className="text-slate-500 font-bold ml-2">Hari Tersisa</span>
                                <p className="text-xs text-slate-400 font-medium mt-3">Terpakai: {b.used} hari</p>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* List & Form Card */}
            <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Riwayat Pengajuan</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">Pantau status persetujuan dari atasan Anda.</p>
                    </div>
                    <Button onClick={() => setIsFormOpen(!isFormOpen)} className="bg-primary hover:bg-primary/90 rounded-xl px-6 font-bold shadow-md shadow-primary/20">
                        {isFormOpen ? 'Tutup Formulir' : 'Buat Pengajuan'} <Plus className={`w-4 h-4 ml-2 transition-transform ${isFormOpen ? 'rotate-45' : ''}`} />
                    </Button>
                </div>

                {isFormOpen && (
                    <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-200">
                        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                                    <p className="text-sm font-semibold text-rose-800">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Jenis Pengajuan</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="LEAVE">Cuti Tahunan</option>
                                    <option value="SICK">Sakit</option>
                                    <option value="PERMISSION">Izin Khusus</option>
                                    <option value="CORRECTION">Koreksi Absen (Lupa Absen)</option>
                                    <option value="EARLY_LEAVE">Pulang Cepat</option>
                                </select>
                            </div>

                            {formData.type === 'LEAVE' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tipe Cuti</label>
                                    <select
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={formData.leave_type_id}
                                        onChange={e => setFormData({ ...formData, leave_type_id: e.target.value })}
                                        required
                                    >
                                        {leaveTypes.map(lt => (
                                            <option key={lt.id} value={lt.id}>{lt.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tanggal Mulai</label>
                                    <input
                                        type="date" required
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value, end_date: e.target.value /* auto forward */ })}
                                    />
                                </div>
                                {['LEAVE', 'SICK', 'PERMISSION'].includes(formData.type) && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tanggal Selesai</label>
                                        <input
                                            type="date" required
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={formData.end_date}
                                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            {(formData.type === 'CORRECTION' || formData.type === 'EARLY_LEAVE') && (
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-blue-800">Waktu akan dikonfirmasi oleh Admin/HR</p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            {formData.type === 'CORRECTION'
                                                ? 'Jam datang dan pulang yang benar akan diisi oleh Admin setelah pengajuan ini diverifikasi.'
                                                : 'Jam pulang cepat akan dicatat dan diverifikasi oleh Admin/HR.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Keterangan / Alasan</label>
                                <textarea
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none min-h-24"
                                    placeholder="Jelaskan secara detail..."
                                    required
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={submitting} className="bg-slate-900 hover:bg-slate-800 rounded-xl px-8 font-bold shadow-md shadow-slate-900/10">
                                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Kirim Pengajuan
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="divide-y divide-slate-100">
                    {requests.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-medium">Belum ada riwayat pengajuan.</div>
                    ) : (
                        requests.map(r => (
                            <div key={r.id} className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div className="flex gap-4 items-start">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                                        {['LEAVE', 'SICK', 'PERMISSION'].includes(r.type) ? <CalendarDays className="w-6 h-6 text-indigo-400" /> : <Clock className="w-6 h-6 text-indigo-400" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-extrabold text-slate-900">{r.type === 'LEAVE' && r.leave_types ? r.leave_types.name : typeLabels[r.type]}</h3>
                                            {renderStatusBadge(r.status)}
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium my-2">
                                            {new Date(r.start_date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                                            {r.end_date !== r.start_date ? ` — ${new Date(r.end_date).toLocaleDateString('id-ID', { dateStyle: 'long' })}` : ''}
                                        </p>
                                        <p className="text-sm font-medium text-slate-600 border-l-2 border-slate-200 pl-3 py-1">"{r.reason}"</p>
                                        {r.status === 'REJECTED' && r.rejection_reason && (
                                            <p className="text-xs font-semibold text-rose-600 mt-2 bg-rose-50 px-3 py-1.5 rounded-lg inline-block">Alasan Penolakan: {r.rejection_reason}</p>
                                        )}
                                    </div>
                                </div>

                                {['CORRECTION', 'EARLY_LEAVE'].includes(r.type) && (r.time_in || r.time_out) && (
                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest mx-0 md:mx-auto">
                                        {r.time_in ? new Date(r.time_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        <ChevronRight className="w-4 h-4 text-slate-300" />
                                        {r.time_out ? new Date(r.time_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    )
}
