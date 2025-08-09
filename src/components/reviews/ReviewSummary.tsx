
import React from "react";
import { Star } from "lucide-react";
import { useReviewSummary } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";

type Props = {
  targetType: "product" | "service";
  targetId: string;
  className?: string;
};

export default function ReviewSummary({ targetType, targetId, className }: Props) {
  const { data, isLoading } = useReviewSummary(targetType, targetId);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Star className="h-4 w-4 text-muted-foreground" />
        <span>Loading rating...</span>
      </div>
    );
  }

  const avg = data?.avg_rating ?? 0;
  const count = data?.review_count ?? 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 text-primary fill-primary" />
        <span className="font-medium text-foreground">{avg ? avg.toFixed(1) : "—"}</span>
      </div>
      <span className="text-sm text-muted-foreground">({count} review{count === 1 ? "" : "s"})</span>
    </div>
  );
}
