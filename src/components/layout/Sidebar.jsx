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
    Settings,
    LogOut,
    HomeIcon,
    BookOpen
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function Sidebar({ isOpen, setIsOpen }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const navLinks = [
        { icon: HomeIcon, label: 'Dashboard', href: '/dashboard' },
        { icon: Briefcase, label: 'Lowongan', href: '/dashboard/jobs' },
        { icon: Users, label: 'Kandidat', href: '/dashboard/candidates' },
        { icon: ClipboardCheck, label: 'Assessment', href: '/dashboard/assessments' },
        { icon: CalendarDays, label: 'Interview', href: '/dashboard/interviews' },
        { icon: UserSquare, label: 'Karyawan', href: '/dashboard/employees' },
        { icon: LineChart, label: 'Performa', href: '/dashboard/performance' },
        { icon: GraduationCap, label: 'LMS', href: '/dashboard/lms' },
        { icon: BookOpen, label: 'Onboarding', href: '/dashboard/onboarding' },

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
                        isActive={
                            link.href === '/dashboard'
                                ? pathname === '/dashboard'
                                : pathname.startsWith(link.href)
                        }
                    />
                ))}
            </nav>

            {/* Logout bottom */}
            <div className="p-3 border-t border-sidebar-border">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sidebar-muted hover:text-white hover:bg-white/10 transition-all duration-200 font-medium text-sm group"
                >
                    <LogOut className="w-5 h-5 text-sidebar-muted group-hover:text-primary transition-colors" />
                    Keluar / Logout
                </button>
            </div>
        </aside>
    )
}
