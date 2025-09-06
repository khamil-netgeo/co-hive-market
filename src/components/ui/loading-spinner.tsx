import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "muted" | "accent"
  text?: string
  fullScreen?: boolean
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = "md", variant = "default", text, fullScreen = false, ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12"
    }

    const variantClasses = {
      default: "text-primary",
      muted: "text-muted-foreground",
      accent: "text-accent-foreground"
    }

    const textSizeClasses = {
      sm: "text-sm",
      md: "text-base", 
      lg: "text-lg",
      xl: "text-xl"
    }

    const content = (
      <div className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullScreen ? "min-h-screen" : "py-8",
        className
      )} {...props} ref={ref}>
        <Loader2 
          className={cn(
            "animate-spin",
            sizeClasses[size],
            variantClasses[variant]
          )}
          aria-hidden="true"
        />
        {text && (
          <p className={cn(
            "text-center font-medium",
            textSizeClasses[size],
            variantClasses[variant]
          )}>
            {text}
          </p>
        )}
        <span className="sr-only">Loading content...</span>
      </div>
    )

    if (fullScreen) {
      return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          {content}
        </div>
      )
    }

    return content
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

export { LoadingSpinner }