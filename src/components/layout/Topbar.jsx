"use client"

import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Menu, LogOut } from 'lucide-react'

export function Topbar({ onOpenSidebar }) {
    const { profile, loading } = useProfile()
    const router = useRouter()
    const supabase = createClient()

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const [today, setToday] = useState('')

    useEffect(() => {
        setToday(new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }))
    }, [])

    return (
        <header className="h-[72px] flex items-center justify-between px-6 bg-white/50 backdrop-blur-md border-b border-sidebar-border/50 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                {/* Hamburger (Mobile) */}
                {onOpenSidebar && (
                    <div className="lg:hidden">
                        <Button variant="ghost" size="icon" onClick={onOpenSidebar} className="text-slate-500 hover:bg-slate-100 rounded-xl">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </div>
                )}
                <div className="hidden sm:block">
                    <div className="text-sm font-black text-slate-800 tracking-tight flex items-center h-5">
                        {loading ? <Skeleton className="w-32 h-5" /> : `Halo, ${profile?.full_name?.split(' ')[0] || 'Tim'}! 👋`}
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5 min-h-[16px]">{today}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {loading ? (
                    <Skeleton className="w-10 h-10 rounded-full" />
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger className="relative h-10 w-10 text-left flex items-center justify-center rounded-full hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer outline-none ring-0 focus:ring-0">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name} />
                                <AvatarFallback className="bg-gradient-to-tr from-primary/80 to-primary text-white font-bold text-sm">
                                    {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'HR'}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-2xl p-2" align="end">
                            <DropdownMenuLabel className="font-normal px-2 py-1.5">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-bold text-slate-900 leading-none">{profile?.full_name}</p>
                                    <p className="text-xs font-semibold text-slate-500 mt-1 truncate">
                                        {profile?.companies?.name || 'Administrator'}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100 my-1" />
                            <DropdownMenuItem onClick={handleLogout} className="text-rose-600 font-bold focus:bg-rose-50 focus:text-rose-700 rounded-xl cursor-pointer gap-2">
                                <LogOut className="w-4 h-4" />
                                Keluar / Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    )
}
