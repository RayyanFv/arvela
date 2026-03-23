'use client'

import { useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FilterTabs({ tabs, currentTab, paramName = 'stage' }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const handleTabClick = (tabKey) => {
        if (tabKey === currentTab) return
        
        const params = new URLSearchParams(searchParams.toString())
        if (tabKey === 'all') {
            params.delete(paramName)
        } else {
            params.set(paramName, tabKey)
        }

        startTransition(() => {
            const newQueryString = params.toString()
            router.push(`${pathname}${newQueryString ? `?${newQueryString}` : ''}`, { scroll: false })
        })
    }

    return (
        <div className="flex gap-1 bg-secondary rounded-xl p-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => {
                const isActive = currentTab === tab.key
                return (
                    <button
                        key={tab.key}
                        onClick={() => handleTabClick(tab.key)}
                        disabled={isPending}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center whitespace-nowrap",
                            isActive
                                ? 'bg-white text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                            isPending ? 'opacity-70 cursor-wait' : ''
                        )}
                    >
                        {tab.label}
                        {isActive && isPending && <Loader2 className="w-3 h-3 ml-2 animate-spin" />}
                    </button>
                )
            })}
        </div>
    )
}
