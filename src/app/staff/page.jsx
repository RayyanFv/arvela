'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    Target,
    BookOpen,
    Zap,
    Trophy,
    ChevronRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { OnboardingList } from '@/components/staff/OnboardingList'
import { OKRSection } from '@/components/staff/OKRSection'

export default function StaffDashboard() {
    const [employee, setEmployee] = useState(null)
    const [tasks, setTasks] = useState([])
    const [okrs, setOkrs] = useState([])
    const [courses, setCourses] = useState([])
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
                            <div className="relative w-32 h-32 rounded-[38px] bg-slate-800 border-4 border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
                                {employee.profiles?.avatar_url ? (
                                    <img src={employee.profiles.avatar_url} alt="Profile" className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110 duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-primary italic">
                                        {employee.profiles?.full_name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-center md:text-left space-y-4 max-w-xl">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
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

                        <div className="hidden xl:grid grid-cols-1 gap-4 ml-auto min-w-[240px]">
                            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-xl hover:bg-white/10 transition-all hover:translate-x-1 duration-300">
                                <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1.5 opacity-80">Jabatan & Divisi</p>
                                <p className="text-xl font-black text-white truncate">{employee.job_title}</p>
                                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tight">{employee.department}</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-xl hover:bg-white/10 transition-all hover:translate-x-1 duration-300">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5">Join Date</p>
                                <p className="text-lg font-bold text-white">{new Date(employee.joined_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {courses.map(assignment => (
                                    <div key={assignment.id} className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xl hover:shadow-2xl transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                                <BookOpen className="w-7 h-7" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-slate-400 tracking-wide mb-0.5">Kursus Baru</p>
                                                <h4 className="font-bold text-slate-900 truncate">{assignment.lms_courses?.title}</h4>
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

                {/* OKR Side Panel — Modular */}
                <div className="space-y-8">
                    <div className="space-y-1 px-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
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
    )
}
