import React from "react";
import { cn } from "@/lib/utils";
import { H2, H3 } from "@/components/ui/typography";

interface SectionLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  spacing?: "default" | "large" | "compact";
  titleLevel?: 2 | 3;
}

const SectionLayout = React.forwardRef<HTMLElement, SectionLayoutProps>(
  ({ 
    children, 
    title, 
    description, 
    actions, 
    className, 
    spacing = "default",
    titleLevel = 2
  }, ref) => {
    const spacingClasses = {
      default: "space-y-6",
      large: "space-y-8 md:space-y-12",
      compact: "space-y-4"
    };

    const TitleComponent = titleLevel === 2 ? H2 : H3;

    return (
      <section 
        ref={ref}
        className={cn(spacingClasses[spacing], className)}
      >
        {(title || description || actions) && (
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              {title && (
                <TitleComponent className="text-xl md:text-2xl">{title}</TitleComponent>
              )}
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
        )}
        <div className="space-y-6">
          {children}
        </div>
      </section>
    );
  }
);

SectionLayout.displayName = "SectionLayout";

export default SectionLayout;