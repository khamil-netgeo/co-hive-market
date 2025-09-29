import React from "react";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "full" | "narrow";
  background?: "default" | "gradient" | "muted";
}

const PageLayout = React.forwardRef<HTMLElement, PageLayoutProps>(
  ({ children, className, variant = "default", background = "default" }, ref) => {
    const containerClasses = {
      default: "container mx-auto px-4 py-6 md:py-8",
      full: "w-full px-4 py-6 md:py-8",
      narrow: "container max-w-4xl mx-auto px-4 py-6 md:py-8"
    };

    const backgroundClasses = {
      default: "",
      gradient: "min-h-screen bg-gradient-to-br from-background via-background to-muted/20",
      muted: "min-h-screen bg-muted/30"
    };

    return (
      <main 
        ref={ref}
        className={cn(
          backgroundClasses[background],
          className
        )}
      >
        <div className={containerClasses[variant]}>
          {children}
        </div>
        <link rel="canonical" href={window.location.href} />
      </main>
    );
  }
);

PageLayout.displayName = "PageLayout";

export default PageLayout;