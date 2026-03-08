'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMagicLink } from '@/lib/actions/applications'
import {
    User,
    Briefcase,
    Calendar,
    Target,
    Plus,
    CheckCircle2,
    Trash2,
    ChevronLeft,
    Loader2,
    Trophy,
    Sparkles,
    Mail,
    Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { OKRTable } from '@/components/staff/OKRTable'
import { OnboardingList } from '@/components/staff/OnboardingList'
import Link from 'next/link'
import { enrollInCourse } from '@/lib/actions/hcm'

export default function EmployeeDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [employee, setEmployee] = useState(null)
    const [okrs, setOkrs] = useState([])
    const [onboarding, setOnboarding] = useState([])
    const [assignments, setAssignments] = useState([])
    const [availableCourses, setAvailableCourses] = useState([])
    const [assigningCourseId, setAssigningCourseId] = useState('')
    const [loading, setLoading] = useState(true)
    const [showAddOKR, setShowAddOKR] = useState(false)
    const [newOKR, setNewOKR] = useState({ title: '', period: 'Q1 2026', description: '' })
    const [newKRs, setNewKRs] = useState([{ title: '', target_value: '', unit: '' }])
    const supabase = createClient()

    async function loadData() {
        const { data: emp, error } = await supabase
            .from('employees')
            .select(`
                *,
                profiles!employees_profile_id_fkey (id, full_name, email, avatar_url, department)
            `)
            .eq('id', id)
            .single()

        if (emp) {
            setEmployee(emp)

            // Parallel fetch for OKRs, Onboarding, and Courses
            const [okrList, onboardingRes, coursesRes, allCoursesRes] = await Promise.all([
                supabase.from('okrs').select('*, key_results(*), initiatives(*)').eq('employee_id', id),
                supabase.from('onboarding_progress').select('*, onboarding_tasks(*)').eq('employee_id', id).order('onboarding_tasks(order_index)'),
                supabase.from('lms_course_assignments').select('*, lms_courses(*)').eq('employee_id', id),
                supabase.from('lms_courses').select('id, title').eq('company_id', emp.company_id).eq('status', 'published')
            ])

            setOkrs(okrList.data || [])
            setOnboarding(onboardingRes.data || [])
            setAssignments(coursesRes.data || [])
            setAvailableCourses(allCoursesRes.data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [id])

    async function handleAddOKR() {
        if (!newOKR.title) return
        setLoading(true)
        const { data: okrData, error } = await supabase.from('okrs').insert({
            employee_id: id,
            company_id: employee.company_id,
            title: newOKR.title,
            period: newOKR.period,
            description: newOKR.description
        }).select().single()
        if (!error && okrData) {
            // Insert KRs that have a title and target
            const validKRs = newKRs.filter(k => k.title && k.target_value)
            if (validKRs.length > 0) {
                await supabase.from('key_results').insert(
                    validKRs.map(k => ({
                        okr_id: okrData.id,
                        title: k.title,
                        target_value: Number(k.target_value),
                        unit: k.unit || '',
                        current_value: 0
                    }))
                )
            }
            setShowAddOKR(false)
            setNewOKR({ title: '', period: 'Q1 2026', description: '' })
            setNewKRs([{ title: '', target_value: '', unit: '' }])
            loadData()
        }
        setLoading(false)
    }

    if (loading && !employee) return <div className="flex h-screen items-center justify-center animate-pulse text-primary font-black">MEMUAT...</div>

    if (!employee) return <div>Karyawan tidak ditemukan</div>

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <Link href="/dashboard/employees" className="inline-flex items-center text-xs font-black text-slate-400 hover:text-primary gap-1 tracking-widest uppercase transition-colors">
                <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar
            </Link>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Profile Card */}
                <Card className="w-full md:w-80 rounded-[32px] border-none shadow-xl p-8 space-y-6 shrink-0 bg-white">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-24 h-24 rounded-[32px] bg-primary/5 border-2 border-slate-50 overflow-hidden flex items-center justify-center font-black text-3xl text-primary italic ring-8 ring-primary/5">
                            {employee.profiles.avatar_url ? (
                                <img src={employee.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : employee.profiles.full_name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">{employee.profiles.full_name}</h2>
                            <p className="text-xs font-bold text-primary">{employee.job_title}</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bergabung</p>
                                <p className="text-xs font-bold text-slate-700">{new Date(employee.joined_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <Briefcase className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Departemen</p>
                                <p className="text-xs font-bold text-slate-700">{employee.department}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <Mail className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{employee.profiles.email}</p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(employee.profiles.email)
                                            alert('Email disalin!')
                                        }}
                                        className="text-primary hover:text-brand-600"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <Target className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                <Badge className={`text-[9px] font-black uppercase ${employee.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                    {employee.status}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full rounded-2xl h-12 border-slate-200 font-bold text-slate-600 hover:text-primary hover:border-primary/20"
                            onClick={async () => {
                                try {
                                    const link = await getMagicLink({
                                        email: employee.profiles.email,
                                        type: 'recovery',
                                        redirectTo: `${window.location.origin}/reset-password`
                                    })
                                    if (link) {
                                        navigator.clipboard.writeText(link)
                                        alert('Link Aktivasi Akun disalin! Anda bisa mengirimkannya via WhatsApp.')
                                    }
                                } catch (err) {
                                    alert('Gagal membuat link: ' + err.message)
                                }
                            }}
                        >
                            Salin Link Akun
                        </Button>
                        <Button variant="ghost" className="w-full rounded-2xl h-12 font-bold text-slate-400">
                            Edit Profil
                        </Button>
                    </div>
                </Card>

                {/* Main Content (OKRs) */}
                <div className="flex-1 space-y-8 w-full">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <Target className="w-7 h-7 text-primary" /> Target & OKR
                        </h3>
                        <Button
                            onClick={() => setShowAddOKR(true)}
                            className="bg-primary text-white font-black rounded-2xl gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                        >
                            <Plus className="w-4 h-4" /> Tambah OKR
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {showAddOKR && (
                            <Card className="rounded-2xl border border-primary/20 shadow-xl p-5 bg-white animate-in slide-in-from-top-4 duration-200">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" /> OKR Baru
                                </h4>

                                {/* Objective Info */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                    <div className="md:col-span-2 space-y-1">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase">Judul Objective</Label>
                                        <Input placeholder="Meningkatkan Revenue 2x Lipat" className="h-9 rounded-lg text-sm" value={newOKR.title} onChange={e => setNewOKR({ ...newOKR, title: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase">Periode</Label>
                                        <Input placeholder="Q1 2026" className="h-9 rounded-lg text-sm" value={newOKR.period} onChange={e => setNewOKR({ ...newOKR, period: e.target.value })} />
                                    </div>
                                </div>

                                {/* Key Results Section */}
                                <div className="border border-slate-100 rounded-xl overflow-hidden mb-4">
                                    <div className="bg-slate-50 px-3 py-2 grid grid-cols-[1fr_100px_70px_32px] gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                        <span>Key Result</span>
                                        <span className="text-center">Target</span>
                                        <span className="text-center">Satuan</span>
                                        <span />
                                    </div>
                                    {newKRs.map((kr, i) => (
                                        <div key={i} className="px-3 py-2 grid grid-cols-[1fr_100px_70px_32px] gap-2 border-t border-slate-50 items-center">
                                            <Input
                                                placeholder={`KR-${i + 1}: Contoh: Capai 100 pelanggan`}
                                                className="h-8 rounded-lg text-xs border-slate-200"
                                                value={kr.title}
                                                onChange={e => { const list = [...newKRs]; list[i].title = e.target.value; setNewKRs(list) }}
                                            />
                                            <Input
                                                type="number"
                                                placeholder="100"
                                                className="h-8 rounded-lg text-xs border-slate-200 text-center"
                                                value={kr.target_value}
                                                onChange={e => { const list = [...newKRs]; list[i].target_value = e.target.value; setNewKRs(list) }}
                                            />
                                            <Input
                                                placeholder="%"
                                                className="h-8 rounded-lg text-xs border-slate-200 text-center"
                                                value={kr.unit}
                                                onChange={e => { const list = [...newKRs]; list[i].unit = e.target.value; setNewKRs(list) }}
                                            />
                                            <button
                                                onClick={() => setNewKRs(newKRs.filter((_, j) => j !== i))}
                                                className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-xs font-black transition-colors"
                                            >×</button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setNewKRs([...newKRs, { title: '', target_value: '', unit: '' }])}
                                        className="w-full py-2 text-[11px] font-bold text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 border-t border-slate-50"
                                    >
                                        <Plus className="w-3 h-3" /> Tambah KR
                                    </button>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => { setShowAddOKR(false); setNewKRs([{ title: '', target_value: '', unit: '' }]) }} className="rounded-lg font-bold text-slate-500">Batal</Button>
                                    <Button size="sm" onClick={handleAddOKR} disabled={loading} className="rounded-lg font-bold bg-primary text-white gap-1.5">
                                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                        Simpan OKR & KR
                                    </Button>
                                </div>
                            </Card>
                        )}

                        <OKRTable okrs={okrs} onUpdate={loadData} />
                    </div>

                    {/* Onboarding & LMS Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Onboarding */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" /> Onboarding Checklist
                            </h3>
                            <OnboardingList
                                tasks={onboarding.map(p => ({
                                    ...p.onboarding_tasks,
                                    progress_id: p.id,
                                    is_completed: p.is_completed,
                                    completed_at: p.completed_at
                                }))}
                            />
                        </div>

                        {/* LMS Assignment */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <Trophy className="w-6 h-6 text-amber-500" /> Kursus & Pelatihan
                            </h3>
                            <Card className="rounded-[32px] p-6 space-y-6 bg-white border-none shadow-xl">
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Kursus Baru</p>
                                        <div className="flex gap-2">
                                            <select
                                                className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none"
                                                value={assigningCourseId}
                                                onChange={e => setAssigningCourseId(e.target.value)}
                                            >
                                                <option value="">Pilih Kursus...</option>
                                                {availableCourses.map(c => (
                                                    <option key={c.id} value={c.id}>{c.title}</option>
                                                ))}
                                            </select>
                                            <Button
                                                disabled={!assigningCourseId || loading}
                                                onClick={async () => {
                                                    setLoading(true)
                                                    try {
                                                        await enrollInCourse({
                                                            employeeId: id,
                                                            courseId: assigningCourseId,
                                                            companyId: employee.company_id
                                                        })
                                                        setAssigningCourseId('')
                                                        loadData()
                                                    } catch (err) {
                                                        alert(err.message)
                                                    }
                                                    setLoading(false)
                                                }}
                                                className="bg-primary text-white font-bold rounded-xl h-10 px-4"
                                            >
                                                Assign
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {assignments.length > 0 ? assignments.map(a => (
                                            <div key={a.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{a.lms_courses?.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">Status: {a.status}</p>
                                                </div>
                                                <Badge variant="outline" className={`text-[10px] font-black uppercase ${a.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {a.status}
                                                </Badge>
                                            </div>
                                        )) : (
                                            <p className="text-center py-4 text-xs font-medium text-slate-300">Belum ada kursus yang di-assign.</p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
