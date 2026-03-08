import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { LogOut, Briefcase, ChevronRight, Building2, MapPin, Clock, ClipboardCheck, ArrowRight, LayoutDashboard, Search, Bell } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { STAGE_CONFIG } from '@/lib/constants/stages'
import JobBoardUI from './JobBoardUI'

export const metadata = { title: 'Portal Karir — Arvela' }
export const dynamic = 'force-dynamic'

export default async function CandidatePortalPage({ searchParams }) {
    const { view = 'jobs' } = await searchParams
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminSupabase = createAdminSupabaseClient()

    const { data: allJobs } = await adminSupabase
        .from('jobs')
        .select(`
            id, title, slug, location, work_type, employment_type, created_at, published_at,
            companies (name, slug, logo_url)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })

    let applications = []
    let assignments = []

    let isStaffOrAdmin = false
    let autoRedirectPath = '/portal'
    let staffLabel = 'Portal Staff'
    let roleName = 'Kandidat Terverifikasi'

    if (user) {
        // PERBAIKAN: Cek apakah user ini punya akses staff/admin lewat roles di profile
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role || 'user'
        const ADMIN_ROLES = ['hr', 'super_admin', 'hiring_manager', 'boss']

        if (role === 'employee') {
            isStaffOrAdmin = true
            autoRedirectPath = '/staff'
            staffLabel = 'Portal Staff'
            roleName = 'Karyawan'
        } else if (ADMIN_ROLES.includes(role)) {
            isStaffOrAdmin = true
            autoRedirectPath = '/dashboard'
            staffLabel = 'Dashboard Utama'
            roleName = 'Administrator / HR'
        }

        const { data: apps } = await adminSupabase
            .from('applications')
            .select(`
                id, stage, created_at, job_id, company_id,
                companies (name, slug, logo_url),
                jobs (title, location, employment_type)
            `)
            .ilike('email', user.email)
            .order('created_at', { ascending: false })

        applications = apps || []
        const appIds = applications.map(a => a.id) || []

        if (appIds.length > 0) {
            const { data: asgns } = await adminSupabase
                .from('assessment_assignments')
                .select(`
                    *,
                    assessments (
                        title, 
                        duration_minutes, 
                        show_score,
                        questions (points)
                    )
                `)
                .in('application_id', appIds)
                .order('created_at', { ascending: false })
            assignments = asgns || []
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Main Navbar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-8">
                    <Link href="/portal" className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <div className="hidden md:flex flex-col">
                            <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                                Arvela <span className="text-primary">Career</span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Platform Rekrutmen</span>
                        </div>
                    </Link>

                    {/* Navigation Desktop */}
                    <nav className="hidden md:flex items-center gap-1 flex-1">
                        <Link
                            href="/portal?view=jobs"
                            className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${view === 'jobs' ? 'bg-brand-50 text-primary' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            Jelajahi Lowongan
                        </Link>
                        <Link
                            href="/portal?view=apps"
                            className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${view === 'apps' ? 'bg-brand-50 text-primary' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            {user ? 'Aktivitas Saya' : 'Status Lamaran'}
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4 shrink-0">
                        {user ? (
                            <div className="flex items-center gap-3">
                                {isStaffOrAdmin && (
                                    <Link href={autoRedirectPath} className="hidden sm:block">
                                        <Button variant="outline" className="rounded-lg h-9 px-4 font-bold border-primary text-primary hover:bg-brand-50 shadow-sm whitespace-nowrap">
                                            {staffLabel}
                                        </Button>
                                    </Link>
                                )}
                                <div className="hidden sm:flex flex-col items-end">
                                    <span className="text-xs font-bold text-slate-900">{user.email.split('@')[0]}</span>
                                    <span className="text-[10px] font-medium text-slate-400">{roleName}</span>
                                </div>
                                <div className="h-10 w-px bg-slate-100 mx-1 hidden sm:block" />
                                <form action="/portal/auth/logout" method="POST">
                                    <button type="submit" className="text-sm font-bold text-slate-600 hover:text-destructive px-4 py-2 rounded-lg transition-all border border-slate-200 hover:border-destructive/20 hover:bg-destructive/5">
                                        Log Out
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/portal/login">
                                    <Button variant="ghost" className="rounded-lg h-10 px-4 font-bold text-slate-600">
                                        Masuk
                                    </Button>
                                </Link>
                                <Link href="/portal/login">
                                    <Button className="rounded-lg h-10 px-6 font-bold bg-primary hover:bg-brand-600 text-white shadow-md shadow-primary/10">
                                        Daftar
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation (Bottom of Header) */}
                <div className="md:hidden border-t border-slate-100 px-4 flex">
                    <Link
                        href="/portal?view=jobs"
                        className={`flex-1 text-center py-4 text-xs font-bold transition-all border-b-2 ${view === 'jobs' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
                    >
                        Jelajahi Lowongan
                    </Link>
                    <Link
                        href="/portal?view=apps"
                        className={`flex-1 text-center py-4 text-xs font-bold transition-all border-b-2 ${view === 'apps' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
                    >
                        {user ? 'Aktivitas Saya' : 'Status'}
                    </Link>
                </div>
            </header>

            <main className="pb-20">
                {view === 'jobs' ? (
                    <>
                        {/* Hero Section */}
                        <div className="bg-white border-b border-slate-100 py-20 sm:py-32 mb-10">
                            <div className="max-w-6xl mx-auto px-4 text-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider mb-6">
                                    Peluang Baru Setiap Hari
                                </div>
                                <h1 className="text-4xl sm:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1] mb-8">
                                    Awali Karir <span className="text-primary italic">Impian</span> Anda <br className="hidden sm:block" /> di Arvela Career.
                                </h1>
                                <p className="text-slate-500 font-medium text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
                                    Kami menghubungkan profesional berbakat dengan perusahaan inovatif.
                                    Lamar pekerjaan dalam hitungan menit dan pantau setiap prosesnya.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <div className="flex -space-x-3 overflow-hidden">
                                        {[1, 2, 3, 4].map(i => (
                                            <img key={i} src={`https://i.pravatar.cc/100?u=arvela-${i}`} className="inline-block h-10 w-10 rounded-full ring-4 ring-white" alt="Avatar" />
                                        ))}
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 ring-4 ring-white text-[10px] font-bold text-slate-500">
                                            +2k
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600">
                                        Bergabung dengan ribuan pelamar sukses
                                    </p>
                                </div>
                            </div>
                        </div>

                        <JobBoardUI initialJobs={allJobs || []} />
                    </>
                ) : (
                    <div className="max-w-5xl mx-auto px-4 pt-16 sm:pt-24">
                        {!user ? (
                            <div className="py-20 text-center max-w-md mx-auto space-y-8">
                                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto border border-slate-100 shadow-xl shadow-slate-200/50">
                                    <LayoutDashboard className="w-12 h-12 text-slate-300" />
                                </div>
                                <div className="space-y-3">
                                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">Pantau Lamaran & <br /> Assessment Anda</h1>
                                    <p className="text-slate-500 font-medium leading-relaxed">
                                        Login untuk memonitor progres lamaran, mengerjakan tes online, dan menerima undangan interview.
                                    </p>
                                </div>
                                <Link href="/portal/login" className="block">
                                    <Button className="w-full h-14 rounded-xl font-bold bg-primary hover:bg-brand-600 text-white text-base shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
                                        Masuk ke Portal Kandidat
                                    </Button>
                                </Link>
                                <p className="text-xs font-bold text-slate-400">Arvela tidak pernah memungut biaya apapun.</p>
                            </div>
                        ) : (
                            <div className="space-y-16">
                                {/* Header Dashboard */}
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-200 pb-10">
                                    <div>
                                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Aktivitas Karir Saya</h1>
                                        <p className="text-slate-500 font-medium font-serif italic text-lg">Pusat kendali proses rekrutmen Anda.</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-center sm:text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Lamaran</p>
                                            <p className="text-2xl font-black text-slate-900">{applications.length}</p>
                                        </div>
                                        <div className="h-10 w-px bg-slate-200" />
                                        <div className="text-center sm:text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assessment Aktif</p>
                                            <p className="text-2xl font-black text-primary">{assignments.filter(a => a.status !== 'completed').length}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Assessments Section */}
                                {assignments && assignments.length > 0 && (
                                    <section>
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <ClipboardCheck className="w-5 h-5 text-primary" />
                                                </div>
                                                Assessment Online
                                            </h2>
                                        </div>
                                        <div className="grid gap-6 sm:grid-cols-2">
                                            {assignments.map(asgn => {
                                                const maxPoints = asgn.assessments?.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0
                                                const isCompleted = asgn.status === 'completed'
                                                const isStarted = asgn.status === 'started'
                                                const showScore = asgn.assessments?.show_score && isCompleted

                                                return (
                                                    <div key={asgn.id} className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-primary/40 transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5 group relative overflow-hidden">
                                                        <div className="flex items-center justify-between mb-6">
                                                            <Badge className={`rounded-lg py-1 px-3 ${asgn.status === 'sent' ? 'bg-primary text-white' : isStarted ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                                {asgn.status === 'sent' ? 'Aktif' : isStarted ? 'Dalam Pengerjaan' : 'Selesai'}
                                                            </Badge>
                                                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 grayscale opacity-70">
                                                                <Clock className="w-4 h-4 text-primary" /> {asgn.assessments?.duration_minutes}m Durasi
                                                            </span>
                                                        </div>

                                                        <h3 className="text-2xl font-bold text-slate-900 mb-2 truncate leading-tight group-hover:text-primary transition-colors">{asgn.assessments?.title}</h3>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
                                                            Diterima: {new Date(asgn.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                        </p>

                                                        {showScore && (
                                                            <div className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Skor Diperoleh</p>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-3xl font-black text-slate-900">{asgn.total_score}</span>
                                                                        <span className="text-slate-300 text-sm font-bold">/ {maxPoints}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="w-16 h-16 rounded-full bg-white border-4 border-primary/20 flex items-center justify-center text-xl font-black text-primary shadow-sm">
                                                                    {Math.round((asgn.total_score / (maxPoints || 1)) * 100)}%
                                                                </div>
                                                            </div>
                                                        )}

                                                        {(asgn.status === 'sent' || isStarted) && (
                                                            <Link href={`/assessment/${asgn.token}`}>
                                                                <Button size="lg" className="w-full h-14 rounded-xl font-bold bg-slate-900 border-b-4 border-slate-950 hover:bg-slate-800 hover:border-slate-900 text-white transition-all active:border-b-0 active:translate-y-1">
                                                                    {isStarted ? 'Lanjutkan Pengerjaan' : 'Mulai Pengerjaan'} <ArrowRight className="ml-2 w-5 h-5" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </section>
                                )}

                                <section>
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Briefcase className="w-5 h-5 text-primary" />
                                            </div>
                                            Daftar Lamaran Anda
                                        </h2>
                                    </div>

                                    {applications.length === 0 ? (
                                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-24 text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                                <Search className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">Riwayat kosong</h3>
                                            <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10">Anda belum memiliki riwayat lamaran. Yuk, mulai cari karir impianmu hari ini!</p>
                                            <Link href="/portal?view=jobs">
                                                <Button size="lg" className="rounded-xl font-bold h-12 px-8 bg-primary hover:bg-brand-600 text-white shadow-xl shadow-primary/20">Cari Lowongan Sekarang</Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                                            <div className="divide-y divide-slate-100">
                                                {applications.map(app => {
                                                    const stageCfg = STAGE_CONFIG[app.stage] || { label: 'Diproses', dotColor: 'bg-muted-foreground' }
                                                    return (
                                                        <div key={app.id} className="p-8 hover:bg-slate-50/70 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-8 justify-between group cursor-default">
                                                            <div className="flex items-center gap-6 flex-1 min-w-0">
                                                                <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden transition-transform">
                                                                    {app.companies?.logo_url ? (
                                                                        <img src={app.companies.logo_url} alt={app.companies.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Building2 className="w-8 h-8 text-slate-200" />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <span className="text-sm font-bold text-primary">{app.companies?.name}</span>
                                                                        <span className="text-slate-300">•</span>
                                                                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{app.jobs?.location || 'Remote'}</span>
                                                                    </div>
                                                                    <h3 className="font-extrabold text-slate-900 text-xl sm:text-2xl truncate transition-colors">
                                                                        {app.jobs?.title}
                                                                    </h3>
                                                                </div>
                                                            </div>

                                                            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-12 border-t sm:border-0 pt-6 sm:pt-0 border-slate-100">
                                                                <div className="text-left sm:text-right">
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Status</p>
                                                                    <div className="flex items-center gap-2 justify-start sm:justify-end">
                                                                        <p className="text-sm font-black text-slate-900">{stageCfg.label}</p>
                                                                        <div className={`w-3 h-3 rounded-full ${stageCfg.dotColor} shadow-sm border-2 border-white`} />
                                                                    </div>
                                                                </div>
                                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shadow-sm">
                                                                    <ClipboardCheck className="w-6 h-6 text-slate-400" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
