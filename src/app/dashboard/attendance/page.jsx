'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import {
    Clock, MapPin, Camera,
    CheckCircle2, AlertCircle, Loader2,
    Search, Calendar, User, FileText, MonitorPlay, CalendarDays, Timer
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, ExternalLink, CheckCircle, XCircle, Settings } from 'lucide-react'
import MapWrapper from '@/components/ui/MapWrapper'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import dynamic from 'next/dynamic'

const OfficeLocationPicker = dynamic(() => import('@/components/ui/OfficeLocationPicker'), {
    ssr: false,
    loading: () => <div className="w-full h-64 bg-slate-50 rounded-md animate-pulse flex items-center justify-center text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Memuat Peta...</div>
})

const EMPLOYEE_LIST_LIMIT = 500
const SCHEDULE_LIST_LIMIT = 2000

export default function HRAttendancePage() {
    const supabase = createClient()
    const { profile } = useProfile()
    const [loading, setLoading] = useState(true)
    const [attendances, setAttendances] = useState([])
    const [search, setSearch] = useState('')
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedAtt, setSelectedAtt] = useState(null)

    // settings
    const [company, setCompany] = useState(null)
    const [statusToast, setStatusToast] = useState(null) // { type: 'success' | 'error', message: string }
    const [showSettings, setShowSettings] = useState(false)
    const [savingSettings, setSavingSettings] = useState(false)
    const [activeTab, setActiveTab] = useState('monitoring') // monitoring | shifts | schedules
    const [shifts, setShifts] = useState([])
    const [employees, setEmployees] = useState([])
    const [formSettings, setFormSettings] = useState({ lat: '', lng: '', radius: '' })
    const [detecting, setDetecting] = useState(false)
    const [newShift, setNewShift] = useState({ name: '', clock_in: '', clock_out: '', late_threshold: 0, days: [1, 2, 3, 4, 5] })
    const [selectedShiftId, setSelectedShiftId] = useState(null)
    const [selectedDay, setSelectedDay] = useState(new Date().getDay())
    const [schedules, setSchedules] = useState([])
    const [stagedToggles, setStagedToggles] = useState([]) // Array of empId
    const [stats, setStats] = useState({ present: 0, late: 0, earlyLeave: 0 })

    const today = new Date().toISOString().split('T')[0]

    async function fetchAttendances() {
        if (!profile?.company_id) return
        setLoading(true)
        const companyId = profile.company_id

        // Company, attendances, shifts, and employees are all independent of
        // each other — fetch them together instead of one at a time.
        const [
            { data: comp },
            { data: attData },
            { data: shiftData },
            { data: empData },
        ] = await Promise.all([
            supabase.from('companies').select('*').eq('id', companyId).single(),
            supabase
                .from('attendances')
                .select(`
                    *,
                    employees (
                        job_title,
                        profiles!employees_profile_id_fkey (full_name, avatar_url)
                    )
                `)
                .eq('company_id', companyId)
                .eq('date', filterDate)
                .order('clock_in', { ascending: false })
                .limit(EMPLOYEE_LIST_LIMIT),
            supabase.from('shifts').select('*').eq('company_id', companyId),
            supabase
                .from('employees')
                .select('id, profile_id, job_title, profiles!employees_profile_id_fkey(full_name, email)')
                .eq('company_id', companyId)
                .limit(EMPLOYEE_LIST_LIMIT),
        ])

        if (comp) {
            setCompany(comp)
            setFormSettings({
                lat: comp.office_lat || '',
                lng: comp.office_lng || '',
                radius: comp.office_radius_meters || 100
            })
        }

        setAttendances(attData || [])
        const presentCount = attData?.filter(a => !!a.clock_in).length || 0
        const lateCount = attData?.filter(a => a.status === 'late').length || 0
        const earlyLeaveCount = attData?.filter(a => a.status === 'early_leave').length || 0
        setStats({ present: presentCount, late: lateCount, earlyLeave: earlyLeaveCount })

        setShifts(shiftData || [])
        if (shiftData?.length > 0 && !selectedShiftId) setSelectedShiftId(shiftData[0].id)

        setEmployees(empData || [])

        // Schedules depend on employee IDs resolved above, so this query
        // still has to run after the Promise.all — but it's the only one.
        const empIds = (empData || []).map(e => e.id)
        let schedData = []
        if (empIds.length > 0) {
            const { data: sd } = await supabase
                .from('schedules')
                .select(`
                    id, day_of_week, employee_id, shift_id,
                    shifts(name)
                `)
                .in('employee_id', empIds)
                .order('day_of_week', { ascending: true })
                .limit(SCHEDULE_LIST_LIMIT)
            schedData = sd || []
        }
        setSchedules(schedData)

        setLoading(false)
    }

    useEffect(() => {
        if (profile?.company_id) fetchAttendances()
    }, [filterDate, profile?.company_id])

    const filtered = attendances.filter(a =>
        a.employees?.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
    )

    async function handleVerify(id, status) {
        setLoading(true)
        await supabase.from('attendances').update({ approval_status: status }).eq('id', id)
        setSelectedAtt(prev => ({ ...prev, approval_status: status }))
        await fetchAttendances() // reload table
    }

    async function saveSettings() {
        setSavingSettings(true)
        await supabase.from('companies').update({
            office_lat: parseFloat(formSettings.lat),
            office_lng: parseFloat(formSettings.lng),
            office_radius_meters: parseInt(formSettings.radius) || 100
        }).eq('id', company.id)

        await fetchAttendances()
        setShowSettings(false)
        setSavingSettings(false)
    }

    function detectLocation() {
        setDetecting(true)
        if (!navigator.geolocation) {
            alert('Geolocation tidak didukung browser Anda.')
            setDetecting(false)
            return
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormSettings(prev => ({
                    ...prev,
                    lat: pos.coords.latitude.toFixed(6),
                    lng: pos.coords.longitude.toFixed(6)
                }))
                setDetecting(false)
            },
            (err) => {
                alert('Gagal mendapatkan lokasi: ' + err.message)
                setDetecting(false)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    async function handleAddShift() {
        if (!newShift.name || !newShift.clock_in || !newShift.clock_out) return

        // Validation: Clock In must be before Clock Out
        const [inH, inM] = newShift.clock_in.split(':').map(Number)
        const [outH, outM] = newShift.clock_out.split(':').map(Number)
        const inVal = inH * 60 + inM
        const outVal = outH * 60 + outM

        if (inVal >= outVal) {
            setStatusToast({ type: 'error', message: 'Jam masuk harus lebih awal dari jam pulang!' })
            setTimeout(() => setStatusToast(null), 3000)
            return
        }

        setLoading(true)
        const { error } = await supabase.from('shifts').insert({
            company_id: company.id,
            name: newShift.name,
            clock_in_time: newShift.clock_in,
            clock_out_time: newShift.clock_out,
            late_threshold: parseInt(newShift.late_threshold) || 0,
            days_of_week: newShift.days
        })

        if (error) {
            setStatusToast({ type: 'error', message: 'Gagal menyimpan shift: ' + error.message })
        } else {
            setStatusToast({ type: 'success', message: 'Shift berhasil ditambahkan!' })
            setNewShift({ name: '', clock_in: '', clock_out: '', late_threshold: 0, days: [1, 2, 3, 4, 5] })
        }

        setTimeout(() => setStatusToast(null), 3000)
        await fetchAttendances()
    }

    function handleToggleSchedule(empId) {
        if (!selectedShiftId) return
        setStagedToggles(prev =>
            prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
        )
    }

    async function handleSaveSchedules() {
        if (stagedToggles.length === 0 || !selectedShiftId) return
        setLoading(true)

        const shift = shifts.find(s => s.id === selectedShiftId)
        if (!shift) return

        for (const empId of stagedToggles) {
            const existing = schedules.filter(s => s.employee_id === empId && shift.days_of_week.includes(s.day_of_week))
            const isAllAssigned = existing.length === shift.days_of_week.length && existing.every(e => e.shift_id === selectedShiftId)

            if (isAllAssigned) {
                await supabase.from('schedules').delete().eq('employee_id', empId).in('day_of_week', shift.days_of_week)
            } else {
                const payload = shift.days_of_week.map(day => ({
                    employee_id: empId,
                    shift_id: selectedShiftId,
                    day_of_week: day
                }))
                await supabase.from('schedules').upsert(payload, { onConflict: 'employee_id, day_of_week' })
            }
        }

        setStagedToggles([])
        setStatusToast({ type: 'success', message: `${stagedToggles.length} Jadwal berhasil diperbarui!` })
        setTimeout(() => setStatusToast(null), 3000)
        await fetchAttendances()
    }

    async function toggleShiftStatus(id, current) {
        await supabase.from('shifts').update({ is_active: !current }).eq('id', id)
        await fetchAttendances()
    }

    return (
        <div className="space-y-6 pb-20">
            <Breadcrumbs />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Monitoring Kehadiran</h1>
                    <p className="text-slate-500 font-medium text-sm">Pantau absensi karyawan hari ini secara langsung.</p>
                </div>

                {/* Status Toast */}
                {statusToast && (
                    <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-md shadow-md flex items-center gap-3 ${statusToast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                        {statusToast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="text-sm font-semibold">{statusToast.message}</p>
                    </div>
                )}
                <div className="flex gap-3">
                    <Button onClick={() => setShowSettings(true)} variant="outline" className="h-10 rounded-md gap-2 font-semibold text-slate-600">
                        <Settings className="w-4 h-4" /> Radius & GPS
                    </Button>
                    <Badge className="h-10 px-4 rounded-md bg-blue-50 text-blue-600 border-blue-200 font-semibold text-xs">
                        <Calendar className="w-3.5 h-3.5 mr-2" />
                        {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Badge>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-md w-fit">
                {[
                    { id: 'monitoring', label: 'Monitor Kehadiran', icon: MonitorPlay },
                    { id: 'master', label: 'Master Shift', icon: Clock },
                    { id: 'schedules', label: 'Jadwal Kerja', icon: Calendar },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2 rounded-md text-xs font-semibold transition-colors ${activeTab === tab.id ? 'bg-white text-slate-900' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                        {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                        {tab.label}
                    </button>
                ))}

                {/* External Link disguised as a Tab */}
                <a
                    href="/dashboard/attendance/requests"
                    className="flex items-center gap-2 px-5 py-2 rounded-md text-xs font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors ml-1 border border-rose-200 bg-white"
                >
                    <FileText className="w-3.5 h-3.5" />
                    Manajemen Izin & Eksepsi
                </a>

                <a
                    href="/dashboard/attendance/holidays"
                    className="flex items-center gap-2 px-5 py-2 rounded-md text-xs font-semibold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors ml-1 border border-emerald-200 bg-white"
                >
                    <CalendarDays className="w-3.5 h-3.5" />
                    Kalender Libur
                </a>

                <a
                    href="/dashboard/overtime"
                    className="flex items-center gap-2 px-5 py-2 rounded-md text-xs font-semibold text-violet-600 hover:bg-violet-50 hover:text-violet-700 transition-colors ml-1 border border-violet-200 bg-white"
                >
                    <Timer className="w-3.5 h-3.5" />
                    Kelola Lembur
                </a>
            </div>

            {activeTab === 'monitoring' && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="p-5 rounded-md bg-white flex items-center gap-4">
                            <div className="w-11 h-11 bg-emerald-50 rounded-md flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wide leading-none mb-1">Hadir Hari Ini</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.present}</p>
                            </div>
                        </Card>
                        <Card className="p-5 rounded-md bg-white flex items-center gap-4">
                            <div className="w-11 h-11 bg-amber-50 rounded-md flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wide leading-none mb-1">Terlambat</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.late}</p>
                            </div>
                        </Card>
                        <Card className="p-5 rounded-md bg-white flex items-center gap-4">
                            <div className="w-11 h-11 bg-red-50 rounded-md flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wide leading-none mb-1">Pulang Awal</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.earlyLeave}</p>
                            </div>
                        </Card>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-md border border-slate-200 flex-1">
                            <Search className="w-4 h-4 ml-2 text-slate-400" />
                            <input
                                placeholder="Cari nama karyawan..."
                                className="flex-1 bg-transparent border-none outline-none text-sm font-medium p-1"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-md border border-slate-200">
                            <Calendar className="w-4 h-4 ml-2 text-slate-400" />
                            <input
                                type="date"
                                className="bg-transparent border-none outline-none text-sm font-semibold p-1 text-slate-600"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Attendance Table Card */}
                    <Card className="rounded-md overflow-hidden bg-white">
                        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_2fr_120px] px-6 py-4 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                            <span>Karyawan</span>
                            <span>Masuk</span>
                            <span>Pulang</span>
                            <span>Laporan Harian</span>
                            <span>Status</span>
                        </div>

                        {loading ? (
                            <div className="p-16 text-center">
                                <Loader2 className="w-7 h-7 text-primary animate-spin mx-auto mb-3" />
                                <p className="text-sm font-semibold text-slate-400">Memuat data absensi...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="p-16 text-center">
                                <Camera className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-sm font-medium text-slate-400 italic">Belum ada aktivitas presensi hari ini.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filtered.map(att => (
                                    <div
                                        key={att.id}
                                        onClick={() => setSelectedAtt(att)}
                                        className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_2fr_120px] px-6 py-4 gap-4 items-start hover:bg-slate-50 transition-colors cursor-pointer group"
                                    >
                                        {/* Employee info */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-md bg-brand-50 flex items-center justify-center font-semibold text-primary shrink-0 overflow-hidden relative">
                                                {att.photo_in_url
                                                    ? <img src={att.photo_in_url} className="w-full h-full object-cover" />
                                                    : att.employees?.profiles?.full_name?.charAt(0)
                                                }
                                                {att.photo_in_url && (
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-zoom-in">
                                                        <Camera className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">{att.employees?.profiles?.full_name}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase truncate">{att.employees?.job_title}</p>
                                            </div>
                                        </div>

                                        {/* Clock in */}
                                        <div className="flex flex-col">
                                            <p className="text-sm font-semibold text-slate-700">{att.clock_in ? new Date(att.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}</p>
                                            {att.lat_in && (
                                                <div className="flex items-center gap-1 text-[9px] font-medium text-blue-500 mt-1">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    Lokasi Tersimpan
                                                </div>
                                            )}
                                        </div>

                                        {/* Clock out */}
                                        <div className="flex flex-col">
                                            <p className="text-sm font-semibold text-slate-700">{att.clock_out ? new Date(att.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}</p>
                                            {att.lat_out && (
                                                <div className="flex items-center gap-1 text-[9px] font-medium text-blue-500 mt-1">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    Lokasi Tersimpan
                                                </div>
                                            )}
                                        </div>

                                        {/* Report */}
                                        <div className="pr-4">
                                            {att.daily_report ? (
                                                <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100">
                                                    <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic line-clamp-3">
                                                        "{att.daily_report}"
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-300 font-medium italic">Belum ada laporan</span>
                                            )}
                                        </div>

                                        {/* Status */}
                                        <div className="flex md:justify-end gap-2 flex-wrap">
                                            {att.status === 'late' && (
                                                <Badge className="rounded-md px-2 py-1 text-[9px] font-semibold uppercase bg-red-50 text-red-600 border border-red-200">
                                                    TERLAMBAT
                                                </Badge>
                                            )}
                                            {att.status === 'early_leave' && (
                                                <Badge className="rounded-md px-2 py-1 text-[9px] font-semibold uppercase bg-orange-50 text-orange-600 border border-orange-200">
                                                    PULANG AWAL
                                                </Badge>
                                            )}
                                            {att.approval_status === 'pending' ? (
                                                <Badge className="rounded-md px-2 py-1 text-[9px] font-semibold uppercase bg-amber-50 text-amber-600 border border-amber-200">
                                                    VERIFIKASI
                                                </Badge>
                                            ) : (
                                                <Badge className={`rounded-md px-2 py-1 text-[9px] font-semibold uppercase ${att.clock_out ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {att.clock_out ? 'SELESAI' : 'AKTIF'}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Hint */}
                    <div className="flex items-center gap-3 p-4 bg-brand-50 rounded-md border border-primary/10">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-[11px] font-medium text-slate-600 leading-snug">
                            <span className="font-semibold text-primary">Info:</span> Data absensi ini dicatat berdasarkan waktu server. Foto selfie digunakan sebagai verifikasi wajah untuk mencegah manipulasi absensi.
                        </p>
                    </div>
                </>
            )}

            {activeTab === 'master' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add Shift Form */}
                    <Card className="p-6 rounded-md bg-white h-fit">
                        <h3 className="text-base font-bold text-slate-900 mb-5">Tambah Shift Baru</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Nama Shift</label>
                                <input
                                    placeholder="Cth: Shift Pagi"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={newShift.name} onChange={e => setNewShift(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Jam Masuk</label>
                                    <input
                                        type="time"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-sm font-medium outline-none"
                                        value={newShift.clock_in} onChange={e => setNewShift(p => ({ ...p, clock_in: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Jam Pulang</label>
                                    <input
                                        type="time"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-sm font-medium outline-none"
                                        value={newShift.clock_out} onChange={e => setNewShift(p => ({ ...p, clock_out: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Toleransi Telat (Menit)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-sm font-medium outline-none"
                                    value={newShift.late_threshold} onChange={e => setNewShift(p => ({ ...p, late_threshold: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Hari Kerja</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                const d = newShift.days.includes(i) ? newShift.days.filter(x => x !== i) : [...newShift.days, i]
                                                setNewShift(p => ({ ...p, days: d }))
                                            }}
                                            className={`px-3 py-2 rounded-md text-[10px] font-semibold transition-colors ${newShift.days.includes(i) ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={handleAddShift} className="w-full h-11 rounded-md bg-slate-900 hover:bg-primary font-semibold text-white transition-colors">
                                Simpan Shift
                            </Button>
                        </div>
                    </Card>

                    {/* Shift List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-base font-bold text-slate-900">Daftar Shift Aktif</h3>
                            <Badge className="bg-slate-100 text-slate-500 rounded-md">{shifts.length} Total</Badge>
                        </div>
                        {shifts.length === 0 ? (
                            <div className="p-10 text-center bg-white rounded-md border border-dashed border-slate-200">
                                <p className="text-sm font-medium text-slate-400">Belum ada data shift.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
                                <div className="grid grid-cols-[2fr_1.5fr_1fr_120px] px-6 py-4 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                    <span>Nama Shift</span>
                                    <span>Target Waktu</span>
                                    <span>Status</span>
                                    <span className="text-right">Aksi</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {shifts.map(s => (
                                        <div key={s.id} className="grid grid-cols-[2fr_1.5fr_1fr_120px] px-6 py-4 items-center hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${s.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                <span className="text-sm font-semibold text-slate-700">{s.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-medium text-[10px] border-slate-200">{s.clock_in_time.substring(0, 5)}</Badge>
                                                <span className="text-slate-300">→</span>
                                                <Badge variant="outline" className="font-medium text-[10px] border-slate-200">{s.clock_out_time.substring(0, 5)}</Badge>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => toggleShiftStatus(s.id, s.is_active)}
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${s.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                                                >
                                                    {s.is_active ? 'AKTIF' : 'NONAKTIF'}
                                                </button>
                                            </div>
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="icon" variant="ghost"
                                                    onClick={() => {
                                                        if (confirm('Hapus shift ini?')) {
                                                            supabase.from('shifts').delete().eq('id', s.id).then(() => fetchAttendances())
                                                        }
                                                    }}
                                                    className="w-8 h-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'schedules' && (
                <div className="space-y-6">
                    {/* Shift Picker */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">1. Pilih Shift Kerja</h3>
                        <div className="flex flex-wrap gap-2">
                            {shifts.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedShiftId(s.id)}
                                    className={`px-4 py-2 rounded-md border text-[11px] font-semibold transition-colors ${selectedShiftId === s.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                >
                                    {s.name} ({s.clock_in_time.substring(0, 5)})
                                    <span className="ml-2 opacity-50 font-medium">[{s.days_of_week?.map(d => ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d]).join(',')}]</span>
                                </button>
                            ))}
                            {shifts.length === 0 && <p className="text-xs font-medium text-slate-300 italic">Belum ada shift. Buat dulu di tab Master Shift.</p>}
                        </div>
                    </div>

                    {/* Employee Assignment Grid */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">2. Pilih Karyawan</h3>
                            <Badge className="bg-brand-50 text-primary border-none rounded-md font-semibold text-[10px]">
                                {employees.length} TOTAL KARYAWAN
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {employees.map(emp => {
                                const shiftInfo = shifts.find(s => s.id === selectedShiftId)
                                const empScheds = schedules.filter(s => s.employee_id === emp.id)

                                // Detect if assigned to CURRENT selected shift for its defined days
                                const isAssignedInDB = shiftInfo?.days_of_week?.every(day =>
                                    empScheds.some(s => s.day_of_week === day && s.shift_id === selectedShiftId)
                                )

                                const isPending = stagedToggles.includes(emp.id)
                                const isChecked = isPending ? !isAssignedInDB : isAssignedInDB

                                return (
                                    <Card
                                        key={emp.id}
                                        onClick={() => handleToggleSchedule(emp.id)}
                                        className={`p-4 cursor-pointer transition-colors border rounded-md relative ${isChecked ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-200 hover:border-slate-300'} ${isPending ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                    >
                                        {isPending && (
                                            <div className="absolute -top-2 -right-2 bg-primary text-white text-[8px] font-semibold px-2 py-1 rounded-full z-10">
                                                PENDING
                                            </div>
                                        )}
                                        {isChecked && (
                                            <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-md flex items-center justify-center font-semibold text-base ${isChecked ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                {emp.profiles?.full_name?.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate leading-tight mb-1">{emp.profiles?.full_name}</p>
                                                <p className="text-[9px] font-medium text-slate-400 uppercase">{emp.job_title}</p>
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>

                    {/* Floating Save Button */}
                    {stagedToggles.length > 0 && (
                        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
                            <Button
                                onClick={handleSaveSchedules}
                                disabled={loading}
                                className="h-14 px-8 rounded-md bg-slate-900 hover:bg-emerald-600 text-white font-semibold shadow-md flex items-center gap-3"
                            >
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Siap Disimpan</span>
                                    <span className="text-base">{stagedToggles.length} Perubahan Jadwal</span>
                                </div>
                                <CheckCircle2 className="w-5 h-5" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
            {/* Modal Dialog for Attendance Detail */}
            {selectedAtt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedAtt(null)}>
                    <div className="bg-white rounded-md shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white p-6 border-b border-slate-200 flex items-center justify-between z-10">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-lg text-slate-900 leading-none">Detail Kehadiran</h3>
                                    {selectedAtt.approval_status === 'pending' && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">Menunggu Verifikasi Manual</Badge>}
                                </div>
                                <p className="text-xs font-medium text-slate-500 mt-2">{selectedAtt.employees?.profiles?.full_name} · {selectedAtt.employees?.job_title}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedAtt(null)} className="rounded-md bg-slate-100 hover:bg-slate-200 shrink-0">
                                <X className="w-4 h-4 text-slate-600" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Clock In Block */}
                            {selectedAtt.clock_in && (
                                <div className="space-y-3">
                                    <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                                        <Clock className="w-4 h-4" /> Presensi Masuk: {new Date(selectedAtt.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </h4>
                                    <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 p-4 rounded-md border border-slate-200">
                                        {/* Image */}
                                        <div className="flex-1 rounded-md overflow-hidden border border-slate-200 aspect-video relative bg-slate-200">
                                            {selectedAtt.photo_in_url ? (
                                                <img src={selectedAtt.photo_in_url} className="w-full h-full object-cover transform scale-x-[-1]" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center font-medium text-slate-400 text-xs text-center p-4">Tidak ada foto selfie tersedia.</div>
                                            )}
                                            <Badge className="absolute top-2 left-2 bg-black/80 text-white">Bukti Masuk</Badge>
                                        </div>
                                        {/* Map */}
                                        <div className="flex-1 rounded-md overflow-hidden border border-slate-200 aspect-video relative bg-slate-100 flex flex-col z-0">
                                            {selectedAtt.lat_in ? (
                                                <>
                                                    <MapWrapper
                                                        lat={selectedAtt.lat_in}
                                                        lng={selectedAtt.lng_in}
                                                        officeLat={company?.office_lat}
                                                        officeLng={company?.office_lng}
                                                        officeRadius={company?.office_radius_meters}
                                                    />
                                                    <a href={`https://www.google.com/maps?q=${selectedAtt.lat_in},${selectedAtt.lng_in}`} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 bg-white/90 px-3 py-1.5 rounded-md text-[10px] font-semibold shadow-md flex items-center gap-1.5 hover:bg-primary hover:text-white transition-colors z-10">
                                                        Buka Maps <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center font-medium text-slate-400 text-xs z-10">Lokasi tidak direkam</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Clock Out Block */}
                            {selectedAtt.clock_out && (
                                <div className="space-y-3 pt-4 border-t border-slate-200">
                                    <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                        <Clock className="w-4 h-4" /> Presensi Pulang: {new Date(selectedAtt.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </h4>
                                    <div className="flex flex-col sm:flex-row gap-4 bg-emerald-50 p-4 rounded-md border border-emerald-100">
                                        {/* Image */}
                                        <div className="flex-1 rounded-md overflow-hidden border border-emerald-200 aspect-video relative bg-slate-200">
                                            {selectedAtt.photo_out_url ? (
                                                <img src={selectedAtt.photo_out_url} className="w-full h-full object-cover transform scale-x-[-1]" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center font-medium text-slate-400 text-xs text-center p-4">Tidak ada foto selfie pulang.</div>
                                            )}
                                            <Badge className="absolute top-2 left-2 bg-emerald-600 text-white border-none">Bukti Pulang</Badge>
                                        </div>
                                        {/* Map */}
                                        <div className="flex-1 rounded-md overflow-hidden border border-emerald-200 aspect-video relative bg-slate-100 flex flex-col z-0">
                                            {selectedAtt.lat_out ? (
                                                <>
                                                    <MapWrapper
                                                        lat={selectedAtt.lat_out}
                                                        lng={selectedAtt.lng_out}
                                                        officeLat={company?.office_lat}
                                                        officeLng={company?.office_lng}
                                                        officeRadius={company?.office_radius_meters}
                                                    />
                                                    <a href={`https://www.google.com/maps?q=${selectedAtt.lat_out},${selectedAtt.lng_out}`} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 bg-white/90 px-3 py-1.5 rounded-md text-[10px] font-semibold shadow-md flex items-center gap-1.5 hover:bg-emerald-600 hover:text-white transition-colors z-10">
                                                        Buka Maps <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center font-medium text-slate-400 text-xs z-10">Lokasi tidak direkam</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Daily Report Detail */}
                                    {selectedAtt.daily_report && (
                                        <div className="pt-3">
                                            <h5 className="text-[10px] font-semibold uppercase text-slate-400 tracking-wide mb-2">Laporan Progress Harian</h5>
                                            <div className="bg-white p-4 rounded-md border border-slate-200">
                                                <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">{selectedAtt.daily_report}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedAtt.is_manual && selectedAtt.manual_reason && (
                                <div className="p-4 bg-amber-50 rounded-md border border-amber-200">
                                    <h5 className="text-[10px] font-semibold uppercase text-amber-600 tracking-wide mb-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Alasan Presensi Manual</h5>
                                    <p className="text-sm font-medium text-amber-900 whitespace-pre-wrap">"{selectedAtt.manual_reason}"</p>
                                </div>
                            )}

                            {selectedAtt.approval_status === 'pending' && (
                                <div className="flex gap-3 pt-6 border-t border-slate-200">
                                    <Button onClick={() => handleVerify(selectedAtt.id, 'rejected')} variant="outline" className="flex-1 rounded-md border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-11 font-semibold gap-2">
                                        <XCircle className="w-4 h-4" /> Tolak Hadir
                                    </Button>
                                    <Button onClick={() => handleVerify(selectedAtt.id, 'approved')} className="flex-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-semibold gap-2">
                                        <CheckCircle className="w-4 h-4" /> Setujui Manual
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowSettings(false)}>
                    <div className="bg-white rounded-md shadow-lg w-full max-w-2xl overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                        {/* Map Picker Side */}
                        <div className="flex-1 p-6 bg-slate-50 border-r border-slate-200">
                            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-4">Lokasi Presensi</h4>
                            <OfficeLocationPicker
                                lat={parseFloat(formSettings.lat)}
                                lng={parseFloat(formSettings.lng)}
                                radius={parseInt(formSettings.radius)}
                                onChange={({ lat, lng }) => setFormSettings(prev => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6) }))}
                            />
                            <div className="flex gap-2 mt-3">
                                <Button
                                    onClick={detectLocation}
                                    disabled={detecting}
                                    variant="outline"
                                    className="flex-1 rounded-md h-10 text-[10px] font-semibold border-primary/20 text-primary hover:bg-primary/5 gap-2"
                                >
                                    {detecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                                    Gunakan Lokasi Saya Sekarang
                                </Button>
                            </div>
                            <div className="mt-4 p-4 bg-white rounded-md border border-slate-200">
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                    <span className="font-semibold text-primary uppercase mr-2">Tips:</span>
                                    Gunakan kursor untuk menyeret pin biru ke titik lokasi kantor yang tepat. Lingkaran transparan menunjukkan batas radius absensi.
                                </p>
                            </div>
                        </div>

                        {/* Form Side */}
                        <div className="flex-1 p-6 space-y-5">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-lg text-slate-900">Geo-Fencing</h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)} className="rounded-md -mr-2">
                                    <X className="w-4 h-4 text-slate-400" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Latitude</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={formSettings.lat} onChange={e => setFormSettings(prev => ({ ...prev, lat: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Longitude</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={formSettings.lng} onChange={e => setFormSettings(prev => ({ ...prev, lng: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Radius (Meter)</label>
                                    <Badge className="bg-primary text-white font-semibold text-[10px] h-5 rounded-md px-2">{formSettings.radius}m</Badge>
                                </div>
                                <input
                                    type="range"
                                    min="20"
                                    max="500"
                                    step="10"
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                    value={formSettings.radius} onChange={e => setFormSettings(prev => ({ ...prev, radius: e.target.value }))}
                                />
                                <div className="flex justify-between text-[8px] font-semibold text-slate-300 uppercase tracking-wide">
                                    <span>20m</span>
                                    <span>500m</span>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button onClick={saveSettings} disabled={savingSettings} className="w-full rounded-md bg-slate-900 hover:bg-primary text-white font-semibold h-11">
                                    {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Konfigurasi'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
