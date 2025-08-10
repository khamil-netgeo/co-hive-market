import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-glow hover:scale-105",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-elegant hover:shadow-glow hover:scale-105",
        outline: "border-2 border-border bg-background hover:bg-accent hover:text-accent-foreground hover:border-brand-1 hover:shadow-glow transition-all duration-300",
        secondary: "bg-gradient-secondary text-secondary-foreground shadow-elegant hover:shadow-glow hover:scale-105",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-xl",
        link: "text-brand-1 underline-offset-4 hover:underline hover:text-brand-2 transition-colors",
        hero: "bg-gradient-rainbow text-primary-foreground shadow-neon hover:shadow-glow hover:scale-110 font-bold",
        tiktok: "bg-brand-1 text-primary-foreground hover:bg-brand-2 shadow-neon hover:shadow-glow hover:scale-105 font-bold",
        success: "bg-brand-success text-primary-foreground hover:opacity-90 shadow-elegant hover:shadow-glow hover:scale-105",
        warning: "bg-brand-warning text-primary-foreground hover:opacity-90 shadow-elegant hover:shadow-glow hover:scale-105",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-12 rounded-2xl px-8 text-base font-bold",
        icon: "h-11 w-11 rounded-2xl",
        xl: "h-14 rounded-2xl px-10 text-lg font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
