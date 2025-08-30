import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value?: number;
  onChange?: (val: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  className?: string;
  required?: boolean;
};

const sizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export default function DetailedRatingInput({ 
  label, 
  value = 0, 
  onChange, 
  size = "md", 
  readOnly, 
  className,
  required = false
}: Props) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center gap-2", className)}>
      <label className="text-sm font-medium text-foreground min-w-0 sm:w-24 flex-shrink-0">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => {
          const active = i <= value;
          return (
            <button
              key={i}
              type="button"
              aria-label={`Set ${label} rating ${i}`}
              disabled={readOnly}
              onClick={() => !readOnly && onChange?.(i)}
              className={cn(
                "transition-all",
                !readOnly && "active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm hover:scale-110"
              )}
            >
              <Star
                className={cn(
                  sizes[size],
                  active ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary/70"
                )}
              />
            </button>
          );
        })}
        {value > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {value}/5
          </span>
        )}
      </div>
    </div>
  );
}