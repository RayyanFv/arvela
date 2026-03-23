'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SearchInput({ placeholder = 'Cari...', defaultValue = '', className, inputClassName }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    
    const [isPending, startTransition] = useTransition()
    const [value, setValue] = useState(defaultValue)

    // Sync with URL default value if it changes
    useEffect(() => {
        setValue(defaultValue)
    }, [defaultValue])

    // Debounce to update URL params
    useEffect(() => {
        // Skip first render if value is empty and no param exists
        if (value === defaultValue && value === '') return

        const timeout = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (value) {
                params.set('q', value)
            } else {
                params.delete('q')
            }
            startTransition(() => {
                router.replace(`${pathname}?params.toString() === '' ? '' : '?' + params.toString()}`)
                // Workaround to correctly form the URL
                const newQueryString = params.toString()
                router.replace(`${pathname}${newQueryString ? `?${newQueryString}` : ''}`, { scroll: false })
            })
        }, 400) // 400ms debounce

        return () => clearTimeout(timeout)
    }, [value, pathname, router, searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className={cn("relative group", className)}>
            {isPending ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
            ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            )}
            <input
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full",
                    inputClassName
                )}
            />
        </div>
    )
}
