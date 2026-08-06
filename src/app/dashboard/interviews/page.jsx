import { getAllInterviews } from '@/lib/actions/interviews'
import { Button } from '@/components/ui/button'
import {
    Video,
    Calendar,
    Clock,
    Filter,
    ChevronRight,
    ExternalLink,
    CheckCircle2,
    CalendarDays,
    Plus,
    History,
    Star,
    FileText
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SearchInput } from '@/components/ui/SearchInput'

export const metadata = { title: 'Daftar Interview — Arvela HR' }

export default async function InterviewsPage({ searchParams }) {
    const params = await searchParams
    const searchParam = params?.q?.toLowerCase() || ''

    let interviews = []
    try {
        interviews = await getAllInterviews()
    } catch (err) {

    }

    if (searchParam) {
        interviews = interviews.filter(i =>
            i.applications?.full_name?.toLowerCase().includes(searchParam) ||
            i.applications?.jobs?.title?.toLowerCase().includes(searchParam)
        )
    }

    const scheduled = interviews.filter(i => i.status === 'scheduled')
    const completed = interviews.filter(i => i.status !== 'scheduled')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-md border border-slate-200">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Interview</h1>
                    <p className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        {interviews.length} Total Jadwal Terdaftar
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/interviews/new">
                        <Button className="h-10 rounded-md font-semibold bg-primary hover:bg-brand-600 gap-2 px-5">
                            <Plus className="w-4 h-4" /> Tambah Interview
                        </Button>
                    </Link>
                    <SearchInput
                        placeholder="Cari kandidat..."
                        className="w-48"
                        inputClassName="bg-transparent border-slate-200"
                    />
                    <Button variant="outline" className="h-10 rounded-md font-semibold gap-2 px-5">
                        <Filter className="w-4 h-4" /> Filter
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Upcoming */}
                <div className="lg:col-span-8 space-y-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Akan Datang ({scheduled.length})
                    </h3>

                    {scheduled.length === 0 ? (
                        <div className="py-16 text-center bg-white rounded-md border border-dashed border-slate-200">
                             <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                             <p className="text-sm font-medium text-slate-400">Tidak ada wawancara terdekat</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {scheduled.map(iv => (
                                <div key={iv.id} className="bg-white border border-slate-200 rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-300 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-md flex items-center justify-center shrink-0 border",
                                            iv.jitsi_room_id ? "bg-brand-50 border-primary/10 text-primary" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                                        )}>
                                            <Video className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide leading-none mb-1">{iv.applications.jobs.title}</p>
                                            <h4 className="text-base font-bold text-slate-800 leading-none mb-1.5">{iv.applications.full_name}</h4>
                                            <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {iv.scheduled_date}</span>
                                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {iv.scheduled_time}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:items-end gap-2 shrink-0">
                                        <div className="flex items-center gap-2">
                                            {iv.jitsi_room_id ? (
                                                <Link href={`/dashboard/interviews/${iv.id}/session`}>
                                                    <Button className="h-9 rounded-md px-4 font-semibold text-xs gap-2 bg-slate-900 hover:bg-slate-800">
                                                        Start Session <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <a href={iv.location_link} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" className="h-9 rounded-md px-4 font-semibold text-xs gap-2">
                                                        {iv.location_link?.includes('http') ? 'Buka Link Meeting' : 'Peta Lokasi'} <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                </a>
                                            )}
                                            <Link href={`/dashboard/interviews/${iv.id}/scorecard`}>
                                                <Button variant="ghost" className="h-9 w-9 p-0 rounded-md border border-slate-200 group-hover:bg-amber-50 group-hover:border-amber-200 transition-colors">
                                                    <Star className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/candidates/${iv.application_id}`}>
                                                <Button variant="ghost" className="h-9 w-9 p-0 rounded-md border border-slate-200">
                                                    <History className="w-4 h-4 text-slate-400" />
                                                </Button>
                                            </Link>
                                        </div>
                                        {iv.interview_templates?.title && (
                                            <span className="text-[9px] font-semibold text-primary/70 bg-brand-50 px-2 py-0.5 rounded-md border border-primary/10">
                                                Template: {iv.interview_templates.title}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Completed / Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                     <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Selesai ({completed.length})
                    </h3>

                    <div className="bg-slate-900 rounded-md p-6">
                        <div className="space-y-5">
                            {completed.length === 0 ? (
                                <p className="text-xs font-medium text-slate-500 italic text-center py-4">Belum ada sesi selesai.</p>
                            ) : (
                                completed.slice(0, 5).map(iv => (
                                    <div key={iv.id} className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-white truncate leading-none mb-1">{iv.applications.full_name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{iv.scheduled_date}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Link href={`/dashboard/interviews/${iv.id}/recap`}>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-md text-slate-500 hover:text-white hover:bg-white/10">
                                                    <FileText className="w-3.5 h-3.5" />
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/candidates/${iv.application_id}`}>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-md text-slate-500 hover:text-white hover:bg-white/10">
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                            {completed.length > 5 && (
                                <Button variant="ghost" className="w-full text-white/50 font-semibold text-[10px] uppercase h-9 border border-white/10 rounded-md hover:bg-white/5">
                                    Lihat Semua History
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4">
                         <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Summary Performa</h4>
                         <div className="grid grid-cols-2 gap-3">
                             <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                                 <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Total Online</p>
                                 <p className="text-xl font-bold text-slate-900 leading-none">{interviews.filter(i => i.format === 'online').length}</p>
                             </div>
                             <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                                 <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Total Offline</p>
                                 <p className="text-xl font-bold text-slate-900 leading-none">{interviews.filter(i => i.format === 'offline').length}</p>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
