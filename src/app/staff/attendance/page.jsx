'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Clock, MapPin, Camera as CameraIcon,
    CheckCircle2, AlertCircle, Loader2,
    Map as MapIcon, RefreshCw, Send
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import MapWrapper from '@/components/ui/MapWrapper'

export default function AttendancePage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [employee, setEmployee] = useState(null)
    const [company, setCompany] = useState(null)
    const [attendance, setAttendance] = useState(null)
    const [location, setLocation] = useState(null)
    const [distance, setDistance] = useState(null)
    const [error, setError] = useState(null)
    const [reportError, setReportError] = useState(false)
    const [shift, setShift] = useState(null)
    const [schedule, setSchedule] = useState(null)
    const [history, setHistory] = useState([])
    const [activeLeave, setActiveLeave] = useState(null)

    // Manual / out of radius
    const [isManual, setIsManual] = useState(false)
    const [manualReason, setManualReason] = useState('')

    // Camera state
    const [showCamera, setShowCamera] = useState(false)
    const [stream, setStream] = useState(null)
    const [photo, setPhoto] = useState(null)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)

    // Daily report
    const [report, setReport] = useState('')

    const today = new Date().toISOString().split('T')[0]

    async function fetchAttendance() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: emp, error: empErr } = await supabase
            .from('employees')
            .select(`
                id, company_id,
                companies ( * )
            `)
            .eq('profile_id', user.id)
            .single()

        if (empErr) {
            console.error('Error fetching employee:', empErr)
            setError('Gagal memuat data karyawan: ' + empErr.message)
        } else if (emp) {
            setEmployee(emp)
            setCompany(emp.companies)

            // Get Current Day Shift
            const dayOfWeek = new Date().getDay()
            const { data: sched } = await supabase
                .from('schedules')
                .select(`
                    id, day_of_week, specific_date,
                    shifts (*)
                `)
                .eq('employee_id', emp.id)
                .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${today}`)
                .order('specific_date', { ascending: false }) // Prioritize specific date
                .limit(1)
                .maybeSingle()

            if (sched) {
                setSchedule(sched)
                setShift(sched.shifts)
            }

            const { data: att, error: attErr } = await supabase
                .from('attendances')
                .select('*')
                .eq('employee_id', emp.id)
                .eq('date', today)
                .maybeSingle()

            if (attErr && attErr.code !== 'PGRST116') { // PGRST116 is 'no rows' which is normal
                console.error('Error fetching attendance:', attErr)
            }
            setAttendance(att)

            // Fetch History (last 7 days)
            const { data: hist } = await supabase
                .from('attendances')
                .select('*, shifts(name)')
                .eq('employee_id', emp.id)
                .neq('date', today)
                .order('date', { ascending: false })
                .limit(7)
            setHistory(hist || [])

            // Fetch Active Approved Leave/Requests Today
            const { data: reqData } = await supabase
                .from('attendance_requests')
                .select('*, leave_types(name)')
                .eq('employee_id', emp.id)
                .eq('status', 'APPROVED')
                .lte('start_date', today)
                .gte('end_date', today)
                .limit(1)

            if (reqData && reqData.length > 0) {
                setActiveLeave(reqData[0])
            }
        } else {
            console.warn('No employee record found for user:', user.id)
        }
        setLoading(false)
    }

    // Calculate haversine distance
    function calculateDistance(lat1, lon1, lat2, lon2) {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null
        const R = 6371000 // Earth radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return Math.round(R * c)
    }

    useEffect(() => {
        if (location && company?.office_lat) {
            const dist = calculateDistance(location.lat, location.lng, company.office_lat, company.office_lng)
            setDistance(dist)
            if (dist > (company.office_radius_meters || 100)) {
                setIsManual(true)
            } else {
                setIsManual(false)
            }
        }
    }, [location, company])

    useEffect(() => {
        fetchAttendance()
        getCurrentLocation()
    }, [])

    // Attach stream to video element when ready
    useEffect(() => {
        if (showCamera && stream && videoRef.current) {
            videoRef.current.srcObject = stream
        }
    }, [showCamera, stream])

    function getCurrentLocation() {
        if (!navigator.geolocation) {
            setError('Geolocation tidak didukung browser Anda.')
            return
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => setError('Gagal mendapatkan lokasi: ' + err.message),
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    async function startCamera() {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
            setStream(mediaStream)
            setShowCamera(true)
        } catch (err) {
            setError('Gagal akses kamera: ' + err.message)
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
        setShowCamera(false)
    }

    function takePhoto() {
        if (canvasRef.current && videoRef.current) {
            const context = canvasRef.current.getContext('2d')
            canvasRef.current.width = videoRef.current.videoWidth
            canvasRef.current.height = videoRef.current.videoHeight
            context.drawImage(videoRef.current, 0, 0)
            setPhoto(canvasRef.current.toDataURL('image/jpeg'))
            stopCamera()
        }
    }

    async function handleClockIn() {
        if (!location) {
            setError('Lokasi diperlukan untuk presensi.');
            getCurrentLocation();
            return;
        }
        if (!photo) { setError('Foto selfie diperlukan.'); return; }

        setSubmitting(true)
        // Check Late Status
        let attendanceStatus = 'present'
        if (shift) {
            const now = new Date()
            const [targetH, targetM] = shift.clock_in_time.split(':').map(Number)
            const targetTime = new Date()
            targetTime.setHours(targetH, targetM + (shift.late_threshold || 0), 0, 0)

            if (now > targetTime) {
                attendanceStatus = 'late'
            }
        }

        const { error: insErr } = await supabase.from('attendances').insert({
            employee_id: employee.id,
            company_id: employee.company_id,
            date: today,
            clock_in: new Date().toISOString(),
            lat_in: location.lat,
            lng_in: location.lng,
            photo_in_url: photo,
            is_manual: isManual,
            manual_reason: isManual ? manualReason : null,
            approval_status: isManual ? 'pending' : 'approved',
            shift_id: shift?.id,
            schedule_id: schedule?.id,
            status: attendanceStatus
        })

        if (insErr) setError(insErr.message)
        else {
            setPhoto(null)
            fetchAttendance()
        }
        setSubmitting(false)
    }

    async function handleClockOut() {
        if (!photo) { setError('Foto selfie diperlukan untuk Absen Pulang.'); return; }
        if (!report.trim()) {
            setError('Laporan harian harus diisi.');
            setReportError(true);
            // scroll down slightly
            window.scrollBy({ top: 200, behavior: 'smooth' })
            return;
        }
        setReportError(false); // Clear error if input exists

        setSubmitting(true)
        // Check Early Leave Status
        let attendanceStatus = attendance.status || 'present'
        if (shift) {
            const now = new Date()
            const [targetH, targetM] = shift.clock_out_time.split(':').map(Number)
            const targetTime = new Date()
            targetTime.setHours(targetH, targetM, 0, 0)

            if (now < targetTime) {
                attendanceStatus = activeLeave?.type === 'EARLY_LEAVE' ? 'excused' : 'early_leave'
            }
        }

        const { error: updErr } = await supabase.from('attendances').update({
            clock_out: new Date().toISOString(),
            lat_out: location?.lat,
            lng_out: location?.lng,
            photo_out_url: photo,
            daily_report: report,
            is_manual: isManual,
            manual_reason: isManual ? manualReason : null,
            approval_status: isManual ? 'pending' : 'approved',
            status: attendanceStatus
        }).eq('id', attendance.id)

        if (updErr) setError(updErr.message)
        else {
            setPhoto(null)
            setReport('')
            setReportError(false) // Reset explicitly
            fetchAttendance()
        }
        setSubmitting(false)
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-slate-400 font-bold">Memuat status presensi...</p>
        </div>
    )

    if (!employee) return (
        <div className="max-w-xl mx-auto p-8 mt-10 bg-amber-50 border border-amber-200 rounded-[32px] flex flex-col items-center justify-center text-center gap-4">
            <AlertCircle className="w-12 h-12 text-amber-500" />
            <div>
                <h3 className="text-xl font-black text-amber-900 mb-2">Data Karyawan Tidak Ditemukan</h3>
                <p className="text-sm font-medium text-amber-700">Akun Anda belum terdaftar sebagai Karyawan. Silakan hubungi HRD jika ini sebuah kesalahan.</p>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 border-amber-300 text-amber-700 hover:bg-amber-100 font-bold rounded-xl">Muat Ulang Halaman</Button>
        </div>
    )

    const isClockedIn = !!attendance?.clock_in
    const isClockedOut = !!attendance?.clock_out

    return (
        <div className="max-w-xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Presensi <span className="text-primary italic">Harian</span></h1>
                <p className="text-slate-500 font-medium">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
                </div>
            )}

            {/* Current Status Card */}
            <Card className="p-6 border-none shadow-xl shadow-slate-200/50 rounded-[32px] bg-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Clock className="w-24 h-24" />
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <Badge variant="secondary" className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider ${isClockedOut ? 'bg-slate-100 text-slate-500' : isClockedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {isClockedOut ? 'Selesai Tugas' : isClockedIn ? 'Sedang Bekerja' : 'Belum Absen'}
                        </Badge>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Sekarang</p>
                            <p className="text-lg font-black text-slate-900">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Masuk ({shift?.clock_in_time?.substring(0, 5) || '--:--'})</p>
                            <p className="text-xl font-black text-slate-700">{attendance?.clock_in ? new Date(attendance.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pulang ({shift?.clock_out_time?.substring(0, 5) || '--:--'})</p>
                            <p className="text-xl font-black text-slate-700">{attendance?.clock_out ? new Date(attendance.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}</p>
                        </div>
                    </div>

                    {shift && (
                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                    <p className="text-xs font-black text-slate-700">{shift.name}</p>
                                </div>
                                <p className="text-[10px] font-bold text-primary italic">Target: {shift.clock_in_time.substring(0, 5)} - {shift.clock_out_time.substring(0, 5)}</p>
                            </div>
                        </div>
                    )}

                    {activeLeave && ['LEAVE', 'SICK', 'PERMISSION'].includes(activeLeave.type) ? (
                        <div className="p-8 text-center bg-blue-50/50 rounded-[28px] border border-blue-100 mt-4 animate-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                                <AlertCircle className="w-8 h-8 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-black text-blue-900">
                                Cuti / Izin Disetujui
                            </h3>
                            <p className="text-sm font-medium text-blue-700/70 mt-2">
                                Status: <span className="font-bold">{activeLeave.leave_types?.name || activeLeave.type}</span><br/>
                                Keterangan: <span className="font-bold">{activeLeave.reason}</span><br/>
                                Berakhir: <span className="font-bold">{new Date(activeLeave.end_date).toLocaleDateString('id-ID')}</span>
                            </p>
                            <p className="text-sm font-bold mt-4 text-blue-700 bg-white p-3 rounded-xl border border-blue-50/80 shadow-sm inline-block">Tidak perlu absen masuk hari ini. Selamat beristirahat! 🌴</p>
                        </div>
                    ) : !isClockedOut && (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Lokasi Terdeteksi</p>
                                        <p className="text-xs font-bold text-blue-700 truncate">{location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Mencari lokasi...'}</p>
                                        {distance !== null && (
                                            <p className={`text-[10px] font-bold mt-0.5 ${isManual ? 'text-red-500' : 'text-emerald-500'}`}>
                                                Jarak dari kantor: {distance}m
                                                {isManual && ` (Maks: ${company?.office_radius_meters || 100}m)`}
                                            </p>
                                        )}
                                    </div>
                                    <Button size="icon" variant="ghost" onClick={getCurrentLocation} className="text-blue-400 hover:text-blue-600">
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                </div>
                                {location && (
                                    <div className="w-full h-40 rounded-xl border border-blue-200/50 overflow-hidden bg-slate-100 z-0">
                                        <MapWrapper
                                            lat={location.lat}
                                            lng={location.lng}
                                            officeLat={company?.office_lat}
                                            officeLng={company?.office_lng}
                                            officeRadius={company?.office_radius_meters}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Camera Section */}
                            {!photo && !showCamera && (
                                <Button
                                    onClick={startCamera}
                                    className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg gap-3"
                                >
                                    <CameraIcon /> Ambil Foto Selfie
                                </Button>
                            )}

                            {showCamera && (
                                <div className="space-y-3">
                                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none rounded-2xl" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={stopCamera} className="flex-1 rounded-xl">Batal</Button>
                                        <Button onClick={takePhoto} className="flex-[2] rounded-xl bg-primary text-white font-bold h-12 gap-2">
                                            <CameraIcon className="w-4 h-4" /> Tangkap Foto
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {photo && (
                                <div className="space-y-4">
                                    <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 aspect-video">
                                        <img src={photo} className="w-full h-full object-cover" />
                                        <Button
                                            size="icon" variant="destructive"
                                            className="absolute top-2 right-2 w-8 h-8 rounded-lg"
                                            onClick={() => setPhoto(null)}
                                        >
                                            ×
                                        </Button>
                                    </div>

                                    {/* Out of range alert & manual input */}
                                    {isManual && (
                                        <div className="space-y-2 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                                            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                                                <AlertCircle className="w-4 h-4" />
                                                Diluar Radius Kantor
                                            </div>
                                            <p className="text-xs text-amber-700">Anda berada diluar jangkauan area absen. Anda tetap bisa melakukan absensi, namun akan berstatus <strong>Pending</strong> dan membutuhkan persetujuan HR.</p>
                                            <input
                                                className="w-full mt-2 bg-white border border-amber-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                                                placeholder="Berikan alasan (Cth: Sedang visit klien, Error GPS)"
                                                value={manualReason}
                                                onChange={e => setManualReason(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* Daily Report Field IF Clocked In */}
                                    {isClockedIn && !isClockedOut && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">
                                                Laporan Progress Hari Ini <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                className={`w-full bg-slate-50 border rounded-2xl p-4 text-sm font-medium outline-none min-h-[100px] transition-all
                                                    ${reportError ? 'border-red-400 ring-4 ring-red-500/10 placeholder:text-red-300' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}
                                                `}
                                                placeholder={reportError ? "Wajib diisi! Tuliskan progres hari ini..." : "Tuliskan apa saja yang Anda kerjakan hari ini..."}
                                                value={report}
                                                onChange={e => {
                                                    setReport(e.target.value)
                                                    if (e.target.value.trim()) setReportError(false)
                                                }}
                                            />
                                            {reportError && <p className="text-xs font-bold text-red-500 pl-1 animate-pulse">Laporan wajib diisi untuk bisa absen pulang!</p>}
                                        </div>
                                    )}

                                    <Button
                                        onClick={isClockedIn ? handleClockOut : handleClockIn}
                                        disabled={submitting || (isManual && !manualReason.trim())}
                                        className={`w-full h-16 rounded-2xl font-black text-xl gap-3 shadow-xl ${isClockedIn ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-primary hover:bg-brand-600 text-white'}`}
                                    >
                                        {submitting ? <Loader2 className="animate-spin" /> : <Send />}
                                        {isClockedIn ? 'Selesai & Pulang' : 'Masuk Kerja'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {isClockedOut && (
                        <div className="p-8 text-center space-y-3 bg-emerald-50 rounded-[28px] border border-emerald-100">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-black text-emerald-900">Istirahatlah dengan Cukup!</h3>
                            <p className="text-xs font-medium text-emerald-700/70">Terima kasih atas kerja keras Anda hari ini. Selamat beristirahat.</p>
                        </div>
                    )}
                </div>
            </Card>

            <canvas ref={canvasRef} className="hidden" />

            {/* History Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between pl-1">
                    <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Riwayat 7 Hari Terakhir</h3>
                </div>

                {history.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400">Belum ada riwayat presensi.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map(h => (
                            <Card key={h.id} className="p-4 border-none shadow-sm rounded-2xl bg-white flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                        {new Date(h.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-black text-slate-700">{h.clock_in ? new Date(h.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                                        <span className="text-slate-300 text-[10px]">→</span>
                                        <p className="text-xs font-black text-slate-700">{h.clock_out ? new Date(h.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {h.status === 'late' && <Badge className="bg-red-50 text-red-600 border-none text-[8px] font-black h-5">TERLAMBAT</Badge>}
                                    {h.status === 'early_leave' && <Badge className="bg-orange-50 text-orange-600 border-none text-[8px] font-black h-5">PULANG AWAL</Badge>}
                                    <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-black h-5 uppercase">SELESAI</Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Hint Brief */}
            <div className="p-4 bg-brand-50/50 rounded-2xl border border-primary/10 flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <MapIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <p className="text-xs font-black text-slate-900 leading-tight">Presensi Berbasis Lokasi</p>
                    <p className="text-[10px] text-slate-400 font-medium">Pastikan GPS aktif saat melakukan absen masuk & pulang.</p>
                </div>
            </div>
        </div>
    )
}
