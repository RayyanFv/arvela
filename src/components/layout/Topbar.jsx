"use client"

import { useProfile } from '@/hooks/use-profile'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Bell, Menu } from 'lucide-react'

export function Topbar({ onOpenSidebar }) {
    const { profile, loading } = useProfile()
    const router = useRouter()
    const supabase = createClient()

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-sidebar-border shrink-0">
            {/* Hamburger (Mobile) */}
            {onOpenSidebar && (
                <div className="flex items-center lg:hidden mr-2">
                    <Button variant="ghost" size="icon" onClick={onOpenSidebar} className="text-muted-foreground hover:bg-slate-100">
                        <Menu className="w-5 h-5" />
                    </Button>
                </div>
            )}

            {/* Search */}
            <div className="flex-1 flex max-w-md">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 h-10 bg-slate-50 border-transparent focus-visible:ring-primary/20 focus-visible:bg-white rounded-xl transition-all"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 ml-6">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:flex">
                    <Bell className="w-5 h-5" />
                </Button>

                {loading ? (
                    <Skeleton className="w-10 h-10 rounded-full" />
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger className="relative h-10 w-10 text-left flex items-center justify-center rounded-full hover:bg-transparent cursor-pointer outline-none ring-0">
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name} />
                                <AvatarFallback className="bg-brand-50 text-brand-700">
                                    {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'HR'}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                                    <p className="text-xs leading-none text-muted-foreground mt-1">
                                        {profile?.companies?.name || 'Company Name'}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive font-medium cursor-pointer">
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    )
}
