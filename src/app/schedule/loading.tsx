import { Skeleton } from "@/components/ui/skeleton"

export default function ScheduleLoading() {
  return (
    <div className="flex-1 space-y-5 py-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="flex">
          <Skeleton className="h-10 w-64 shrink-0" />
          <Skeleton className="h-10 flex-1" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex border-t border-border/40">
            <div className="w-64 shrink-0 p-3">
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="flex-1 p-3 relative">
              {i % 2 === 0 && (
                <Skeleton className="h-7 w-48 absolute top-1.5" style={{ left: `${10 + i * 8}%` }} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
