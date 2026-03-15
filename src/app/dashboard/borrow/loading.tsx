function SkeletonBlock({ className }: { className: string }) {
    return <div className={`animate-pulse rounded-md bg-gray-200/80 ${className}`} />
}

export default function BorrowLoading() {
    return (
        <div className="w-full max-w-3xl mx-auto mt-4 space-y-6">
            <div className="space-y-3">
                <SkeletonBlock className="h-8 w-56" />
                <SkeletonBlock className="h-4 w-96 max-w-full" />
            </div>

            <div className="rounded-xl border bg-white shadow-md overflow-hidden">
                <div className="bg-gray-50 border-b px-4 sm:px-6 py-4 flex flex-wrap items-center gap-2 sm:justify-between">
                    <SkeletonBlock className="h-4 w-24" />
                    <SkeletonBlock className="h-4 w-20" />
                    <SkeletonBlock className="h-4 w-20" />
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                    <SkeletonBlock className="h-4 w-32" />
                    <SkeletonBlock className="h-10 w-full" />
                    <SkeletonBlock className="h-4 w-40 mt-2" />
                    <SkeletonBlock className="h-16 w-full" />
                    <SkeletonBlock className="h-16 w-full" />
                </div>

                <div className="bg-gray-50 border-t px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
                    <SkeletonBlock className="h-10 w-full sm:w-24" />
                    <SkeletonBlock className="h-10 w-full sm:w-36" />
                </div>
            </div>
        </div>
    )
}

