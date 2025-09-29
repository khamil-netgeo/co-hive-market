import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[24px]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-elegant",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:shadow-soft",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90 hover:shadow-elegant",
        outline: "text-foreground border-border hover:bg-accent hover:text-accent-foreground hover:shadow-soft",
        brand: "border-transparent bg-brand-1 text-primary-foreground shadow-soft hover:bg-brand-2 hover:shadow-elegant",
        success: "border-transparent bg-brand-success text-primary-foreground shadow-soft hover:opacity-90 hover:shadow-elegant",
        warning: "border-transparent bg-brand-warning text-primary-foreground shadow-soft hover:opacity-90 hover:shadow-elegant",
        elegant: "border-transparent bg-gradient-subtle text-foreground shadow-soft hover:shadow-elegant hover:scale-105",
        neon: "border-brand-1 bg-transparent text-brand-1 shadow-neon hover:bg-brand-1 hover:text-primary-foreground hover:shadow-glow",
      },
      size: {
        default: "px-2.5 py-0.5",
        sm: "px-2 py-0.5 text-xs min-h-[20px]",
        lg: "px-3 py-1 text-sm min-h-[28px]",
        icon: "h-6 w-6 rounded-full p-0 flex items-center justify-center min-h-[24px] min-w-[24px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
