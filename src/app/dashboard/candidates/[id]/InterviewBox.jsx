'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { scheduleInterview } from '@/lib/actions/interviews'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Video,
    Calendar,
    Clock,
    Plus,
    Loader2,
    CalendarDays,
    ArrowRight,
    MapPin,
    Users,
    ChevronRight,
    CalendarRange
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function CandidateInterviewBox({ application, templates = [], interviews = [] }) {
    const router = useRouter()
    const [selectedTemplateId, setSelectedTemplateId] = useState('')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [format, setFormat] = useState('online_internal')
    const [locationLink, setLocationLink] = useState('')
    const [loading, setLoading] = useState(false)
    const [isScheduling, setIsScheduling] = useState(false)

    async function handleSchedule() {
        if (!date || !time) return
        setLoading(true)

        try {
            await scheduleInterview({
                application_id: application.id,
                scheduled_date: date,
                scheduled_time: time,
                template_id: selectedTemplateId === 'none' ? null : selectedTemplateId,
                format,
                location_link: locationLink
            })
            setIsScheduling(false)
            setSelectedTemplateId('')
            setDate('')
            setTime('')
            setLocationLink('')
            router.refresh()
        } catch (error) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-6 relative overflow-hidden">
             {/* Header */}
             <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary" />
                    Jadwal Interview
                </h2>
                {!isScheduling && (
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => setIsScheduling(true)}
                        className="rounded-xl h-8 text-[10px] font-black uppercase tracking-widest gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" /> Jadwalkan
                    </Button>
                )}
            </div>

            {/* List Existing */}
            {!isScheduling && interviews.length > 0 && (
                <div className="space-y-4">
                    {interviews.map(iv => (
                        <div key={iv.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between group hover:border-primary/20 transition-all transition-shadow hover:shadow-md">
                            <div className="flex gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                                    iv.status === 'scheduled' ? "bg-primary/5 border-primary/10 text-primary" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                                )}>
                                    <Video className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">{iv.format} Interview</h4>
                                    <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        {iv.scheduled_date} &bull; {iv.scheduled_time}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                                            iv.status === 'scheduled' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                        )}>
                                            {iv.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <Link href={`/dashboard/interviews/${iv.id}/session`}>
                                <Button size="sm" className="rounded-xl h-9 font-black text-[10px] uppercase gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                    Start Session <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {!isScheduling && interviews.length === 0 && (
                <div className="py-10 text-center space-y-4 bg-slate-50/50 rounded-[24px] border border-dashed border-slate-200">
                    <CalendarRange className="w-10 h-10 text-slate-300 mx-auto" />
                    <div className="space-y-1">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Belum Ada Jadwal</p>
                        <p className="text-[10px] text-slate-400 font-medium">Klik 'Jadwalkan' untuk mengatur sesi wawancara.</p>
                    </div>
                </div>
            )}

            {/* Schedule Form */}
            {isScheduling && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tanggal</label>
                            <Input 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)}
                                className="h-10 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Waktu</label>
                            <Input 
                                type="time" 
                                value={time} 
                                onChange={(e) => setTime(e.target.value)}
                                className="h-10 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Format</label>
                        <Select value={format} onValueChange={setFormat}>
                            <SelectTrigger className="h-10 rounded-xl font-bold text-xs">
                                <SelectValue placeholder="Format" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="online_internal" className="text-xs font-bold">Online — Jitsi Embedded (Internal)</SelectItem>
                                <SelectItem value="online_external" className="text-xs font-bold">Online — External Link (Zoom/Meet)</SelectItem>
                                <SelectItem value="offline" className="text-xs font-bold">Offline — Tatap Muka</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {format === 'online_external' && (
                        <div className="space-y-1.5 animate-in slide-in-from-top-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Link Meeting (Zoom/Meet)</label>
                            <Input 
                                placeholder="https://zoom.us/j/..." 
                                value={locationLink}
                                onChange={(e) => setLocationLink(e.target.value)}
                                className="h-10 rounded-xl text-xs font-bold"
                            />
                        </div>
                    )}

                    {format === 'offline' && (
                        <div className="space-y-1.5 animate-in slide-in-from-top-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Lokasi Kantor</label>
                            <Input 
                                placeholder="Masukkan alamat kantor..." 
                                value={locationLink}
                                onChange={(e) => setLocationLink(e.target.value)}
                                className="h-10 rounded-xl text-xs font-bold"
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Template Interview</label>
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                            <SelectTrigger className="h-10 rounded-xl">
                                <SelectValue placeholder="Pilih Template (Opsional)" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="none">Tanpa Template</SelectItem>
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setIsScheduling(false)}
                            className="flex-1 rounded-xl h-10 font-bold text-slate-500"
                        >
                            Batal
                        </Button>
                        <Button 
                            size="sm" 
                            onClick={handleSchedule}
                            disabled={!date || !time || loading}
                            className="flex-1 rounded-xl h-10 font-black uppercase tracking-widest gap-2"
                        >
                            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Simpan Jadwal
                        </Button>
                    </div>
                </div>
            )}

            <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] text-center text-slate-400 leading-relaxed italic">
                    <Users className="w-3 h-3 inline mr-1" />
                    Interview online akan otomatis terhubung dengan Jitsi Arvela.
                </p>
            </div>
        </div>
    )
}
