'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Bell, Clock, CalendarClock, LogOut as ResignIcon, ClipboardList } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getPendingApprovals } from '@/lib/actions/notifications'
import { formatDistanceToNow } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

const TYPE_ICON = {
    overtime: Clock,
    attendance: CalendarClock,
    leave: CalendarClock,
    leave_request: CalendarClock,
    resignation: ResignIcon,
    offboarding: ResignIcon,
}

export function NotificationBell() {
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const res = await getPendingApprovals({ limit: 8 })
            setItems(res.items)
            setTotalCount(res.totalCount)
        } catch (e) {
            // Non-admin roles don't have access — fail silently, bell stays hidden.
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
        const interval = setInterval(load, 60_000)
        return () => clearInterval(interval)
    }, [load])

    if (!loading && totalCount === 0 && items.length === 0) {
        // Still show the bell with zero state rather than hiding it entirely —
        // but if the action failed (non-admin), keep it hidden.
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger className="relative h-8 w-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors outline-none cursor-pointer">
                <Bell className="w-5 h-5" />
                {totalCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {totalCount > 9 ? '9+' : totalCount}
                    </span>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 rounded-md p-0" align="end">
                <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">Persetujuan Tertunda</p>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">{totalCount} pengajuan menunggu tindakan Anda</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="py-10 text-center">
                            <ClipboardList className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs font-medium text-slate-400">Tidak ada pengajuan tertunda</p>
                        </div>
                    ) : (
                        items.map(item => {
                            const Icon = TYPE_ICON[item.type] || ClipboardList
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
                                >
                                    <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-slate-900 truncate">{item.label}</p>
                                        <p className="text-xs text-slate-500 truncate">{item.employeeName}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: localeID })}
                                        </p>
                                    </div>
                                </Link>
                            )
                        })
                    )}
                </div>
                {items.length > 0 && (
                    <Link
                        href="/dashboard/attendance/requests"
                        onClick={() => setOpen(false)}
                        className="block text-center text-xs font-semibold text-primary py-3 border-t border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                        Lihat Semua
                    </Link>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
