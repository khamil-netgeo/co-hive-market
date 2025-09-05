import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderTransition {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  transitioned_by: string | null;
  automated: boolean;
  metadata: any;
  created_at: string;
}

interface OrderWorkflowHook {
  isLoading: boolean;
  createOrder: (deliveryAddress?: any, notes?: string) => Promise<string | null>;
  updateOrderStatus: (orderId: string, newStatus: string, metadata?: any) => Promise<boolean>;
  getOrderTransitions: (orderId: string) => Promise<OrderTransition[]>;
  autoTransitionStatus: (orderId: string, triggerEvent: string) => Promise<boolean>;
}

/**
 * Hook for managing order workflow and status transitions
 * Handles order creation, status updates, and automated workflows
 */
export function useOrderWorkflow(): OrderWorkflowHook {
  const [isLoading, setIsLoading] = useState(false);

  // Create order from cart using edge function
  const createOrder = useCallback(async (deliveryAddress?: any, notes?: string): Promise<string | null> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          delivery_address: deliveryAddress,
          notes: notes,
        },
      });

      if (error) {
        console.error('Order creation error:', error);
        toast.error('Failed to create order', {
          description: error.message || 'Please try again',
        });
        return null;
      }

      if (data?.order_id) {
        toast.success('Order created successfully!', {
          description: `Order #${data.order_id.slice(0, 8)} has been created`,
        });
        return data.order_id;
      }

      return null;
    } catch (error) {
      console.error('Create order failed:', error);
      toast.error('Order creation failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update order status manually
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string, metadata?: any): Promise<boolean> => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus as any, // Cast to avoid type issues with extended status values
          transition_metadata: metadata || {},
          automated_transition: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        console.error('Order status update error:', error);
        toast.error('Failed to update order status');
        return false;
      }

      toast.success('Order status updated successfully');
      return true;
    } catch (error) {
      console.error('Update order status failed:', error);
      toast.error('Status update failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get order status transition history
  const getOrderTransitions = useCallback(async (orderId: string): Promise<OrderTransition[]> => {
    try {
      const { data, error } = await supabase
        .from('order_status_transitions')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Order transitions fetch error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get order transitions failed:', error);
      return [];
    }
  }, []);

  // Trigger automated status transition
  const autoTransitionStatus = useCallback(async (orderId: string, triggerEvent: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('auto_transition_order_status', {
        p_order_id: orderId,
        p_trigger_event: triggerEvent,
      });

      if (error) {
        console.error('Auto transition error:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Auto transition failed:', error);
      return false;
    }
  }, []);

  return {
    isLoading,
    createOrder,
    updateOrderStatus,
    getOrderTransitions,
    autoTransitionStatus,
  };
}