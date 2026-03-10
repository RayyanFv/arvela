'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    BookOpen,
    Target,
    User,
    LogOut,
    Menu,
    X,
    Bell,
    GraduationCap,
    Briefcase,
    Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/staff' },
    { name: 'Presensi', icon: Clock, path: '/staff/attendance' },
    { name: 'Izin & Cuti', icon: BookOpen, path: '/staff/attendance/requests' },
    { name: 'Onboarding', icon: Briefcase, path: '/staff/onboarding' },
    { name: 'Target Kerja', icon: Target, path: '/staff/okrs' },
    { name: 'Kursus Saya', icon: GraduationCap, path: '/staff/courses' },
    { name: 'Profil', icon: User, path: '/staff/profile' },
]

export default function StaffLayout({ children }) {
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
    const router = useRouter()
    const supabase = createClient()

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Top Navbar */}
            <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center font-black text-white text-xl italic shadow-lg shadow-primary/20">A</div>
                    <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">Team<span className="text-primary">Arvela</span></span>
                </div>

                <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
                    {NAV_ITEMS.map(item => {
                        const isActive = pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                    }`}
                            >
                                <item.icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                                {item.name}
                            </Link>
                        )
                    })}
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-primary">
                        <Bell className="w-5 h-5" />
                    </Button>
                    <div className="w-px h-6 bg-slate-200 mx-2 hidden md:block" />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="rounded-xl text-slate-400 hover:text-destructive transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden rounded-xl"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </Button>
                </div>
            </header>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden bg-white p-6 animate-in slide-in-from-top-10 duration-300">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center font-black text-white text-xl italic shadow-lg">A</div>
                            <span className="text-xl font-black text-slate-900 tracking-tighter">Team<span className="text-primary">Arvela</span></span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                            <X className="w-6 h-6" />
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {NAV_ITEMS.map(item => (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-4 p-5 rounded-2xl text-lg font-black transition-all ${pathname === item.path ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-700 active:bg-slate-50'
                                    }`}
                            >
                                <item.icon className="w-6 h-6" />
                                {item.name}
                            </Link>
                        ))}
                    </div>
                    <div className="absolute bottom-10 left-6 right-6 pt-10 border-t border-slate-100">
                        <Button
                            variant="destructive"
                            className="w-full h-14 rounded-2xl font-black gap-3"
                            onClick={handleLogout}
                        >
                            <LogOut /> Keluar
                        </Button>
                    </div>
                </div>
            )}

            <main className="flex-1 p-6 md:p-10">
                {children}
            </main>
        </div>
    )
}
