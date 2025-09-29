import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-muted/50 shadow-soft", className)}
      {...props}
    />
  )
}

const SkeletonCard = () => (
  <div className="rounded-2lg border bg-card p-4 sm:p-6 shadow-soft">
    <div className="space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  </div>
)

const SkeletonButton = () => <Skeleton className="h-11 w-24 rounded-2lg" />

const SkeletonAvatar = () => <Skeleton className="h-10 w-10 rounded-full" />

const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        className={cn(
          "h-3", 
          i === lines - 1 ? "w-3/4" : "w-full"
        )} 
      />
    ))}
  </div>
)

export { Skeleton, SkeletonCard, SkeletonButton, SkeletonAvatar, SkeletonText }
