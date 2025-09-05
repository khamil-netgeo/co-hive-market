import { Badge } from "@/components/ui/badge";
import { getStatusDisplay, isOrderInGroup } from "@/lib/orderStatus";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

/**
 * Standardized order status badge component
 * Provides consistent status display across the application
 */
export function OrderStatusBadge({ status, className, size = "default" }: OrderStatusBadgeProps) {
  const getVariant = (status: string) => {
    if (isOrderInGroup(status, "COMPLETED")) {
      return "default"; // Green
    }
    if (isOrderInGroup(status, "RETURNS")) {
      return "destructive"; // Red
    }
    if (isOrderInGroup(status, "TO_PAY")) {
      return "destructive"; // Red for payment required
    }
    if (isOrderInGroup(status, "TO_SHIP")) {
      return "secondary"; // Blue for processing
    }
    if (isOrderInGroup(status, "TO_RECEIVE")) {
      return "outline"; // Yellow for shipping
    }
    return "secondary"; // Default
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case "sm":
        return "text-xs px-2 py-0.5";
      case "lg":
        return "text-sm px-3 py-1";
      default:
        return "";
    }
  };

  return (
    <Badge 
      variant={getVariant(status)}
      className={cn(getSizeClass(size), className)}
    >
      {getStatusDisplay(status)}
    </Badge>
  );
}