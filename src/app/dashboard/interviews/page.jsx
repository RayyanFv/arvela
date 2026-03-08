'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    CalendarDays,
    Clock,
    User,
    Video,
    MapPin,
    ChevronRight,
    Search,
    ClipboardCheck
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function InterviewsDashboardPage() {
    const [interviews, setInterviews] = useState([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchInterviews() {
            // Fetch candidates in 'interview' stage
            const { data } = await supabase
                .from('applications')
                .select(`
                    id, full_name, email, stage, created_at,
                    jobs (title),
                    companies (name)
                `)
                .eq('stage', 'interview')
                .order('created_at', { ascending: false })

            setInterviews(data || [])
            setLoading(false)
        }
        fetchInterviews()
    }, [])

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Jadwal Interview</h1>
                    <p className="text-slate-500 font-medium">Pantau dan kelola jadwal wawancara kandidat potensial.</p>
                </div>
                <Link href="/dashboard/interviews/new">
                    <Button
                        className="h-11 rounded-xl bg-primary text-white font-black hover:bg-brand-600 gap-2 shadow-lg shadow-primary/20"
                    >
                        <CalendarDays className="w-4 h-4" /> Atur Jadwal Baru
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-48 bg-slate-100 rounded-[32px] animate-pulse" />
                    ))}
                </div>
            ) : interviews.length === 0 ? (
                <Card className="p-20 flex flex-col items-center justify-center text-center border-none shadow-sm rounded-[40px] bg-white">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                        <Video className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400">Belum Ada Interview</h3>
                    <p className="text-slate-300 font-medium max-w-xs mx-auto mt-2">Pindahkan kandidat ke tahap 'Interview' untuk memulai penjadwalan.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {interviews.map(item => (
                        <Card key={item.id} className="p-6 rounded-[32px] border-none shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-primary/5 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full translate-x-8 -translate-y-8" />

                            <div className="space-y-4 relative">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-primary italic border border-slate-100">
                                        {item.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 tracking-tight">{item.full_name}</h4>
                                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{item.jobs?.title}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <CalendarDays className="w-3.5 h-3.5 text-slate-300" /> Belum Terjadwal
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <Video className="w-3.5 h-3.5 text-slate-300" /> Link akan dikirim ke email
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-2">
                                    <Link href={`/dashboard/candidates/${item.id}`} className="flex-1">
                                        <Button
                                            variant="outline"
                                            className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200"
                                        >
                                            Detail
                                        </Button>
                                    </Link>
                                    <Link href={`/dashboard/interviews/${item.id}/scorecard`} className="flex-1">
                                        <Button
                                            variant="outline"
                                            className="w-full h-10 rounded-xl border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-brand-50"
                                        >
                                            <ClipboardCheck className="w-3.5 h-3.5 mr-1" />
                                            Scorecard
                                        </Button>
                                    </Link>
                                    <Link href={`/dashboard/interviews/new?candidate=${item.id}`}>
                                        <Button
                                            className="h-10 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 px-4"
                                        >
                                            Set Jadwal
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
