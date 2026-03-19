import { getAllInterviews } from '@/lib/actions/interviews'
import { Button } from '@/components/ui/button'
import {
    Video,
    Calendar,
    Clock,
    Search,
    Filter,
    ChevronRight,
    MapPin,
    ExternalLink,
    VideoOff,
    CheckCircle2,
    CalendarDays,
    Plus,
    History,
    Star,
    FileText
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Daftar Interview — Arvela HR' }

export default async function InterviewsPage() {
    let interviews = []
    try {
        interviews = await getAllInterviews()
    } catch (err) {
        console.error(err)
    }

    const scheduled = interviews.filter(i => i.status === 'scheduled')
    const completed = interviews.filter(i => i.status !== 'scheduled')

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Interview</h1>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        {interviews.length} Total Jadwal Terdaftar
                    </p>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                    <Link href="/dashboard/interviews/new">
                        <Button className="h-12 rounded-2xl font-black bg-primary hover:bg-brand-600 gap-2 px-6 shadow-xl shadow-primary/20">
                            <Plus className="w-4 h-4" /> Tambah Interview
                        </Button>
                    </Link>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl flex items-center px-4 h-12 group focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                        <Search className="w-4 h-4 text-slate-400 mr-3" />
                        <input 
                            placeholder="Cari kandidat..." 
                            className="bg-transparent border-none outline-none text-sm font-bold w-48"
                        />
                    </div>
                    <Button variant="outline" className="h-12 rounded-2xl border-slate-200 font-bold gap-2 px-6">
                        <Filter className="w-4 h-4" /> Filter
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Upcoming */}
                <div className="lg:col-span-8 space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                        <span className="w-8 h-px bg-slate-200" />
                        Akan Datang ({scheduled.length})
                    </h3>

                    {scheduled.length === 0 ? (
                        <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                             <CalendarDays className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tidak ada wawancara terdekat</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {scheduled.map(iv => (
                                <div key={iv.id} className="bg-white border border-slate-200 rounded-[28px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-primary/5 transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:rotate-3",
                                            iv.jitsi_room_id ? "bg-primary/5 border-primary/10 text-primary font-black" : "bg-emerald-50 border-emerald-100 text-emerald-600 font-black"
                                        )}>
                                            <Video className="w-7 h-7" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{iv.applications.jobs.title}</p>
                                            <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-2">{iv.applications.full_name}</h4>
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {iv.scheduled_date}</span>
                                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {iv.scheduled_time}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:items-end gap-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                            {iv.jitsi_room_id ? (
                                                <Link href={`/dashboard/interviews/${iv.id}/session`}>
                                                    <Button className="h-11 rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-primary/20 bg-slate-900">
                                                        Start Session <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <a href={iv.location_link} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" className="h-11 rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest gap-2">
                                                        {iv.location_link?.includes('http') ? 'Buka Link Meeting' : 'Peta Lokasi'} <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                </a>
                                            )}
                                            <Link href={`/dashboard/interviews/${iv.id}/scorecard`}>
                                                <Button variant="ghost" className="h-11 w-11 p-0 rounded-2xl border border-slate-100 group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors">
                                                    <Star className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/candidates/${iv.application_id}`}>
                                                <Button variant="ghost" className="h-11 w-11 p-0 rounded-2xl border border-slate-100">
                                                    <History className="w-4 h-4 text-slate-400" />
                                                </Button>
                                            </Link>
                                        </div>
                                        {iv.interview_templates?.title && (
                                            <span className="text-[9px] font-black text-primary/60 bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10 uppercase tracking-tighter">
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
                <div className="lg:col-span-4 space-y-8">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                        <span className="w-8 h-px bg-slate-200" />
                        Selesai ({completed.length})
                    </h3>
                    
                    <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="relative space-y-6">
                            {completed.length === 0 ? (
                                <p className="text-xs font-bold text-slate-500 italic text-center py-4">Belum ada sesi selesai.</p>
                            ) : (
                                completed.slice(0, 5).map(iv => (
                                    <div key={iv.id} className="flex items-center gap-4 group/item">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-white truncate leading-none mb-1">{iv.applications.full_name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{iv.scheduled_date}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link href={`/dashboard/interviews/${iv.id}/recap`}>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-500 hover:text-white hover:bg-white/10">
                                                    <FileText className="w-3.5 h-3.5" />
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/candidates/${iv.application_id}`}>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-500 hover:text-white hover:bg-white/10">
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                            {completed.length > 5 && (
                                <Button variant="ghost" className="w-full text-white/40 font-black text-[10px] uppercase tracking-widest h-10 border border-white/5 rounded-xl hover:bg-white/5">
                                    Lihat Semua History
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-white border border-slate-200 rounded-[32px] p-8 space-y-6">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Summary Performa</h4>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Online</p>
                                 <p className="text-2xl font-black text-slate-900 leading-none">{interviews.filter(i => i.format === 'online').length}</p>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Offline</p>
                                 <p className="text-2xl font-black text-slate-900 leading-none">{interviews.filter(i => i.format === 'offline').length}</p>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
