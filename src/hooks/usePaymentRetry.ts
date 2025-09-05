import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RetryPaymentOptions {
  orderId: string;
  amount_cents: number;
  currency: string;
  success_path?: string;
  cancel_path?: string;
}

/**
 * Hook for handling payment retry scenarios
 * Allows users to retry failed payments with improved error handling
 */
export function usePaymentRetry() {
  const [isRetrying, setIsRetrying] = useState(false);

  const retryPayment = useCallback(async (options: RetryPaymentOptions) => {
    setIsRetrying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          name: `Retry payment for Order ${options.orderId.slice(0, 8)}`,
          amount_cents: options.amount_cents,
          currency: options.currency,
          success_path: options.success_path || "/payment-success",
          cancel_path: options.cancel_path || "/payment-canceled",
          retry_for_order_id: options.orderId,
        },
      });

      if (error) {
        throw new Error(error.message || "Payment retry failed");
      }

      const url = (data as any)?.url;
      if (url) {
        // Open payment in new tab
        window.open(url, "_blank");
        return { success: true, url };
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (error: any) {
      console.error("Payment retry error:", error);
      toast.error("Payment retry failed", {
        description: error.message || "Please try again or contact support",
      });
      return { success: false, error: error.message };
    } finally {
      setIsRetrying(false);
    }
  }, []);

  const checkPaymentStatus = useCallback(async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status, stripe_session_id')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return {
        status: data.status,
        stripe_session_id: data.stripe_session_id,
      };
    } catch (error: any) {
      console.error("Payment status check error:", error);
      return null;
    }
  }, []);

  return {
    retryPayment,
    checkPaymentStatus,
    isRetrying,
  };
}