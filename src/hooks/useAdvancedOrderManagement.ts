import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrderWorkflow } from "./useOrderWorkflow";

interface OrderModification {
  id: string;
  order_id: string;
  modification_type: 'quantity_change' | 'item_addition' | 'item_removal' | 'address_change' | 'delivery_time_change';
  original_data: any;
  new_data: any;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  created_at: string;
  applied_at?: string;
}

interface CancellationRequest {
  id: string;
  order_id: string;
  reason: string;
  refund_type: 'full' | 'partial' | 'none';
  refund_amount_cents?: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  created_at: string;
  processed_at?: string;
}

interface ScheduledOrder {
  id: string;
  buyer_user_id: string;
  scheduled_for: string;
  recurring_type?: 'daily' | 'weekly' | 'monthly';
  recurring_interval?: number;
  end_date?: string;
  cart_snapshot: any;
  delivery_preferences: any;
  status: 'scheduled' | 'paused' | 'canceled' | 'completed';
  next_execution_at?: string;
}

interface AdvancedOrderManagementHook {
  isLoading: boolean;
  
  // Order Modifications
  requestOrderModification: (orderId: string, modificationType: string, originalData: any, newData: any, reason: string) => Promise<boolean>;
  getOrderModifications: (orderId: string) => Promise<OrderModification[]>;
  approveOrderModification: (modificationId: string) => Promise<boolean>;
  applyOrderModification: (modificationId: string) => Promise<boolean>;
  
  // Order Cancellations
  requestOrderCancellation: (orderId: string, reason: string, refundType: string, refundAmount?: number) => Promise<boolean>;
  getOrderCancellations: (orderId: string) => Promise<CancellationRequest[]>;
  processOrderCancellation: (cancellationId: string, approved: boolean) => Promise<boolean>;
  
  // Order Scheduling
  scheduleOrder: (cartData: any, scheduledFor: string, deliveryPreferences: any, recurring?: { type: string; interval: number; endDate?: string }) => Promise<string | null>;
  getScheduledOrders: (userId?: string) => Promise<ScheduledOrder[]>;
  pauseScheduledOrder: (scheduledOrderId: string) => Promise<boolean>;
  resumeScheduledOrder: (scheduledOrderId: string) => Promise<boolean>;
  cancelScheduledOrder: (scheduledOrderId: string) => Promise<boolean>;
  
  // Analytics placeholder
  getOrderAnalytics: (vendorId?: string, dateRange?: { start: string; end: string }) => Promise<any>;
  getOrderPerformanceMetrics: (orderId?: string) => Promise<any>;
}

export function useAdvancedOrderManagement(): AdvancedOrderManagementHook {
  const [isLoading, setIsLoading] = useState(false);
  const { updateOrderStatus } = useOrderWorkflow();

  // Order Modification Functions
  const requestOrderModification = useCallback(async (
    orderId: string, 
    modificationType: string, 
    originalData: any, 
    newData: any, 
    reason: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Check if order can be modified (only certain statuses allow modifications)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        toast.error('Order not found');
        return false;
      }

      // Only allow modifications for orders that haven't been shipped
      const modifiableStatuses = ['pending', 'to_pay', 'paid', 'processing'];
      if (!modifiableStatuses.includes(order.status)) {
        toast.error('Order cannot be modified at this stage');
        return false;
      }

      // Use the helper function
      const { error } = await supabase.rpc('insert_order_modification', {
        p_order_id: orderId,
        p_modification_type: modificationType,
        p_original_data: originalData,
        p_new_data: newData,
        p_reason: reason
      });

      if (error) {
        console.error('Order modification request error:', error);
        toast.error('Failed to request order modification');
        return false;
      }

      toast.success('Order modification request submitted successfully');
      return true;
    } catch (error) {
      console.error('Request order modification failed:', error);
      toast.error('Failed to submit modification request');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOrderModifications = useCallback(async (orderId: string): Promise<OrderModification[]> => {
    try {
      const { data, error } = await supabase.rpc('get_order_modifications', {
        p_order_id: orderId
      });

      if (error) {
        console.error('Get order modifications error:', error);
        return [];
      }

      return (data as any[])?.map(item => ({
        id: item.id,
        order_id: item.order_id,
        modification_type: item.modification_type,
        original_data: item.original_data,
        new_data: item.new_data,
        reason: item.reason,
        status: item.status,
        created_at: item.created_at,
        applied_at: item.applied_at
      })) || [];
    } catch (error) {
      console.error('Get order modifications failed:', error);
      return [];
    }
  }, []);

  const approveOrderModification = useCallback(async (modificationId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // For now, just show success message since this would require admin panel
      toast.success('Modification approved (admin feature)');
      return true;
    } catch (error) {
      console.error('Approve order modification failed:', error);
      toast.error('Failed to approve modification');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyOrderModification = useCallback(async (modificationId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // For now, just show success message since this would require admin panel
      toast.success('Modification applied (admin feature)');
      return true;
    } catch (error) {
      console.error('Apply order modification failed:', error);
      toast.error('Failed to apply modification');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Order Cancellation Functions
  const requestOrderCancellation = useCallback(async (
    orderId: string, 
    reason: string, 
    refundType: string, 
    refundAmount?: number
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      const { error } = await supabase.rpc('insert_order_cancellation', {
        p_order_id: orderId,
        p_reason: reason,
        p_refund_type: refundType,
        p_refund_amount_cents: refundAmount || 0
      });

      if (error) {
        console.error('Order cancellation request error:', error);
        toast.error('Failed to request order cancellation');
        return false;
      }

      toast.success('Order cancellation request submitted successfully');
      return true;
    } catch (error) {
      console.error('Request order cancellation failed:', error);
      toast.error('Failed to submit cancellation request');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOrderCancellations = useCallback(async (orderId: string): Promise<CancellationRequest[]> => {
    try {
      const { data, error } = await supabase.rpc('get_order_cancellations', {
        p_order_id: orderId
      });

      if (error) {
        console.error('Get order cancellations error:', error);
        return [];
      }

      return (data as any[])?.map(item => ({
        id: item.id,
        order_id: item.order_id,
        reason: item.reason,
        refund_type: item.refund_type as 'full' | 'partial' | 'none',
        refund_amount_cents: item.refund_amount_cents,
        status: item.status as 'pending' | 'approved' | 'rejected' | 'processed',
        created_at: item.created_at,
        processed_at: item.processed_at
      })) || [];
    } catch (error) {
      console.error('Get order cancellations failed:', error);
      return [];
    }
  }, []);

  const processOrderCancellation = useCallback(async (cancellationId: string, approved: boolean): Promise<boolean> => {
    try {
      setIsLoading(true);
      // For now, just show success message since this would require admin panel
      toast.success(approved ? 'Cancellation approved (admin feature)' : 'Cancellation rejected (admin feature)');
      return true;
    } catch (error) {
      console.error('Process order cancellation failed:', error);
      toast.error('Failed to process cancellation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Order Scheduling Functions
  const scheduleOrder = useCallback(async (
    cartData: any, 
    scheduledFor: string, 
    deliveryPreferences: any,
    recurring?: { type: string; interval: number; endDate?: string }
  ): Promise<string | null> => {
    try {
      setIsLoading(true);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('User not authenticated');
        return null;
      }

      const { data, error } = await supabase.rpc('insert_scheduled_order', {
        p_buyer_user_id: user.user.id,
        p_scheduled_for: scheduledFor,
        p_cart_snapshot: cartData,
        p_delivery_preferences: deliveryPreferences,
        p_recurring_type: recurring?.type || null,
        p_recurring_interval: recurring?.interval || 1,
        p_end_date: recurring?.endDate || null
      });

      if (error) {
        console.error('Schedule order error:', error);
        toast.error('Failed to schedule order');
        return null;
      }

      toast.success('Order scheduled successfully');
      return data as string;
    } catch (error) {
      console.error('Schedule order failed:', error);
      toast.error('Failed to schedule order');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getScheduledOrders = useCallback(async (userId?: string): Promise<ScheduledOrder[]> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const targetUserId = userId || user.user?.id;

      if (!targetUserId) {
        return [];
      }

      const { data, error } = await supabase.rpc('get_scheduled_orders', {
        p_user_id: targetUserId
      });

      if (error) {
        console.error('Get scheduled orders error:', error);
        return [];
      }

      return (data as any[])?.map(item => ({
        id: item.id,
        buyer_user_id: item.buyer_user_id,
        scheduled_for: item.scheduled_for,
        recurring_type: item.recurring_type as 'daily' | 'weekly' | 'monthly' | undefined,
        recurring_interval: item.recurring_interval,
        end_date: item.end_date,
        cart_snapshot: item.cart_snapshot,
        delivery_preferences: item.delivery_preferences,
        status: item.status as 'scheduled' | 'paused' | 'canceled' | 'completed',
        next_execution_at: item.next_execution_at
      })) || [];
    } catch (error) {
      console.error('Get scheduled orders failed:', error);
      return [];
    }
  }, []);

  const pauseScheduledOrder = useCallback(async (scheduledOrderId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // For now, just show success message
      toast.success('Scheduled order paused (feature in development)');
      return true;
    } catch (error) {
      console.error('Pause scheduled order failed:', error);
      toast.error('Failed to pause scheduled order');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resumeScheduledOrder = useCallback(async (scheduledOrderId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // For now, just show success message
      toast.success('Scheduled order resumed (feature in development)');
      return true;
    } catch (error) {
      console.error('Resume scheduled order failed:', error);
      toast.error('Failed to resume scheduled order');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelScheduledOrder = useCallback(async (scheduledOrderId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // For now, just show success message
      toast.success('Scheduled order canceled (feature in development)');
      return true;
    } catch (error) {
      console.error('Cancel scheduled order failed:', error);
      toast.error('Failed to cancel scheduled order');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Analytics Functions (placeholder)
  const getOrderAnalytics = useCallback(async (vendorId?: string, dateRange?: { start: string; end: string }) => {
    try {
      // Placeholder for analytics
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        ordersByStatus: {}
      };
    } catch (error) {
      console.error('Get order analytics failed:', error);
      return null;
    }
  }, []);

  const getOrderPerformanceMetrics = useCallback(async (orderId?: string) => {
    try {
      // Placeholder for performance metrics
      return {
        processingTime: 0,
        deliveryTime: 0,
        customerSatisfaction: 0
      };
    } catch (error) {
      console.error('Get order performance metrics failed:', error);
      return null;
    }
  }, []);

  return {
    isLoading,
    requestOrderModification,
    getOrderModifications,
    approveOrderModification,
    applyOrderModification,
    requestOrderCancellation,
    getOrderCancellations,
    processOrderCancellation,
    scheduleOrder,
    getScheduledOrders,
    pauseScheduledOrder,
    resumeScheduledOrder,
    cancelScheduledOrder,
    getOrderAnalytics,
    getOrderPerformanceMetrics,
  };
}