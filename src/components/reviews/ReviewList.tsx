
import React from "react";
import { useApprovedReviews } from "@/hooks/useReviews";
import { Card } from "@/components/ui/card";
import RatingStars from "./RatingStars";

type Props = {
  targetType: "product" | "service";
  targetId: string;
};

export default function ReviewList({ targetType, targetId }: Props) {
  const { data, isLoading } = useApprovedReviews(targetType, targetId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading reviews...</p>;
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <RatingStars value={r.rating} readOnly size="sm" />
            <span className="text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString()}
            </span>
          </div>
          {r.title && <h4 className="mt-2 font-medium text-foreground">{r.title}</h4>}
          {r.body && <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{r.body}</p>}
        </Card>
      ))}
    </div>
  );
}
