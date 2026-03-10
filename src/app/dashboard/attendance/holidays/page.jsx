'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    CalendarDays, Clock, FileText, CheckCircle2,
    XCircle, Loader2, Plus, ArrowLeft, Settings2, Trash2
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function HRHolidaysPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [company, setCompany] = useState(null)
    const [holidays, setHolidays] = useState([])

    const [newHoliday, setNewHoliday] = useState({ name: '', start_date: '', end_date: '', is_national: true })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: prof } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
        if (!prof?.company_id) return

        const { data: comp } = await supabase.from('companies').select('id, name').eq('id', prof.company_id).single()
        setCompany(comp)

        const currentYear = new Date().getFullYear()

        // Fetch Holidays
        const { data: hols } = await supabase
            .from('company_holidays')
            .select('*')
            .eq('company_id', prof.company_id)
            .gte('date', `${currentYear}-01-01`)
            .order('date', { ascending: true })
        setHolidays(hols || [])

        setLoading(false)
    }

    async function handleSaveHoliday(e) {
        e.preventDefault()
        setSaving(true)

        // If it's an interval, we loop and insert for each day
        const startDate = new Date(newHoliday.start_date)
        const endDate = newHoliday.end_date ? new Date(newHoliday.end_date) : startDate

        if (endDate < startDate) {
            alert('Tanggal Selesai tidak boleh kurang dari Tanggal Mulai.')
            setSaving(false)
            return
        }

        const inserts = []
        let currentDate = new Date(startDate)

        while (currentDate <= endDate) {
            inserts.push({
                company_id: company.id,
                name: newHoliday.name,
                date: currentDate.toISOString().split('T')[0],
                is_national: newHoliday.is_national
            })
            currentDate.setDate(currentDate.getDate() + 1)
        }

        const { error } = await supabase.from('company_holidays').upsert(inserts, { onConflict: 'company_id, date' })

        if (!error) {
            setNewHoliday({ name: '', start_date: '', end_date: '', is_national: true })
            fetchData()
        } else {
            alert(error.message)
        }
        setSaving(false)
    }

    async function handleDelete(id) {
        if (!confirm('Hapus hari libur ini?')) return
        await supabase.from('company_holidays').delete().eq('id', id)
        fetchData()
    }

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>

    // Grouping consecutive holidays logic (simple visual grouping)
    const groupedHolidays = []
    let currentGroup = null

    holidays.forEach((hol, idx) => {
        if (!currentGroup) {
            currentGroup = { ...hol, end_date: hol.date, ids: [hol.id] }
        } else {
            const lastDate = new Date(currentGroup.end_date)
            const currDate = new Date(hol.date)
            const diffTime = Math.abs(currDate - lastDate)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays === 1 && currentGroup.name === hol.name && currentGroup.is_national === hol.is_national) {
                // Extend
                currentGroup.end_date = hol.date
                currentGroup.ids.push(hol.id)
            } else {
                // Break
                groupedHolidays.push(currentGroup)
                currentGroup = { ...hol, end_date: hol.date, ids: [hol.id] }
            }
        }
        if (idx === holidays.length - 1) {
            groupedHolidays.push(currentGroup)
        }
    })

    return (
        <div className="space-y-8 pb-20 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/attendance" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm transition-all hover:scale-105">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kalender <span className="text-emerald-500 italic">Libur</span></h1>
                    <p className="text-slate-500 font-medium">Atur interval tanggal merah & cuti bersama perusahaan.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 md:col-span-1 h-fit sticky top-24">
                    <h3 className="text-lg font-black text-slate-900 mb-6">Tambah Hari Libur</h3>
                    <form onSubmit={handleSaveHoliday} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nama / Keterangan Libur</label>
                            <input type="text" required value={newHoliday.name} onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })} placeholder="Cth: Hari Raya Idul Fitri" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Dari Tanggal</label>
                                <input type="date" required value={newHoliday.start_date} onChange={e => setNewHoliday({ ...newHoliday, start_date: e.target.value, end_date: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Sampai</label>
                                <input type="date" required value={newHoliday.end_date} onChange={e => setNewHoliday({ ...newHoliday, end_date: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm" />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <input type="checkbox" id="national" checked={newHoliday.is_national} onChange={e => setNewHoliday({ ...newHoliday, is_national: e.target.checked })} className="w-4 h-4 rounded text-primary focus:ring-primary" />
                            <label htmlFor="national" className="text-sm font-bold text-slate-700">Tandai Sebagai Libur Nasional</label>
                        </div>
                        <div className="pt-4">
                            <Button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 justify-center font-bold">
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} Tetapkan Libur
                            </Button>
                        </div>
                    </form>
                </Card>

                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-black text-slate-900 mb-2">Daftar Libur (Tahun {new Date().getFullYear()})</h3>
                    {groupedHolidays.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center bg-slate-50 border-dashed rounded-2xl">
                            <CalendarDays className="w-10 h-10 text-slate-300 mb-4" />
                            <h3 className="text-slate-500 font-bold">Belum ada hari libur tersimpan.</h3>
                        </div>
                    ) : (
                        groupedHolidays.map((group, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center shadow-sm relative overflow-hidden gap-4">
                                {group.is_national && <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />}
                                <div className="pl-2">
                                    <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                        {group.name}
                                        {group.is_national && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 px-2 text-[10px]">Nasional</Badge>}
                                    </h4>
                                    <p className="text-sm text-slate-500 font-semibold mt-1">
                                        {new Date(group.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                                        {group.date !== group.end_date ? ` s.d ${new Date(group.end_date).toLocaleDateString('id-ID', { dateStyle: 'long' })}` : ''}
                                        <span className="text-emerald-500 ml-2">({group.ids.length} Hari)</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Button size="icon" variant="ghost" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50" onClick={async () => {
                                        if (!confirm('Hapus seluruh blok libur ini?')) return
                                        setLoading(true)
                                        await supabase.from('company_holidays').delete().in('id', group.ids)
                                        fetchData()
                                    }}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
