import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'

export default function GenericDashboardLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32 rounded-xl" />
            </div>

            {/* Filter / Stats row skeleton */}
            <div className="flex gap-3 mb-6">
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-xl" />
            </div>

            {/* List / Table Skeleton */}
            <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-card">
                <div className="p-4 border-b border-border/50 bg-muted/20">
                    <Skeleton className="h-4 w-1/4" />
                </div>
                <div className="divide-y divide-border/50">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                                <div className="space-y-2 flex-1 max-w-md">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <Skeleton className="h-8 w-20 rounded-lg" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}
