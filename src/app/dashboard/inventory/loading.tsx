function SkeletonBlock({ className }: { className: string }) {
    return <div className={`animate-pulse rounded-md bg-gray-200/80 ${className}`} />
}

export default function InventoryLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <SkeletonBlock className="h-8 w-72" />
                <SkeletonBlock className="h-4 w-[32rem] max-w-full" />
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <SkeletonBlock className="h-10 w-full max-w-sm" />
                <SkeletonBlock className="h-10 w-full sm:w-40" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="rounded-xl border bg-white overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center gap-3">
                            <SkeletonBlock className="h-4 w-36" />
                            <SkeletonBlock className="h-5 w-20" />
                        </div>
                        <div className="p-4 space-y-3">
                            <SkeletonBlock className="h-4 w-full" />
                            <SkeletonBlock className="h-4 w-5/6" />
                            <div className="flex items-center gap-4 pt-2 border-t">
                                <SkeletonBlock className="h-10 w-20" />
                                <SkeletonBlock className="h-10 w-24" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

