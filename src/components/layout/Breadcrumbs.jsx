'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const LABEL_MAP = {
    dashboard: 'Dashboard',
    jobs: 'Lowongan',
    candidates: 'Kandidat',
    assessments: 'Assessment',
    interviews: 'Interview',
    employees: 'Karyawan',
    attendance: 'Kehadiran',
    overtime: 'Lembur',
    performance: 'Performa',
    lms: 'LMS',
    onboarding: 'Onboarding',
    requests: 'Pengajuan',
    holidays: 'Hari Libur',
    new: 'Baru',
    staff: 'Staff',
    courses: 'Kursus',
    okrs: 'Target Kerja',
    profile: 'Profil',
}

export function Breadcrumbs({ items }) {
    const pathname = usePathname()

    // Auto-generate from pathname if no items provided
    const crumbs = items || generateBreadcrumbs(pathname)

    if (crumbs.length <= 1) return null

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm mb-6">
            {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1
                return (
                    <div key={crumb.href || index} className="flex items-center gap-1">
                        {index > 0 && (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-0.5" />
                        )}
                        {index === 0 ? (
                            <Link
                                href={crumb.href}
                                className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors font-semibold"
                            >
                                <Home className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{crumb.label}</span>
                            </Link>
                        ) : isLast ? (
                            <span className="font-bold text-slate-800 text-[13px]">
                                {crumb.label}
                            </span>
                        ) : (
                            <Link
                                href={crumb.href}
                                className="font-semibold text-slate-400 hover:text-primary transition-colors text-[13px]"
                            >
                                {crumb.label}
                            </Link>
                        )}
                    </div>
                )
            })}
        </nav>
    )
}

function generateBreadcrumbs(pathname) {
    const segments = pathname.split('/').filter(Boolean)
    const crumbs = []

    segments.forEach((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/')

        // Skip UUID-like segments, show as "Detail"
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(segment)
        const label = isUUID
            ? 'Detail'
            : LABEL_MAP[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

        crumbs.push({ label, href })
    })

    return crumbs
}
