import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function DashboardSkeleton() {
    return (
        <div className="space-y-8 pb-24 animate-in fade-in duration-500">
            {/* Breadcrumb skeleton */}
            <Skeleton className="h-4 w-40" />

            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-8 w-72" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-10 w-40 rounded-xl" />
            </div>

            {/* Quick Actions skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="p-6 border-none shadow-sm rounded-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Skeleton className="w-10 h-10 rounded-xl" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                    </Card>
                ))}
            </div>

            {/* Charts skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <Card className="p-8 border-none shadow-sm rounded-3xl">
                    <Skeleton className="h-3 w-40 mb-4" />
                    <Skeleton className="h-10 w-20 mb-6" />
                    <Skeleton className="h-[120px] w-full" />
                </Card>
                <Card className="p-8 border-none shadow-sm rounded-3xl">
                    <Skeleton className="h-3 w-40 mb-6" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-28 h-28 rounded-full" />
                        <div className="flex-1 space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-4 w-full" />
                            ))}
                        </div>
                    </div>
                </Card>
                <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="p-6 border-none shadow-sm rounded-3xl">
                            <div className="flex items-center gap-3 mb-4">
                                <Skeleton className="w-10 h-10 rounded-xl" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                            <Skeleton className="h-12 w-full" />
                        </Card>
                    ))}
                </div>
            </div>

            {/* Pipeline skeleton */}
            <Card className="p-6 border-none shadow-sm rounded-2xl">
                <Skeleton className="h-5 w-48 mb-6" />
                <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-7 w-full" />
                    ))}
                </div>
            </Card>
        </div>
    )
}
