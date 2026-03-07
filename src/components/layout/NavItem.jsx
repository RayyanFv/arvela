import Link from 'next/link'
import { cn } from '@/lib/utils'

export function NavItem({ icon: Icon, label, href, isActive }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                    ? "bg-sidebar-active text-white"
                    : "text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-text"
            )}
        >
            <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary")} />
            <span className="flex-1">{label}</span>
            {isActive && <div className="w-1 h-4 rounded-full bg-primary" />}
        </Link>
    )
}
