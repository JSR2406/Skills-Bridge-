import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton() {
  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Search / Filters Bar skeleton */}
      <div className="flex items-center gap-4 w-full pt-2">
        <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg hidden sm:block" />
        <Skeleton className="h-10 w-24 rounded-lg hidden sm:block" />
      </div>

      {/* Main Content skeleton (cards) */}
      <div className="flex flex-col gap-4 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col space-y-3 border border-border p-5 rounded-xl bg-surface-card w-full">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-2 w-full">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-1/6" />
              </div>
            </div>
            <Skeleton className="h-5 w-3/4 mt-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex items-center gap-4 mt-6">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
