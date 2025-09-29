import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-glow hover:scale-105 active:scale-95",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-elegant hover:shadow-glow hover:scale-105 active:scale-95",
        outline: "border-2 border-border bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary hover:shadow-glow transition-all duration-300 active:scale-95",
        secondary: "bg-gradient-secondary text-secondary-foreground shadow-elegant hover:shadow-glow hover:scale-105 active:scale-95",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-2lg active:scale-95",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 transition-colors min-h-auto",
        hero: "bg-gradient-rainbow text-primary-foreground shadow-neon hover:shadow-glow hover:scale-110 active:scale-95 font-bold",
        tiktok: "bg-brand-1 text-primary-foreground hover:bg-brand-2 shadow-neon hover:shadow-glow hover:scale-105 active:scale-95 font-bold",
        success: "bg-brand-success text-primary-foreground hover:opacity-90 shadow-elegant hover:shadow-glow hover:scale-105 active:scale-95",
        warning: "bg-brand-warning text-primary-foreground hover:opacity-90 shadow-elegant hover:shadow-glow hover:scale-105 active:scale-95",
        loading: "bg-muted text-muted-foreground cursor-not-allowed shadow-soft",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-2lg px-4 text-xs min-h-[36px]",
        lg: "h-12 rounded-2lg px-8 text-base font-bold min-h-[48px]",
        icon: "h-11 w-11 rounded-2lg min-h-[44px] min-w-[44px]",
        xl: "h-14 rounded-2lg px-10 text-lg font-bold min-h-[56px]",
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
