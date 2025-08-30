import React from "react";
import { Star, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useApprovedReviews } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";

type Props = {
  targetType: "product" | "service";
  targetId: string;
  className?: string;
};

export default function ReviewRatingDistribution({ targetType, targetId, className }: Props) {
  const { data: reviews = [], isLoading } = useApprovedReviews(targetType, targetId);

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rating Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm">{rating}</span>
                  <Star className="h-3 w-3 fill-muted-foreground text-muted-foreground" />
                </div>
                <div className="flex-1 h-2 bg-muted rounded animate-pulse" />
                <span className="text-xs text-muted-foreground w-8">-</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalReviews = reviews.length;
  const ratingCounts = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0;

  if (totalReviews === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rating Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No reviews yet. Be the first to review!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Rating Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Rating */}
        <div className="text-center pb-4 border-b">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="h-6 w-6 text-primary fill-primary" />
            <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Based on {totalReviews} review{totalReviews === 1 ? "" : "s"}
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingCounts[rating] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="h-3 w-3 fill-primary text-primary" />
                </div>
                <Progress value={percentage} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}