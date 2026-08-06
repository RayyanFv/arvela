import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import {
    Briefcase,
    Calendar,
    ChevronLeft,
    Mail,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    EmployeeToastProvider,
    CopyAccountLinkButton,
    CopyEmailButton,
    OKRSection,
    AssignTemplateForm,
    AssignCourseForm,
    OnboardingChecklist,
    EmployeeTabs,
} from './EmployeeDetailClient'

export default async function EmployeeDetailPage({ params }) {
    const { id } = await params
    const authClient = await createServerSupabaseClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) redirect('/login')

    const supabase = createAdminSupabaseClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/login')

    const { data: employee } = await supabase
        .from('employees')
        .select(`*, profiles!employees_profile_id_fkey (id, full_name, email, avatar_url, department), contract_types (id, name, code)`)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .single()

    if (!employee) notFound()

    const [okrsRes, onboardingRes, coursesRes, allCoursesRes, templatesRes] = await Promise.all([
        supabase.from('okrs').select('*, key_results(*), initiatives(*)').eq('employee_id', id),
        supabase.from('onboarding_progress').select('*, onboarding_tasks(*)').eq('employee_id', id).order('onboarding_tasks(order_index)'),
        supabase.from('lms_course_assignments').select('*, lms_courses(*)').eq('employee_id', id),
        supabase.from('lms_courses').select('id, title').eq('company_id', employee.company_id).eq('status', 'published'),
        supabase.from('onboarding_templates').select('id, name').eq('company_id', employee.company_id),
    ])

    const okrs = okrsRes.data || []
    const onboarding = onboardingRes.data || []
    const assignments = coursesRes.data || []
    const availableCourses = allCoursesRes.data || []
    const availableTemplates = templatesRes.data || []

    const okrAvg = okrs.length > 0
        ? Math.round(okrs.reduce((acc, okr) => {
            const krs = okr.key_results || []
            if (krs.length === 0) return acc
            const okrAvgVal = krs.reduce((s, kr) => s + Math.min(kr.current_value / kr.target_value, 1) * 100, 0) / krs.length
            return acc + okrAvgVal
        }, 0) / okrs.length)
        : 0

    const onboardingTasks = onboarding.map(p => ({
        ...p.onboarding_tasks,
        progress_id: p.id,
        is_completed: p.is_completed,
        completed_at: p.completed_at
    }))
    const completedOnboarding = onboardingTasks.filter(t => t.is_completed).length

    return (
        <EmployeeToastProvider>
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <Link href="/dashboard/employees" className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-primary gap-1 uppercase tracking-wide transition-colors">
                <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar
            </Link>

            {/* Header bar */}
            <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-md bg-brand-50 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xl text-primary shrink-0">
                        {employee.profiles.avatar_url ? (
                            <img src={employee.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : employee.profiles.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-bold text-slate-900 truncate">{employee.profiles.full_name}</h2>
                            <Badge className={`text-[9px] font-semibold uppercase rounded-md ${employee.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                {employee.status}
                            </Badge>
                            {employee.contract_types && (
                                <Badge variant="outline" className="text-[9px] font-semibold uppercase rounded-md text-slate-600 border-slate-200">
                                    {employee.contract_types.code || employee.contract_types.name}
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs font-semibold text-primary mb-1">{employee.job_title}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {employee.department}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Bergabung {new Date(employee.joined_at).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5" /> {employee.profiles.email}
                                <CopyEmailButton email={employee.profiles.email} />
                            </span>
                        </div>
                    </div>
                </div>
                <div className="sm:w-56 shrink-0">
                    <CopyAccountLinkButton email={employee.profiles.email} />
                </div>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-4">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">OKR Achievement</p>
                    <div className="text-xl font-bold text-emerald-600">{okrAvg}%</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-md p-4">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Onboarding</p>
                    <div className="text-xl font-bold text-slate-900">{completedOnboarding}<span className="text-slate-300 text-sm">/{onboardingTasks.length}</span></div>
                </div>
                <div className="bg-white border border-slate-200 rounded-md p-4">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Modul Selesai</p>
                    <div className="text-xl font-bold text-indigo-600">{assignments.filter(a => a.status === 'completed').length}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-md p-4">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Investment ROI</p>
                    <div className="text-xl font-bold text-primary">High</div>
                </div>
            </div>

            {/* Tabbed content */}
            <Card className="rounded-md border border-slate-200 bg-white p-6">
                <Suspense fallback={<div className="h-64 animate-pulse bg-slate-50 rounded-md" />}>
                    <EmployeeTabs
                        okrPanel={<OKRSection okrs={okrs} employeeId={id} companyId={employee.company_id} />}
                        onboardingPanel={
                            <div className="space-y-6 max-w-xl">
                                <AssignTemplateForm employeeId={id} companyId={employee.company_id} availableTemplates={availableTemplates} />
                                <OnboardingChecklist tasks={onboardingTasks} />
                            </div>
                        }
                        coursesPanel={
                            <div className="space-y-6 max-w-xl">
                                <AssignCourseForm employeeId={id} companyId={employee.company_id} availableCourses={availableCourses} />
                                <div className="space-y-3">
                                    {assignments.length > 0 ? assignments.map(a => (
                                        <div key={a.id} className="flex items-center justify-between p-4 rounded-md border border-slate-100 hover:bg-slate-50 transition-colors">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{a.lms_courses?.title}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">Status: {a.status}</p>
                                            </div>
                                            <Badge variant="outline" className={`text-[10px] font-semibold uppercase rounded-md ${a.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {a.status}
                                            </Badge>
                                        </div>
                                    )) : (
                                        <p className="text-center py-4 text-xs font-medium text-slate-400">Belum ada kursus yang di-assign.</p>
                                    )}
                                </div>
                            </div>
                        }
                    />
                </Suspense>
            </Card>
        </div>
        </EmployeeToastProvider>
    )
}
