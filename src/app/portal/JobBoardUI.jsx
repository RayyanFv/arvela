'use client'

import { useState, useMemo } from 'react'
import { Search, MapPin, Building2, Clock, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

const WORK_TYPE_ID = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' }
const EMP_TYPE_ID = { fulltime: 'Full-time', parttime: 'Part-time', contract: 'Kontrak', internship: 'Magang' }

export default function JobBoardUI({ initialJobs }) {
    const [search, setSearch] = useState('')
    const [location, setLocation] = useState('')
    const [activeWorkType, setActiveWorkType] = useState(null)
    const [activeEmpType, setActiveEmpType] = useState(null)

    const filteredJobs = useMemo(() => {
        return initialJobs.filter(job => {
            const matchesSearch = !search ||
                job.title.toLowerCase().includes(search.toLowerCase()) ||
                job.companies?.name?.toLowerCase().includes(search.toLowerCase())
            const matchesLocation = !location ||
                job.location?.toLowerCase().includes(location.toLowerCase())
            const matchesWorkType = !activeWorkType || job.work_type === activeWorkType
            const matchesEmpType = !activeEmpType || job.employment_type === activeEmpType

            return matchesSearch && matchesLocation && matchesWorkType && matchesEmpType
        })
    }, [initialJobs, search, location, activeWorkType, activeEmpType])

    const resetFilters = () => {
        setSearch('')
        setLocation('')
        setActiveWorkType(null)
        setActiveEmpType(null)
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Search & Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sticky top-[72px] sm:top-[88px] z-30 mb-8 -mt-6">
                <div className="flex flex-col lg:flex-row items-center gap-3">
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Jabatan atau nama perusahaan"
                                className="h-11 pl-10 rounded-lg border-slate-200 focus:ring-primary/20 text-sm font-medium"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="relative group">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Kota atau remote"
                                className="h-11 pl-10 rounded-lg border-slate-200 focus:ring-primary/20 text-sm font-medium"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <div className="h-10 w-px bg-slate-200 mx-1 hidden lg:block" />

                        <div className="grid grid-cols-2 gap-2 flex-1 lg:flex-none">
                            <select
                                className="h-11 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-semibold text-slate-600 outline-none focus:border-primary transition-all min-w-[120px]"
                                value={activeWorkType || ''}
                                onChange={(e) => setActiveWorkType(e.target.value || null)}
                            >
                                <option value="">Tipe Kerja</option>
                                {Object.entries(WORK_TYPE_ID).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>

                            <select
                                className="h-11 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-semibold text-slate-600 outline-none focus:border-primary transition-all min-w-[120px]"
                                value={activeEmpType || ''}
                                onChange={(e) => setActiveEmpType(e.target.value || null)}
                            >
                                <option value="">Kontrak</option>
                                {Object.entries(EMP_TYPE_ID).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {(search || location || activeWorkType || activeEmpType) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="h-11 px-3 text-slate-400 hover:text-destructive font-bold text-xs gap-1.5"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid gap-6">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 leading-tight">
                            {filteredJobs.length} Lowongan ditemukan
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">Hasil terbaru di Arvela Career</p>
                    </div>
                </div>

                {filteredJobs.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 italic font-serif text-slate-300 text-2xl">?</div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Hasil tidak ditemukan</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">Coba hapus beberapa filter atau gunakan kata kunci lain.</p>
                        <Button variant="outline" className="rounded-lg h-10 px-6 font-bold" onClick={resetFilters}>
                            Tampilkan Semua
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {filteredJobs.map(job => (
                            <Link
                                key={job.id}
                                href={`/${job.companies?.slug}/${job.slug}`}
                                className="group flex flex-col sm:flex-row items-start sm:items-center gap-5 bg-white border border-slate-200 p-6 rounded-xl hover:border-primary hover:shadow-lg hover:shadow-primary/5 transition-all"
                            >
                                <div className="w-14 h-14 bg-white border border-slate-100 rounded-lg flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                                    {job.companies?.logo_url ? (
                                        <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 className="w-7 h-7 text-slate-200" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <Badge variant="secondary" className="bg-brand-50 text-primary text-[10px] uppercase font-bold tracking-wider py-0 px-2 rounded-md border-brand-100/50">
                                            {EMP_TYPE_ID[job.employment_type]}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider py-0 px-2 rounded-md">
                                            {WORK_TYPE_ID[job.work_type]}
                                        </Badge>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                                        {job.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 font-medium">
                                        <span className="text-sm text-slate-700">{job.companies?.name}</span>
                                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <MapPin className="w-3.5 h-3.5 text-primary/60" /> {job.location || 'Remote'}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <Clock className="w-3.5 h-3.5" /> {formatDistanceToNow(new Date(job.published_at || job.created_at), { locale: localeID })}
                                        </span>
                                    </div>
                                </div>

                                <div className="w-full sm:w-auto flex items-center justify-end sm:pl-6 border-t sm:border-t-0 sm:border-l border-slate-100 mt-3 sm:mt-0 pt-3 sm:pt-0">
                                    <Button size="sm" className="rounded-lg font-bold bg-slate-900 hover:bg-primary text-white transition-colors h-10 px-5">
                                        Lamar
                                    </Button>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
