"use client"

import { usePathname } from 'next/navigation'
import { NavItem } from './NavItem'
import {
    Briefcase,
    Users,
    ClipboardCheck,
    CalendarDays,
    UserSquare,
    LineChart,
    GraduationCap,
    Settings
} from 'lucide-react'

export function Sidebar({ isOpen, setIsOpen }) {
    const pathname = usePathname()

    const navLinks = [
        { icon: Briefcase, label: 'Lowongan', href: '/dashboard/jobs' },
        { icon: Users, label: 'Kandidat', href: '/dashboard/candidates' },
        { icon: ClipboardCheck, label: 'Assessment', href: '/dashboard/assessments' },
        { icon: CalendarDays, label: 'Interview', href: '/dashboard/interviews' },
        { icon: UserSquare, label: 'Karyawan', href: '/dashboard/employees' },
        { icon: LineChart, label: 'Performa', href: '/dashboard/performance' },
        { icon: GraduationCap, label: 'LMS', href: '/dashboard/lms' },
        { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
    ]

    return (
        <aside className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-bg border-r border-sidebar-border flex flex-col transition-transform duration-300
            lg:relative lg:translate-x-0
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
                <span className="text-white font-bold text-xl tracking-tight">
                    Arvela<span className="text-primary">HR</span>
                </span>
            </div>
            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navLinks.map((link) => (
                    <NavItem
                        key={link.href}
                        icon={link.icon}
                        label={link.label}
                        href={link.href}
                        isActive={pathname.startsWith(link.href)}
                    />
                ))}
            </nav>
        </aside>
    )
}
