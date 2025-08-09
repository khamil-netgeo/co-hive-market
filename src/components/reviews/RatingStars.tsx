
import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value?: number;
  onChange?: (val: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  className?: string;
};

const sizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export default function RatingStars({ value = 0, onChange, size = "md", readOnly, className }: Props) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= value;
        return (
          <button
            key={i}
            type="button"
            aria-label={`Set rating ${i}`}
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(i)}
            className={cn(
              "transition-transform",
              !readOnly && "active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            )}
          >
            <Star
              className={cn(
                sizes[size],
                active ? "fill-primary text-primary" : "text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
