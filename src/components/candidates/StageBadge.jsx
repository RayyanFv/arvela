import { STAGE_CONFIG } from '@/lib/constants/stages'

export function StageBadge({ stage, size = 'sm' }) {
    const cfg = STAGE_CONFIG[stage]
    if (!cfg) return null

    return (
        <span className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${cfg.className} ${size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-3 py-1'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotColor}`} />
            {cfg.label}
        </span>
    )
}
