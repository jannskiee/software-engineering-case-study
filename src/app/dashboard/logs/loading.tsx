function SkeletonBlock({ className }: { className: string }) {
    return <div className={`animate-pulse rounded-md bg-gray-200/80 ${className}`} />
}

export default function LogsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3">
                    <SkeletonBlock className="h-8 w-64" />
                    <SkeletonBlock className="h-4 w-[30rem] max-w-full" />
                </div>
                <SkeletonBlock className="h-10 w-32" />
            </div>

            <div className="rounded-xl border bg-white shadow-sm">
                <div className="px-6 py-5 space-y-2 border-b">
                    <SkeletonBlock className="h-6 w-40" />
                    <SkeletonBlock className="h-4 w-[28rem] max-w-full" />
                </div>

                <div className="p-4 overflow-hidden">
                    <div className="border rounded-md">
                        <div className="grid grid-cols-6 gap-3 px-4 py-3 bg-gray-50 border-b">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <SkeletonBlock key={index} className="h-4 w-full" />
                            ))}
                        </div>
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="grid grid-cols-6 gap-3 px-4 py-4 border-b last:border-b-0">
                                <SkeletonBlock className="h-4 w-3/4" />
                                <SkeletonBlock className="h-4 w-full" />
                                <SkeletonBlock className="h-4 w-full" />
                                <SkeletonBlock className="h-4 w-4/5" />
                                <SkeletonBlock className="h-5 w-20" />
                                <SkeletonBlock className="h-4 w-5/6" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

