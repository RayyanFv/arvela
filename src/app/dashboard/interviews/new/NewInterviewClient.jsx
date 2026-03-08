'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, CalendarDays, Clock, Video, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { scheduleInterview } from '@/lib/actions/interviews'

export default function NewInterviewFormClient({ candidates, dbError, upcoming }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const prefilledCandidateId = searchParams.get('candidate') || ''

    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        application_id: prefilledCandidateId,
        date: '',
        time: '',
        duration: '60',
        format: 'online',
        link: 'https://meet.google.com/xyz-abcd-efg'
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.application_id || !formData.date || !formData.time) {
            alert('Lengkapi data wajib (Kandidat, Tanggal, dan Waktu)')
            return
        }

        setSubmitting(true)
        try {
            await scheduleInterview(formData)
            alert('Jadwal interview berhasil dibuat. Undangan telah dikirim ke kandidat.')
            router.push('/dashboard/interviews')
        } catch (error) {
            alert('Gagal membuat jadwal: ' + error.message)
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/interviews">
                    <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 hover:bg-slate-200">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Buat Jadwal Interview</h1>
                    <p className="text-slate-500 font-medium text-sm">Pilih kandidat dan tentukan waktu wawancara.</p>
                </div>
            </div>

            {dbError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold">
                    Error loading candidates: {dbError}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kolom Kiri: Form Input */}
                <Card className="lg:col-span-2 p-8 border-none shadow-xl shadow-slate-100/50 rounded-[32px] bg-white">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-900">1. Pilih Kandidat <span className="text-red-500">*</span></label>
                            <select
                                className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 cursor-pointer"
                                value={formData.application_id}
                                onChange={(e) => setFormData({ ...formData, application_id: e.target.value })}
                            >
                                <option value="">-- Pilih kandidat potensial --</option>
                                {candidates && candidates.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.full_name} ({c.jobs?.title || 'Posisi Tertutup'}) - Stage: {c.stage}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[11px] font-bold text-slate-400 mt-1 italic">
                                *Hanya menampilkan kandidat di tahap Assessment atau Interview. Total kandidat tersedia: {candidates?.length || 0}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-900 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-slate-400" /> Tanggal <span className="text-red-500">*</span></label>
                                <Input
                                    type="date"
                                    className="h-12 rounded-xl bg-slate-50 border-slate-200"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-900 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> Waktu <span className="text-red-500">*</span></label>
                                <Input
                                    type="time"
                                    className="h-12 rounded-xl bg-slate-50 border-slate-200"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-900 flex items-center gap-2"><Video className="w-4 h-4 text-slate-400" /> Link Pertemuan (Google Meet / Zoom)</label>
                            <Input
                                type="text"
                                className="h-12 rounded-xl bg-slate-50 border-slate-200"
                                placeholder="https://... atau masukkan alamat pertemuan offline"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            />
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                            <Link href="/dashboard/interviews">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-12 px-6 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
                                >
                                    Batal
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                className="h-12 px-8 rounded-xl font-black bg-primary text-white hover:bg-brand-600 gap-2 shadow-xl shadow-primary/20"
                                disabled={submitting}
                            >
                                {submitting ? 'Menjadwalkan...' : (
                                    <><CheckCircle2 className="w-5 h-5" /> Simpan & Kirim Undangan</>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Kolom Kanan: Monitoring Jadwal */}
                <div className="space-y-4">
                    <div className="bg-slate-900 border-none shadow-xl shadow-slate-900/10 rounded-[32px] p-6 text-white min-h-[400px]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                <CalendarDays className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight">Monitoring Jadwal</h2>
                                <p className="text-slate-400 font-medium text-xs">Cek bentrok jadwal mendatang.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {!upcoming || upcoming.length === 0 ? (
                                <div className="p-6 border border-white/10 border-dashed rounded-2xl text-center">
                                    <p className="text-sm font-bold text-slate-400">Belum ada jadwal wawancara.</p>
                                </div>
                            ) : (
                                upcoming.map((interview) => (
                                    <div key={interview.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
                                        <h4 className="font-bold text-sm mb-1">{interview.applications?.full_name}</h4>
                                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <CalendarDays className="w-3.5 h-3.5" />
                                                {new Date(interview.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {interview.scheduled_time.substring(0, 5)} WIB
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
