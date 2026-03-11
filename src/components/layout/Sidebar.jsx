"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
    Briefcase,
    Users,
    ClipboardCheck,
    CalendarDays,
    UserSquare,
    LineChart,
    GraduationCap,
    LogOut,
    HomeIcon,
    BookOpen,
    Clock,
    ChevronLeft,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const NAV_SECTIONS = [
    {
        label: 'Menu Utama',
        items: [
            { icon: HomeIcon, label: 'Dashboard', href: '/dashboard' },
        ]
    },
    {
        label: 'Rekrutmen',
        items: [
            { icon: Briefcase, label: 'Lowongan', href: '/dashboard/jobs' },
            { icon: Users, label: 'Kandidat', href: '/dashboard/candidates' },
            { icon: ClipboardCheck, label: 'Assessment', href: '/dashboard/assessments' },
            { icon: CalendarDays, label: 'Interview', href: '/dashboard/interviews' },
        ]
    },
    {
        label: 'Karyawan',
        items: [
            { icon: UserSquare, label: 'Data Karyawan', href: '/dashboard/employees' },
            { icon: ClipboardCheck, label: 'Kehadiran', href: '/dashboard/attendance' },
            { icon: Clock, label: 'Pengajuan Lembur', href: '/dashboard/overtime' },
        ]
    },
    {
        label: 'Pengembangan',
        items: [
            { icon: LineChart, label: 'Performa', href: '/dashboard/performance' },
            { icon: GraduationCap, label: 'LMS', href: '/dashboard/lms' },
            { icon: BookOpen, label: 'Onboarding', href: '/dashboard/onboarding' },
        ]
    },
]

export function Sidebar({ isOpen, setIsOpen }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [collapsed, setCollapsed] = useState(false)

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out",
            "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950",
            "border-r border-white/5",
            "lg:relative lg:translate-x-0",
            collapsed ? "w-[72px]" : "w-[260px]",
            isOpen ? 'translate-x-0' : '-translate-x-full',
        )}>
            {/* Brand Header */}
            <div className={cn(
                "h-[72px] flex items-center border-b border-white/5 shrink-0 relative",
                collapsed ? "px-4 justify-center" : "px-5"
            )}>
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                        <span className="text-white font-black text-sm">A</span>
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <span className="text-white font-black text-lg tracking-tight whitespace-nowrap">
                                Arvela<span className="text-primary">HR</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Collapse toggle (Desktop only) */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full",
                        "bg-slate-800 border border-white/10 items-center justify-center",
                        "text-slate-400 hover:text-white hover:bg-slate-700 transition-all",
                        "shadow-lg"
                    )}
                >
                    <ChevronLeft className={cn("w-3.5 h-3.5 transition-transform", collapsed && "rotate-180")} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6 sidebar-scroll">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.label}>
                        {!collapsed && (
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500 px-3 mb-2">
                                {section.label}
                            </p>
                        )}
                        {collapsed && <div className="w-6 h-px bg-white/10 mx-auto mb-2" />}
                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                const isActive = item.href === '/dashboard'
                                    ? pathname === '/dashboard'
                                    : pathname.startsWith(item.href)

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        title={collapsed ? item.label : undefined}
                                        className={cn(
                                            "group flex items-center gap-3 rounded-xl text-[13px] font-semibold transition-all duration-200 relative",
                                            collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5",
                                            isActive
                                                ? "bg-white/10 text-white shadow-sm"
                                                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                        )}
                                    >
                                        {/* Active indicator */}
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                                        )}
                                        <item.icon className={cn(
                                            "w-[18px] h-[18px] shrink-0 transition-colors",
                                            isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-300"
                                        )} />
                                        {!collapsed && (
                                            <span className="truncate">{item.label}</span>
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Logout Footer */}
            <div className="p-3 border-t border-white/5 shrink-0">
                <button
                    onClick={handleLogout}
                    title={collapsed ? "Keluar" : undefined}
                    className={cn(
                        "flex items-center gap-3 w-full rounded-xl text-sm font-semibold transition-all duration-200 group",
                        "text-slate-500 hover:text-rose-400 hover:bg-rose-500/10",
                        collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
                    )}
                >
                    <LogOut className="w-[18px] h-[18px] shrink-0 group-hover:text-rose-400 transition-colors" />
                    {!collapsed && <span>Keluar</span>}
                </button>
            </div>
        </aside>
    )
}
