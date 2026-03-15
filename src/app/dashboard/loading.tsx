function SkeletonBlock({ className }: { className: string }) {
    return <div className={`animate-pulse rounded-md bg-gray-200/80 ${className}`} />
}

export default function DashboardLoading() {
    return (
        <div className="w-full max-w-7xl mx-auto space-y-6">
            <div className="space-y-3">
                <SkeletonBlock className="h-8 w-56" />
                <SkeletonBlock className="h-4 w-80" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border bg-white p-4 space-y-3">
                    <SkeletonBlock className="h-5 w-40" />
                    <SkeletonBlock className="h-4 w-full" />
                    <SkeletonBlock className="h-4 w-5/6" />
                    <SkeletonBlock className="h-10 w-36" />
                </div>
                <div className="rounded-xl border bg-white p-4 space-y-3">
                    <SkeletonBlock className="h-5 w-44" />
                    <SkeletonBlock className="h-4 w-full" />
                    <SkeletonBlock className="h-4 w-3/4" />
                    <SkeletonBlock className="h-10 w-32" />
                </div>
            </div>

            <div className="rounded-xl border bg-white p-4 space-y-3">
                <SkeletonBlock className="h-6 w-52" />
                <SkeletonBlock className="h-12 w-full" />
                <SkeletonBlock className="h-12 w-full" />
                <SkeletonBlock className="h-12 w-full" />
            </div>
        </div>
    )
}

