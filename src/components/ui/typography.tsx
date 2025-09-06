import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const headingVariants = cva(
  "font-heading tracking-tight text-balance",
  {
    variants: {
      level: {
        1: "text-4xl md:text-5xl font-bold leading-none",
        2: "text-3xl md:text-4xl font-bold leading-tight",
        3: "text-2xl md:text-3xl font-semibold leading-tight",
        4: "text-xl md:text-2xl font-semibold leading-tight",
        5: "text-lg md:text-xl font-semibold leading-tight",
        6: "text-base md:text-lg font-semibold leading-tight"
      }
    },
    defaultVariants: {
      level: 2
    }
  }
);

const textVariants = cva(
  "text-foreground",
  {
    variants: {
      variant: {
        default: "text-base leading-relaxed",
        large: "text-lg leading-relaxed",
        small: "text-sm leading-relaxed",
        muted: "text-sm text-muted-foreground leading-relaxed",
        lead: "text-xl text-muted-foreground leading-relaxed",
        subtle: "text-sm text-muted-foreground/80 leading-relaxed"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = 2, ...props }, ref) => {
    const Component = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    return React.createElement(
      Component,
      {
        ref,
        className: cn(headingVariants({ level }), className),
        ...props
      }
    );
  }
);
Heading.displayName = "Heading";

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(textVariants({ variant }), className)}
      {...props}
    />
  )
);
Text.displayName = "Text";

// Convenient heading components
const H1 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, 'level'>>(
  ({ className, ...props }, ref) => (
    <Heading ref={ref} level={1} className={cn("text-gradient-brand", className)} {...props} />
  )
);
H1.displayName = "H1";

const H2 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, 'level'>>(
  ({ className, ...props }, ref) => (
    <Heading ref={ref} level={2} className={className} {...props} />
  )
);
H2.displayName = "H2";

const H3 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, 'level'>>(
  ({ className, ...props }, ref) => (
    <Heading ref={ref} level={3} className={className} {...props} />
  )
);
H3.displayName = "H3";

const H4 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, 'level'>>(
  ({ className, ...props }, ref) => (
    <Heading ref={ref} level={4} className={className} {...props} />
  )
);
H4.displayName = "H4";

const Lead = React.forwardRef<HTMLParagraphElement, Omit<TextProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Text ref={ref} variant="lead" className={className} {...props} />
  )
);
Lead.displayName = "Lead";

const Muted = React.forwardRef<HTMLParagraphElement, Omit<TextProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Text ref={ref} variant="muted" className={className} {...props} />
  )
);
Muted.displayName = "Muted";

export { 
  Heading, 
  Text, 
  H1, 
  H2, 
  H3, 
  H4, 
  Lead, 
  Muted, 
  headingVariants, 
  textVariants 
};