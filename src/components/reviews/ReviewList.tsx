
import React, { useState } from "react";
import { useApprovedReviews } from "@/hooks/useReviews";
import ReviewCard from "./ReviewCard";
import ReviewFilters from "./ReviewFilters";

type SortOption = 'newest' | 'oldest' | 'helpful' | 'rating_high' | 'rating_low';
type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1';

type Props = {
  targetType: "product" | "service";
  targetId: string;
};

export default function ReviewList({ targetType, targetId }: Props) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  
  const { data: allReviews = [], isLoading } = useApprovedReviews(targetType, targetId, sortBy);

  // Filter reviews by rating
  const filteredReviews = ratingFilter === 'all' 
    ? allReviews 
    : allReviews.filter(review => review.rating === parseInt(ratingFilter));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!allReviews || allReviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ReviewFilters
        sortBy={sortBy}
        onSortChange={setSortBy}
        ratingFilter={ratingFilter}
        onRatingFilterChange={setRatingFilter}
        totalReviews={filteredReviews.length}
      />
      
      {filteredReviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No reviews found with the selected rating.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              targetType={targetType}
              targetId={targetId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
