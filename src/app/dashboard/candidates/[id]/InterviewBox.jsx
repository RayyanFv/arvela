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
    Plus,
    Loader2,
    ArrowRight,
    Users,
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
        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
             {/* Header */}
             <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary" />
                    Jadwal Interview
                </h2>
                {!isScheduling && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsScheduling(true)}
                        className="rounded-md h-8 text-[10px] font-semibold uppercase gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" /> Jadwalkan
                    </Button>
                )}
            </div>

            {/* List Existing */}
            {!isScheduling && interviews.length > 0 && (
                <div className="space-y-3">
                    {interviews.map(iv => (
                        <div key={iv.id} className="bg-slate-50 border border-slate-100 rounded-md p-4 flex items-center justify-between hover:border-primary/20 transition-colors">
                            <div className="flex gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-md flex items-center justify-center shrink-0 border",
                                    iv.status === 'scheduled' ? "bg-brand-50 border-primary/10 text-primary" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                                )}>
                                    <Video className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-none mb-1">{iv.format} Interview</h4>
                                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        {iv.scheduled_date} &bull; {iv.scheduled_time}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={cn(
                                            "text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded",
                                            iv.status === 'scheduled' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                        )}>
                                            {iv.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Link href={`/dashboard/interviews/${iv.id}/session`}>
                                <Button size="sm" className="rounded-md h-9 font-semibold text-[10px] uppercase gap-2">
                                    Start Session <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {!isScheduling && interviews.length === 0 && (
                <div className="py-8 text-center space-y-3 bg-slate-50 rounded-md border border-dashed border-slate-200">
                    <CalendarRange className="w-9 h-9 text-slate-300 mx-auto" />
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Belum Ada Jadwal</p>
                        <p className="text-[10px] text-slate-400 font-medium">Klik 'Jadwalkan' untuk mengatur sesi wawancara.</p>
                    </div>
                </div>
            )}

            {/* Schedule Form */}
            {isScheduling && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal</label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-10 rounded-md"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase">Waktu</label>
                            <Input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="h-10 rounded-md"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Format</label>
                        <Select value={format} onValueChange={setFormat}>
                            <SelectTrigger className="h-10 rounded-md font-medium text-xs">
                                <SelectValue placeholder="Format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="online_internal" className="text-xs font-medium">Online — Jitsi Embedded (Internal)</SelectItem>
                                <SelectItem value="online_external" className="text-xs font-medium">Online — External Link (Zoom/Meet)</SelectItem>
                                <SelectItem value="offline" className="text-xs font-medium">Offline — Tatap Muka</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {format === 'online_external' && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase">Link Meeting (Zoom/Meet)</label>
                            <Input
                                placeholder="https://zoom.us/j/..."
                                value={locationLink}
                                onChange={(e) => setLocationLink(e.target.value)}
                                className="h-10 rounded-md text-xs font-medium"
                            />
                        </div>
                    )}

                    {format === 'offline' && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase">Lokasi Kantor</label>
                            <Input
                                placeholder="Masukkan alamat kantor..."
                                value={locationLink}
                                onChange={(e) => setLocationLink(e.target.value)}
                                className="h-10 rounded-md text-xs font-medium"
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Template Interview</label>
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                            <SelectTrigger className="h-10 rounded-md">
                                <SelectValue placeholder="Pilih Template (Opsional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Tanpa Template</SelectItem>
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsScheduling(false)}
                            className="flex-1 rounded-md h-10 font-semibold text-slate-500"
                        >
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSchedule}
                            disabled={!date || !time || loading}
                            className="flex-1 rounded-md h-10 font-semibold uppercase tracking-wide gap-2"
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
