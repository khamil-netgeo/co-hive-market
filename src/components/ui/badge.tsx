import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-soft hover:shadow-elegant",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-soft hover:shadow-elegant",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-soft hover:shadow-elegant",
        outline: "text-foreground border-border hover:bg-accent hover:text-accent-foreground transition-all duration-300",
        brand: "border-transparent bg-gradient-primary text-primary-foreground shadow-brand hover:shadow-glow hover:scale-105",
        success: "border-transparent bg-brand-success text-primary-foreground hover:opacity-90 shadow-soft hover:shadow-elegant",
        warning: "border-transparent bg-brand-warning text-primary-foreground hover:opacity-90 shadow-soft hover:shadow-elegant",
        elegant: "border-brand-1/20 bg-gradient-elegant text-foreground backdrop-blur-sm hover:border-brand-1/40 hover:shadow-brand",
        neon: "border-brand-1 bg-background text-brand-1 shadow-neon hover:bg-brand-1 hover:text-primary-foreground hover:shadow-glow",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs rounded-md",
        lg: "px-3 py-1 text-sm rounded-lg",
        icon: "w-6 h-6 p-0 rounded-full"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
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
