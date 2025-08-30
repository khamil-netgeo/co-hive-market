import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Star, Calendar, ThumbsUp } from "lucide-react";

type SortOption = 'newest' | 'oldest' | 'helpful' | 'rating_high' | 'rating_low';
type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1';

type Props = {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  ratingFilter: RatingFilter;
  onRatingFilterChange: (rating: RatingFilter) => void;
  totalReviews: number;
  className?: string;
};

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'newest', label: 'Newest First', icon: <Calendar className="h-4 w-4" /> },
  { value: 'oldest', label: 'Oldest First', icon: <Calendar className="h-4 w-4" /> },
  { value: 'helpful', label: 'Most Helpful', icon: <ThumbsUp className="h-4 w-4" /> },
  { value: 'rating_high', label: 'Highest Rating', icon: <Star className="h-4 w-4" /> },
  { value: 'rating_low', label: 'Lowest Rating', icon: <Star className="h-4 w-4" /> },
];

const ratingOptions: { value: RatingFilter; label: string }[] = [
  { value: 'all', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '2', label: '2 Stars' },
  { value: '1', label: '1 Star' },
];

export default function ReviewFilters({
  sortBy,
  onSortChange,
  ratingFilter,
  onRatingFilterChange,
  totalReviews,
  className
}: Props) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {totalReviews} review{totalReviews === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {/* Rating Filter */}
        <Select value={ratingFilter} onValueChange={(value: RatingFilter) => onRatingFilterChange(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ratingOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Filter */}
        <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}