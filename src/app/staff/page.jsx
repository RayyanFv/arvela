'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    Target,
    BookOpen,
    Zap,
    Trophy,
    ChevronRight,
    Clock,
    MapPin,
    ArrowRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OnboardingList } from '@/components/staff/OnboardingList'
import { OKRSection } from '@/components/staff/OKRSection'

export default function StaffDashboard() {
    const [employee, setEmployee] = useState(null)
    const [tasks, setTasks] = useState([])
    const [okrs, setOkrs] = useState([])
    const [courses, setCourses] = useState([])
    const [attendance, setAttendance] = useState(null)
    const [activeLeave, setActiveLeave] = useState(null)
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState('user')
    const supabase = createClient()

    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Employee data and Role verification
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile) setUserRole(profile.role)

        const { data: emp, error: empError } = await supabase
            .from('employees')
            .select('*, profiles!employees_profile_id_fkey(full_name, avatar_url, department)')
            .eq('profile_id', user.id)
            .single()

        if (empError || !emp) {
            setLoading(false)
            return
        }
        setEmployee(emp)

        // 2. Parallel fetch for tasks, okrs, and courses
        const [progressRes, okrsRes, coursesRes] = await Promise.all([
            supabase
                .from('onboarding_progress')
                .select(`
                    id, 
                    is_completed, 
                    completed_at,
                    onboarding_tasks (id, title, description, due_days, order_index)
                `)
                .eq('employee_id', emp.id)
                .order('onboarding_tasks(order_index)', { ascending: true }),
            supabase.from('okrs').select('*, key_results(*)').eq('employee_id', emp.id),
            supabase
                .from('lms_course_assignments')
                .select(`
                    *,
                    lms_courses (*)
                `)
                .eq('employee_id', emp.id)
        ])

        // Flatten tasks from progress
        const flattenedTasks = (progressRes.data || []).map(p => ({
            ...p.onboarding_tasks,
            progress_id: p.id,
            is_completed: p.is_completed,
            completed_at: p.completed_at
        }))

        setTasks(flattenedTasks)
        setOkrs(okrsRes.data || [])
        setCourses(coursesRes.data || [])

        // 3. Fetch Attendance & Leave Status for today
        const today = new Date().toISOString().split('T')[0]
        const [attRes, leaveRes] = await Promise.all([
            supabase.from('attendances').select('*').eq('employee_id', emp.id).eq('date', today).maybeSingle(),
            supabase.from('attendance_requests').select('*, leave_types(name)').eq('employee_id', emp.id).eq('status', 'APPROVED').lte('start_date', today).gte('end_date', today).limit(1)
        ])

        setAttendance(attRes.data)
        if (leaveRes.data && leaveRes.data.length > 0) setActiveLeave(leaveRes.data[0])

        setLoading(false)
    }

    useEffect(() => {
        fetchData()

        // Subscribe to changes for real-time progress updates
        const channel = supabase.channel('staff-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'onboarding_progress' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'key_results' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lms_course_assignments' }, () => fetchData())
            .subscribe()

        return () => { channel.unsubscribe() }
    }, [])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Zap className="w-10 h-10 text-primary animate-pulse" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Menyiapkan Workspace...</p>
        </div>
    )

    if (!employee) return (
        <div className="max-w-md mx-auto mt-20 text-center p-12 bg-white border border-slate-100 rounded-[48px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-amber-400" />
            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 transition-transform group-hover:scale-110">
                <LayoutDashboard className="w-12 h-12 text-amber-500" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Akses Terbatas</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
                Anda login dengan role <span className="font-bold text-slate-900 italic capitalize">{userRole}</span>, namun belum memiliki data di tabel <span className="text-primary font-black underline decoration-2 decoration-primary/20">Karyawan (Employees)</span>.
            </p>
            <div className="mt-10 p-4 rounded-3xl bg-slate-50 border border-slate-100 italic text-[11px] text-slate-400 font-medium">
                Jika Anda baru saja diterima, silakan beri waktu 5-10 menit untuk sinkronisasi sistem atau hubungi Administrator Arvela.
            </div>
        </div>
    )

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24">

            {/* Hero Header — Arvela Style */}
            <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-20 -z-10 rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000" />
                <div className="relative overflow-hidden bg-slate-900 rounded-[50px] p-8 md:p-12 text-white shadow-3xl shadow-slate-900/40 border border-white/5">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/40 rounded-full -translate-y-48 translate-x-48 blur-[120px] mix-blend-screen opacity-40 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-400/30 rounded-full translate-y-32 -translate-x-32 blur-[100px] mix-blend-overlay opacity-30 animate-pulse" />

                    <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        <div className="relative group/avatar shrink-0">
                            <div className="absolute -inset-2 bg-gradient-to-tr from-primary via-brand-400 to-primary rounded-[42px] blur opacity-30 group-hover/avatar:opacity-100 transition-all duration-700 animate-spin-slow" />
                            <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-[38px] bg-slate-800 border-4 border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
                                {employee.profiles?.avatar_url ? (
                                    <img src={employee.profiles.avatar_url} alt="Profile" className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110 duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl font-black text-primary italic">
                                        {employee.profiles?.full_name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-center md:text-left space-y-5 max-w-xl">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                <span className={`w-2.5 h-2.5 rounded-full ${employee.status === 'onboarding' ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24]' : 'bg-emerald-400 shadow-[0_0_10px_#34d399]'}`} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
                                    {employee.status === 'onboarding' ? 'Tahap Onboarding' : 'Kontribusi Aktif'}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] text-white">
                                Halo, <span className="text-primary italic">{employee.profiles?.full_name?.split(' ')[0]}</span>!
                            </h1>
                            <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed">
                                Siap untuk hari yang produktif? Pantau tugas orientasi dan target kinerja Anda secara langsung.
                            </p>
                        </div>

                        <div className="hidden xl:grid grid-cols-1 gap-5 ml-auto min-w-[260px]">
                            <div className="bg-white/5 border border-white/10 rounded-[36px] p-7 backdrop-blur-xl hover:bg-white/10 transition-all hover:translate-x-1 duration-300">
                                <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-2 opacity-80">Jabatan & Divisi</p>
                                <p className="text-2xl font-black text-white truncate">{employee.job_title}</p>
                                <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-tight">{employee.department}</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-[36px] p-7 backdrop-blur-xl hover:bg-white/10 transition-all hover:translate-x-1 duration-300">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Join Date</p>
                                <p className="text-xl font-bold text-white">{new Date(employee.joined_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
                <div className="lg:col-span-2 space-y-12">
                    {/* Onboarding Checklist */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                    </div>
                                    Tugas Orientasi
                                </h2>
                                <p className="text-slate-500 font-medium ml-14">Selesaikan langkah-langkah berikut untuk setup awal.</p>
                            </div>
                            <Badge variant="outline" className="h-10 px-6 rounded-2xl border-slate-200 text-slate-500 font-black tracking-widest bg-white">
                                {tasks.filter(t => t.is_completed).length} / {tasks.length}
                            </Badge>
                        </div>
                        <OnboardingList tasks={tasks} />
                    </div>

                    {/* LMS Courses */}
                    <div className="space-y-8">
                        <div className="space-y-1 px-2">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                <div className="w-10 h-10 bg-brand-400/10 rounded-2xl flex items-center justify-center text-brand-500">
                                    <Zap className="w-5 h-5" />
                                </div>
                                Learning Management
                            </h2>
                            <p className="text-slate-500 font-medium ml-14">Kembangkan skill Anda dengan kursus yang telah diberikan.</p>
                        </div>

                        {courses.length > 0 ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {courses.map(assignment => (
                                    <div key={assignment.id} className="bg-white border border-slate-100/60 rounded-[36px] p-7 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all group">
                                        <div className="flex items-center gap-5 mb-5">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-primary transition-colors">
                                                <BookOpen className="w-8 h-8" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">Kursus Baru</p>
                                                <h4 className="font-black text-lg text-slate-900 truncate leading-tight">{assignment.lms_courses?.title}</h4>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <div className="text-[10px] font-bold text-slate-400">
                                                Deadline: {assignment.deadline || 'TBA'}
                                            </div>
                                            <a
                                                href={`/staff/courses`}
                                                className="text-primary font-bold text-xs flex items-center gap-1 hover:underline"
                                            >
                                                Buka Materi <ChevronRight className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-10 text-center">
                                <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                                <p className="text-xs font-bold text-slate-400 uppercase">Belum ada kursus assigned</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Attendance & OKR Side Panel */}
                <div className="space-y-12">
                    {/* Quick Attendance Widget */}
                    <div className="space-y-6">
                        <div className="space-y-1 px-2">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-400/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                    <Clock className="w-5 h-5" />
                                </div>
                                Presensi Cepat
                            </h2>
                        </div>

                        {activeLeave ? (
                            <Card className="rounded-[32px] border-none shadow-xl shadow-blue-100/40 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                        <Zap className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Status Hari Ini</p>
                                        <p className="text-lg font-black text-blue-900 leading-tight">{activeLeave.leave_types?.name || activeLeave.type}</p>
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-blue-700/70 p-4 bg-white/60 rounded-2xl border border-white/80">
                                    Istirahatlah dengan cukup. Anda tidak perlu melakukan presensi hari ini.
                                </p>
                            </Card>
                        ) : (
                            <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 p-6 bg-white overflow-hidden relative group/att">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/att:opacity-10 transition-opacity">
                                    <Clock className="w-16 h-16" />
                                </div>

                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Kehadiran</p>
                                            <Badge variant="secondary" className={`px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-wider ${attendance?.clock_out ? 'bg-slate-100 text-slate-500' : attendance?.clock_in ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {attendance?.clock_out ? 'Selesai' : attendance?.clock_in ? 'Bekerja' : 'Belum Absen'}
                                            </Badge>
                                        </div>
                                        {attendance?.clock_in && !attendance?.clock_out && (
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Masuk Jam</p>
                                                <p className="text-sm font-black text-slate-700">{new Date(attendance.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        )}
                                    </div>

                                    <Link href="/staff/attendance" className="block">
                                        <Button className={`w-full h-14 rounded-2xl font-black text-sm gap-3 shadow-lg transition-all active:scale-95 ${attendance?.clock_out ? 'bg-slate-100 text-slate-400 cursor-not-allowed hover:bg-slate-100' : attendance?.clock_in ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 text-white' : 'bg-primary hover:bg-brand-600 shadow-primary/20 text-white'}`}>
                                            {attendance?.clock_out ? (
                                                <>Tugas Selesai</>
                                            ) : attendance?.clock_in ? (
                                                <>Absen Pulang <ArrowRight className="w-4 h-4" /></>
                                            ) : (
                                                <>Lakukan Presensi <ArrowRight className="w-4 h-4" /></>
                                            )}
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-1 px-2">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                <div className="w-10 h-10 bg-brand-400/10 rounded-2xl flex items-center justify-center text-brand-500">
                                    <Target className="w-5 h-5" />
                                </div>
                                Target & OKR
                            </h2>
                            <p className="text-slate-500 font-medium text-sm ml-14">Sasaran kinerja utama periode ini.</p>
                        </div>

                        <OKRSection okrs={okrs} onUpdate={fetchData} />
                    </div>
                </div>
            </div>
        </div>
    )
}
