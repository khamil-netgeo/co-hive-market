import React from "react";
import { Search, Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: "search" | "add" | "package" | React.ReactNode;
  className?: string;
}

/**
 * Reusable empty state component for when no data is available
 */
export function EmptyState({
  title,
  description,
  action,
  icon = "package",
  className = ""
}: EmptyStateProps) {
  const getIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }

    const iconMap = {
      search: Search,
      add: Plus,
      package: Package
    };

    const IconComponent = iconMap[icon as keyof typeof iconMap] || Package;
    return <IconComponent className="w-8 h-8 text-muted-foreground" />;
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center space-y-4 ${className}`}>
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
        {getIcon()}
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        {description && (
          <p className="text-muted-foreground max-w-md">{description}</p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}