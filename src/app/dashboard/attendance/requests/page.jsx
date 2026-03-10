'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    CalendarDays, Clock, FileText, CheckCircle2,
    XCircle, Loader2, Plus, ArrowLeft, Settings2
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function HRRequestsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [company, setCompany] = useState(null)
    const [profile, setProfile] = useState(null)
    const [requests, setRequests] = useState([])
    const [leaveTypes, setLeaveTypes] = useState([])
    const [employees, setEmployees] = useState([])
    const [balances, setBalances] = useState([])
    const [activeTab, setActiveTab] = useState('requests') // requests | types | balances

    const [submittingId, setSubmittingId] = useState(null)
    const [rejectionReason, setRejectionReason] = useState('')
    const [rejectingId, setRejectingId] = useState(null)
    const [approvingCorrectionId, setApprovingCorrectionId] = useState(null) // req.id that is in time-entry mode
    const [correctionTimes, setCorrectionTimes] = useState({ time_in: '', time_out: '' })

    const [newLeaveType, setNewLeaveType] = useState({ name: '', code: '', is_paid: true, deducts_annual_leave: false })
    const [savingType, setSavingType] = useState(false)
    const [editingLeaveType, setEditingLeaveType] = useState(null) // null = create mode, object = edit mode

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: prof } = await supabase.from('profiles').select('id, company_id, role').eq('id', user.id).single()
        if (!prof?.company_id) return
        setProfile(prof)

        const { data: comp } = await supabase.from('companies').select('id, name').eq('id', prof.company_id).single()
        setCompany(comp)

        // Fetch Leave Types
        const { data: types } = await supabase
            .from('leave_types')
            .select('*')
            .eq('company_id', prof.company_id)
            .order('created_at', { ascending: true })
        setLeaveTypes(types || [])

        // Fetch Requests - specify FK via column name to avoid ambiguity (employee_id vs approved_by)
        const { data: reqs, error: reqsError } = await supabase
            .from('attendance_requests')
            .select(`
                *,
                employee:employee_id (
                    id, job_title,
                    profiles!employees_profile_id_fkey(full_name)
                ),
                leave_types ( name, deducts_annual_leave )
            `)
            .eq('company_id', prof.company_id)
            .order('created_at', { ascending: false })
        if (reqsError) console.error('❌ Requests fetch error:', reqsError?.message || reqsError?.code || reqsError?.hint || JSON.stringify(reqsError))
        setRequests(reqs || [])

        // Fetch Employees for balances
        const { data: emps } = await supabase
            .from('employees')
            .select(`id, profiles!employees_profile_id_fkey(full_name)`)
            .eq('company_id', prof.company_id)
        setEmployees(emps || [])

        // Fetch Balances
        const currentYear = new Date().getFullYear()
        const { data: bals } = await supabase
            .from('leave_balances')
            .select(`*, employees(profiles!employees_profile_id_fkey(full_name)), leave_types(name)`)
            .eq('company_id', prof.company_id)
            .eq('year', currentYear)
        setBalances(bals || [])

        setLoading(false)
    }

    async function handleApprove(req, verifiedTimes = null) {
        setSubmittingId(req.id)
        try {
            // 1. Update Request status
            await supabase.from('attendance_requests').update({
                status: 'APPROVED',
                approved_by: null,
                approved_at: new Date().toISOString()
            }).eq('id', req.id)

            // 2. Business Logic
            if (req.type === 'LEAVE' && req.leave_types?.deducts_annual_leave) {
                const start = new Date(req.start_date)
                const end = new Date(req.end_date)
                const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1
                const currentYear = new Date().getFullYear()

                const { data: bals } = await supabase.from('leave_balances')
                    .select('id, balance, used')
                    .eq('employee_id', req.employee_id)
                    .eq('leave_type_id', req.leave_type_id)
                    .eq('year', currentYear)
                    .single()

                if (bals) {
                    await supabase.from('leave_balances').update({
                        balance: bals.balance - diffDays,
                        used: bals.used + diffDays
                    }).eq('id', bals.id)
                }
            } else if (req.type === 'CORRECTION' || req.type === 'EARLY_LEAVE') {
                // Use HR-verified times (not employee-submitted)
                const clockIn = verifiedTimes?.time_in ? `${req.start_date}T${verifiedTimes.time_in}:00` : null
                const clockOut = verifiedTimes?.time_out ? `${req.start_date}T${verifiedTimes.time_out}:00` : null

                const { data: existingAtt } = await supabase.from('attendances')
                    .select('id')
                    .eq('employee_id', req.employee_id)
                    .eq('date', req.start_date)
                    .single()

                if (existingAtt) {
                    const updatePayload = { status: req.type === 'EARLY_LEAVE' ? 'early_leave' : 'present', approval_status: 'approved' }
                    if (clockIn) updatePayload.clock_in = clockIn
                    if (clockOut) updatePayload.clock_out = clockOut
                    await supabase.from('attendances').update(updatePayload).eq('id', existingAtt.id)
                } else {
                    await supabase.from('attendances').insert({
                        employee_id: req.employee_id,
                        company_id: req.company_id,
                        date: req.start_date,
                        clock_in: clockIn,
                        clock_out: clockOut,
                        status: req.type === 'EARLY_LEAVE' ? 'early_leave' : 'present',
                        is_manual: true,
                        manual_reason: req.reason,
                        approval_status: 'approved'
                    })
                }
            }

            setApprovingCorrectionId(null)
            setCorrectionTimes({ time_in: '', time_out: '' })
            fetchData()
        } catch (err) {
            console.error('Approve Error', err)
            alert('Gagal menyetujui: ' + err.message)
        }
        setSubmittingId(null)
    }

    async function handleReject(reqId) {
        if (!rejectionReason.trim()) {
            alert('Alasan penolakan harus diisi.')
            return
        }
        setSubmittingId(reqId)
        await supabase.from('attendance_requests').update({
            status: 'REJECTED',
            rejection_reason: rejectionReason,
            approved_by: null,
            approved_at: new Date().toISOString()
        }).eq('id', reqId)

        setRejectingId(null)
        setRejectionReason('')
        setSubmittingId(null)
        fetchData()
    }

    async function handleSaveLeaveType(e) {
        e.preventDefault()
        setSavingType(true)

        if (editingLeaveType) {
            // UPDATE mode
            const { error } = await supabase.from('leave_types').update({
                name: newLeaveType.name,
                code: newLeaveType.code.toUpperCase(),
                is_paid: newLeaveType.is_paid,
                deducts_annual_leave: newLeaveType.deducts_annual_leave
            }).eq('id', editingLeaveType.id)
            if (error) alert(error.message)
            else {
                setEditingLeaveType(null)
                setNewLeaveType({ name: '', code: '', is_paid: true, deducts_annual_leave: false })
                fetchData()
            }
        } else {
            // INSERT mode
            const { error } = await supabase.from('leave_types').insert({
                company_id: company.id,
                ...newLeaveType,
                code: newLeaveType.code.toUpperCase()
            })
            if (!error) {
                setNewLeaveType({ name: '', code: '', is_paid: true, deducts_annual_leave: false })
                fetchData()
            } else {
                alert(error.message)
            }
        }
        setSavingType(false)
    }

    async function handleDeleteLeaveType(lt) {
        if (!confirm(`Hapus tipe "${lt.name}"? Ini akan menghapus semua saldo karyawan untuk tipe ini.`)) return
        const { error } = await supabase.from('leave_types').delete().eq('id', lt.id)
        if (error) alert(error.message)
        else fetchData()
    }

    async function handleAllocateBalance(employeeId, leaveTypeId, amount) {
        const parsed = parseInt(amount, 10)
        if (isNaN(parsed) || parsed < 0) {
            alert('Saldo tidak boleh negatif atau kosong.')
            return
        }
        setLoading(true)
        const currentYear = new Date().getFullYear()

        // Find existing balance to preserve `used` count
        const existing = balances.find(
            b => b.employee_id === employeeId && b.leave_type_id === leaveTypeId
        )

        const { error } = await supabase.from('leave_balances').upsert({
            company_id: company.id,
            employee_id: employeeId,
            leave_type_id: leaveTypeId,
            year: currentYear,
            balance: parsed,
            used: existing?.used ?? 0   // preserve existing usage, don't reset
        }, { onConflict: 'employee_id, leave_type_id, year' })

        if (error) alert(error.message)
        await fetchData()
    }

    const typeLabels = {
        'LEAVE': 'Cuti/Izin Default',
        'SICK': 'Sakit',
        'PERMISSION': 'Izin Khusus',
        'CORRECTION': 'Koreksi Absen',
        'EARLY_LEAVE': 'Pulang Cepat'
    }

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>

    return (
        <div className="space-y-8 pb-20 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/attendance" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm transition-all hover:scale-105">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen <span className="text-rose-500 italic">Izin & Eksepsi</span></h1>
                    <p className="text-slate-500 font-medium">Setujui cuti, koreksi absen, atau atur kebijakan time-off.</p>
                </div>
            </div>

            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit flex-wrap">
                <button onClick={() => setActiveTab('requests')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'requests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>
                    <FileText className="w-3.5 h-3.5" /> Daftar Pengajuan
                </button>
                <button onClick={() => setActiveTab('types')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'types' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>
                    <Settings2 className="w-3.5 h-3.5" /> Tipe Cuti & Aturan
                </button>
                <button onClick={() => setActiveTab('balances')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'balances' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>
                    <CalendarDays className="w-3.5 h-3.5" /> Distribusi Saldo
                </button>
            </div>

            {activeTab === 'requests' && (
                <div className="grid grid-cols-1 gap-4">
                    {requests.length === 0 ? (
                        <Card className="p-12 text-center flex flex-col items-center justify-center bg-slate-50 border-dashed">
                            <CheckCircle2 className="w-10 h-10 text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-500">Hebat! Semua perizinan beres.</h3>
                            <p className="text-slate-400 font-medium text-sm">Semua pengajuan cuti dan izin telah selesai ditinjau.</p>
                        </Card>
                    ) : (
                        requests.map(req => (
                            <Card key={req.id} className="p-6 overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex gap-4 items-start flex-1">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                                            {req.status === 'PENDING' ? <Clock className="w-6 h-6 text-amber-500" /> :
                                                req.status === 'APPROVED' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> :
                                                    <XCircle className="w-6 h-6 text-rose-500" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-extrabold text-slate-900 text-lg">
                                                    {req.type === 'LEAVE' && req.leave_types ? req.leave_types.name : typeLabels[req.type]}
                                                </h3>
                                                {req.status === 'PENDING' && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Menunggu</Badge>}
                                                {req.status === 'APPROVED' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Disetujui</Badge>}
                                                {req.status === 'REJECTED' && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Ditolak</Badge>}
                                            </div>
                                            <p className="text-slate-600 font-bold mb-3">{req.employee?.profiles?.full_name} <span className="text-slate-400 font-medium">({req.employee?.job_title})</span></p>

                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 max-w-2xl">
                                                <div className="grid grid-cols-2 gap-4 mb-3">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Tanggal Mulai</p>
                                                        <p className="text-sm font-bold text-slate-700">{new Date(req.start_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
                                                    </div>
                                                    {req.start_date !== req.end_date && (
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Tanggal Selesai</p>
                                                            <p className="text-sm font-bold text-slate-700">{new Date(req.end_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {(req.time_in || req.time_out) && (
                                                    <div className="flex items-center gap-4 mb-3 pb-3 border-b border-slate-200">
                                                        {req.time_in && <p className="text-sm font-bold"><span className="text-slate-400 font-medium text-xs">Pukul (In): </span> {new Date(req.time_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>}
                                                        {req.time_out && <p className="text-sm font-bold"><span className="text-slate-400 font-medium text-xs">Pukul (Out): </span> {new Date(req.time_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>}
                                                    </div>
                                                )}

                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-2">Alasan & Justifikasi</p>
                                                <p className="text-sm font-medium text-slate-600">{req.reason}</p>
                                            </div>

                                            {req.status === 'REJECTED' && req.rejection_reason && (
                                                <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl max-w-xl">
                                                    <p className="text-xs font-bold text-rose-800">Alasan Penolakan: {req.rejection_reason}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {req.status === 'PENDING' && (
                                        <div className="flex flex-col gap-2 min-w-[140px]">
                                            {rejectingId === req.id ? (
                                                <div className="flex flex-col gap-2">
                                                    <textarea
                                                        className="text-xs p-2 border border-slate-200 rounded min-h-[60px]"
                                                        placeholder="Alasan ditolak..."
                                                        value={rejectionReason}
                                                        onChange={e => setRejectionReason(e.target.value)}
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button onClick={() => handleReject(req.id)} size="sm" variant="destructive" className="flex-1 text-xs" disabled={submittingId === req.id}>
                                                            Tolak Final
                                                        </Button>
                                                        <Button onClick={() => setRejectingId(null)} size="sm" variant="outline" className="text-xs">Batal</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <Button onClick={() => handleApprove(req)} size="sm" className="bg-emerald-500 hover:bg-emerald-600 font-bold" disabled={submittingId === req.id}>
                                                        {submittingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Setujui
                                                    </Button>
                                                    <Button onClick={() => setRejectingId(req.id)} size="sm" variant="outline" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold bg-white" disabled={submittingId === req.id}>
                                                        <XCircle className="w-4 h-4 mr-2" /> Tolak
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'types' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-black text-slate-900 mb-1">
                            {editingLeaveType ? '✏️ Edit Tipe Cuti' : 'Tambah Tipe Cuti / Izin'}
                        </h3>
                        {editingLeaveType && (
                            <p className="text-xs text-slate-400 font-medium mb-4">Mengedit: <span className="font-bold text-slate-700">{editingLeaveType.name}</span></p>
                        )}
                        <form onSubmit={handleSaveLeaveType} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Tipe</label>
                                <input type="text" required value={newLeaveType.name} onChange={e => setNewLeaveType({ ...newLeaveType, name: e.target.value })} placeholder="Cth: Cuti Tahunan, Menikah" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Kode Unik</label>
                                <input type="text" required value={newLeaveType.code} onChange={e => setNewLeaveType({ ...newLeaveType, code: e.target.value.toUpperCase() })} placeholder="ANNUAL, MARRIAGE" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm" />
                            </div>
                            <div className="flex items-center gap-3 mt-4">
                                <input type="checkbox" id="paid" checked={newLeaveType.is_paid} onChange={e => setNewLeaveType({ ...newLeaveType, is_paid: e.target.checked })} className="w-4 h-4" />
                                <label htmlFor="paid" className="text-sm font-bold text-slate-700">Dibayar (Paid Leave)</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="deduct" checked={newLeaveType.deducts_annual_leave} onChange={e => setNewLeaveType({ ...newLeaveType, deducts_annual_leave: e.target.checked })} className="w-4 h-4" />
                                <label htmlFor="deduct" className="text-sm font-bold text-rose-600">Memotong Saldo Cuti Utama?</label>
                            </div>
                            <div className="pt-4 flex gap-2">
                                <Button type="submit" disabled={savingType} className={`flex-1 justify-center font-bold ${editingLeaveType ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900'}`}>
                                    {savingType ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {editingLeaveType ? 'Simpan Perubahan' : 'Simpan Aturan'}
                                </Button>
                                {editingLeaveType && (
                                    <Button type="button" variant="outline" className="font-bold" onClick={() => {
                                        setEditingLeaveType(null)
                                        setNewLeaveType({ name: '', code: '', is_paid: true, deducts_annual_leave: false })
                                    }}>Batal</Button>
                                )}
                            </div>
                        </form>
                    </Card>

                    <div className="space-y-3">
                        <h3 className="text-lg font-black text-slate-900 mb-2">Daftar Aturan Aktif</h3>
                        {leaveTypes.length === 0 && (
                            <p className="text-sm text-slate-400 italic">Belum ada tipe cuti. Tambahkan di sebelah kiri.</p>
                        )}
                        {leaveTypes.map(lt => (
                            <div key={lt.id} className={`bg-white border rounded-2xl p-4 shadow-sm transition-all ${editingLeaveType?.id === lt.id ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900">{lt.name}</h4>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                            {lt.is_paid ? 'Berbayar' : 'Tidak Berbayar'}
                                            {lt.deducts_annual_leave && <span className="ml-2 text-rose-500 font-bold">· Memotong Saldo</span>}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 ml-3">
                                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 shrink-0">{lt.code}</Badge>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="w-8 h-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 shrink-0"
                                            onClick={() => {
                                                setEditingLeaveType(lt)
                                                setNewLeaveType({ name: lt.name, code: lt.code, is_paid: lt.is_paid, deducts_annual_leave: lt.deducts_annual_leave })
                                            }}
                                        >
                                            <Settings2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="w-8 h-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                                            onClick={() => handleDeleteLeaveType(lt)}
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'balances' && (
                <div className="space-y-4">
                    <div className="flex items-end justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Distribusi Saldo Cuti</h3>
                            <p className="text-sm text-slate-500 font-medium mt-1">Tahun {new Date().getFullYear()} — Atur kuota hari per karyawan per tipe cuti.</p>
                        </div>
                        {leaveTypes.length === 0 && (
                            <p className="text-xs text-amber-600 font-bold bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
                                ⚠ Belum ada Tipe Cuti. Buat dulu di tab &quot;Tipe Cuti &amp; Aturan&quot;.
                            </p>
                        )}
                    </div>

                    {employees.length === 0 ? (
                        <Card className="p-12 text-center bg-slate-50 border-dashed">
                            <p className="text-slate-400 font-medium">Belum ada karyawan terdaftar.</p>
                        </Card>
                    ) : (
                        employees.map(emp => {
                            const allocatableTypes = leaveTypes.filter(lt => lt.deducts_annual_leave || lt.is_paid)
                            const empBalances = balances.filter(b => b.employee_id === emp.id)

                            return (
                                <Card key={emp.id} className="overflow-hidden border-slate-200/70 shadow-sm">
                                    {/* Employee Header */}
                                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center font-black text-primary text-sm shrink-0">
                                            {emp.profiles?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900">{emp.profiles?.full_name}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                {allocatableTypes.length > 0 ? `${allocatableTypes.length} tipe cuti aktif` : 'Tidak ada tipe cuti berbayar'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Per-Type Rows */}
                                    {allocatableTypes.length === 0 ? (
                                        <div className="p-6 text-center text-sm text-slate-400 font-medium italic">
                                            Belum ada tipe cuti yang bisa dialokasikan.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">
                                            {allocatableTypes.map(type => {
                                                const bal = empBalances.find(b => b.leave_type_id === type.id)
                                                const quota = bal?.balance ?? 0
                                                const used = bal?.used ?? 0
                                                const pct = quota > 0 ? Math.min(Math.round((used / quota) * 100), 100) : 0

                                                return (
                                                    <div key={type.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                                                        {/* Type Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                <span className="font-bold text-slate-800 text-sm">{type.name}</span>
                                                                <Badge variant="outline" className="text-[10px] px-1.5 font-bold text-slate-500">{type.code}</Badge>
                                                                {type.deducts_annual_leave && (
                                                                    <Badge className="bg-rose-50 text-rose-600 text-[10px] px-1.5 font-bold hover:bg-rose-50">Memotong Saldo</Badge>
                                                                )}
                                                            </div>
                                                            {/* Progress bar */}
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-rose-400' : pct >= 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                                        style={{ width: `${pct}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-500">
                                                                    {used} / {quota} hari terpakai
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Allocate Input */}
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Set Kuota (Hari)</label>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        id={`alloc-${emp.id}-${type.id}`}
                                                                        type="number"
                                                                        min="0"
                                                                        max="365"
                                                                        defaultValue={quota || 12}
                                                                        className="w-20 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-center bg-white"
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            const el = document.getElementById(`alloc-${emp.id}-${type.id}`)
                                                                            handleAllocateBalance(emp.id, type.id, el.value)
                                                                        }}
                                                                        className={`font-bold h-9 px-4 ${bal ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                                                                    >
                                                                        {bal ? 'Update' : 'Alokasikan'}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </Card>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}
