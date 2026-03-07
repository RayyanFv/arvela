import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, Briefcase, ChevronRight, Building2, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { STAGE_CONFIG } from '@/lib/constants/stages'

export const metadata = { title: 'Portal Kandidat — Arvela HR' }

export default async function CandidatePortal() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/portal/login')
    }

    // Fetch applications where email matches the user email
    // This is securely handled by RLS, but we explicitly filter by email anyway
    const { data: applications, error } = await supabase
        .from('applications')
        .select(`
            id, stage, created_at, job_id, company_id,
            companies (name, slug, logo_url),
            jobs (title, location, employment_type)
        `)
        .eq('email', user.email)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-border sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                        Arvela<span className="text-primary">HR</span> Candidate
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground hidden sm:inline-block">{user.email}</span>
                        <form action="/portal/auth/logout" method="POST">
                            <button type="submit" className="text-sm font-medium text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5">
                                <LogOut className="w-4 h-4" /> Keluar
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-foreground mb-6">Lamaran Saya</h1>

                {error || !applications || applications.length === 0 ? (
                    <div className="bg-white border border-border rounded-xl p-10 text-center">
                        <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground mb-1">Belum ada lamaran</h2>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Anda belum pernah melamar ke lowongan manapun menggunakan email ini. Cari lowongan menarik di portal Karir Perusahaan!
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {applications.map(app => {
                            const stageCfg = STAGE_CONFIG[app.stage] || { label: 'Diproses', dotColor: 'bg-muted-foreground' }

                            return (
                                <div key={app.id} className="bg-white border border-border rounded-xl p-5 hover:shadow-sm hover:border-primary/30 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between group">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center border border-border shrink-0">
                                            <Building2 className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground text-lg cursor-default group-hover:text-primary transition-colors">
                                                {app.jobs?.title}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                                                <span className="font-medium text-slate-700">{app.companies?.name}</span>
                                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{app.jobs?.location || 'Remote'}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDistanceToNow(new Date(app.created_at), { locale: localeID })} yg lalu</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start pt-3 sm:pt-0 border-t border-border sm:border-0 mt-3 sm:mt-0">
                                        <div className="flex items-center gap-2">
                                            <div className="text-right mr-2 hidden sm:block">
                                                <p className="text-xs text-muted-foreground mb-0.5">Status Lamaran</p>
                                                <p className="text-sm font-semibold text-foreground">{stageCfg.label}</p>
                                            </div>
                                            <div className="sm:hidden">
                                                <span className="text-sm font-semibold text-foreground">{stageCfg.label}</span>
                                            </div>
                                            <div className={`w-3 h-3 rounded-full ${stageCfg.dotColor}`} />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
