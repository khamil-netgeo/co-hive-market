import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserId } from "@/hooks/useReviews";
import { ORDER_STATUS } from "@/lib/orderStatus";

type TargetType = "product" | "service";

/**
 * Simplified review eligibility checker
 * Determines if user can submit a review based on purchase/booking history
 */
export function useReviewEligibility(targetType: TargetType, targetId: string) {
  const userId = useCurrentUserId();

  const { data: eligibility, isLoading } = useQuery({
    queryKey: ["review-eligibility", targetType, targetId, userId],
    enabled: !!userId && !!targetId,
    queryFn: async () => {
      if (!userId) return { eligible: false, reason: "not_logged_in" };

      if (targetType === "product") {
        // Check if user has purchased this product
        const { data: purchases, error } = await supabase
          .from("order_items")
          .select(`
            id,
            orders!inner(
              id,
              status,
              buyer_user_id
            )
          `)
          .eq("product_id", targetId)
          .eq("orders.buyer_user_id", userId)
          .in("orders.status", [ORDER_STATUS.PAID, ORDER_STATUS.FULFILLED]);

        if (error) throw error;

        if (!purchases || purchases.length === 0) {
          return { eligible: false, reason: "not_purchased" };
        }

        return { eligible: true, reason: "purchased" };
      } else if (targetType === "service") {
        // Check if user has booked this service
        const { data: bookings, error } = await supabase
          .from("service_bookings")
          .select("id, status")
          .eq("service_id", targetId)
          .eq("buyer_user_id", userId)
          .in("status", ["paid", "completed"]);

        if (error) throw error;

        if (!bookings || bookings.length === 0) {
          return { eligible: false, reason: "not_booked" };
        }

        return { eligible: true, reason: "booked" };
      }

      return { eligible: false, reason: "invalid_target_type" };
    },
  });

  const eligibilityMessage = useMemo(() => {
    if (!eligibility) return "";
    
    switch (eligibility.reason) {
      case "not_logged_in":
        return "Please sign in to submit a review";
      case "not_purchased":
        return "You need to purchase this product to review it";
      case "not_booked":
        return "You need to book this service to review it";
      case "purchased":
        return "You can review this product";
      case "booked":
        return "You can review this service";
      default:
        return "";
    }
  }, [eligibility]);

  return {
    eligible: eligibility?.eligible || false,
    reason: eligibility?.reason,
    message: eligibilityMessage,
    isLoading,
  };
}