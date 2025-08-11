import * as React from "react"
import { cn } from "@/lib/utils"

interface MobileResponsiveWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * A wrapper component that ensures mobile responsiveness for any content.
 * Automatically applies overflow protection and mobile-safe styling.
 */
const MobileResponsiveWrapper = React.forwardRef<
  HTMLDivElement,
  MobileResponsiveWrapperProps
>(({ className, children, fallback, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full min-w-0 overflow-hidden",
      className
    )}
    {...props}
  >
    <div className="w-full min-w-0">
      {children}
    </div>
    {fallback && (
      <div className="sm:hidden mt-2 text-xs text-muted-foreground">
        {fallback}
      </div>
    )}
  </div>
))
MobileResponsiveWrapper.displayName = "MobileResponsiveWrapper"

export { MobileResponsiveWrapper }