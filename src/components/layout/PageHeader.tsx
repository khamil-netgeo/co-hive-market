import React from "react";
import { cn } from "@/lib/utils";
import { H1 } from "@/components/ui/typography";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  size?: "default" | "large" | "compact";
}

const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  ({ title, description, actions, className, size = "default" }, ref) => {
    const spacingClasses = {
      default: "mb-6 md:mb-8",
      large: "mb-8 md:mb-12",
      compact: "mb-4 md:mb-6"
    };

    return (
      <header 
        ref={ref}
        className={cn(spacingClasses[size], className)}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <H1 className="text-2xl md:text-3xl lg:text-4xl">{title}</H1>
            {description && (
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full md:w-auto">
              {actions}
            </div>
          )}
        </div>
      </header>
    );
  }
);

PageHeader.displayName = "PageHeader";

export default PageHeader;