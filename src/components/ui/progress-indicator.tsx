import * as React from "react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface ProgressIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  showLabel?: boolean
  label?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "warning" | "destructive"
}

const ProgressIndicator = React.forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  ({ className, value = 0, showLabel = true, label, size = "md", variant = "default", ...props }, ref) => {
    const progressLabel = label || `${Math.round(value)}% complete`
    
    const sizeClasses = {
      sm: "h-2",
      md: "h-3", 
      lg: "h-4"
    }

    const variantClasses = {
      default: "[&>div]:bg-primary",
      success: "[&>div]:bg-green-500",
      warning: "[&>div]:bg-yellow-500", 
      destructive: "[&>div]:bg-destructive"
    }

    return (
      <div ref={ref} className={cn("w-full space-y-2", className)} {...props}>
        {showLabel && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{progressLabel}</span>
            <span className="text-muted-foreground">{Math.round(value)}%</span>
          </div>
        )}
        <Progress 
          value={value} 
          className={cn(
            sizeClasses[size],
            variantClasses[variant]
          )}
          aria-label={progressLabel}
        />
      </div>
    )
  }
)
ProgressIndicator.displayName = "ProgressIndicator"

export { ProgressIndicator }