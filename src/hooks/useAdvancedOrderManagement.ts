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
  
  // Advanced Analytics
  getOrderAnalytics: (vendorId?: string, dateRange?: { start: string; end: string }) => Promise<any>;
  getOrderPerformanceMetrics: (orderId?: string) => Promise<any>;
}

export function useAdvancedOrderManagement(): AdvancedOrderManagementHook {
  const [isLoading, setIsLoading] = useState(false);
  const { createOrder, updateOrderStatus } = useOrderWorkflow();

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

      // Use raw SQL insert since the table types aren't updated yet
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

      return data || [];
    } catch (error) {
      console.error('Get order modifications failed:', error);
      return [];
    }
  }, []);

  const approveOrderModification = useCallback(async (modificationId: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('order_modifications')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', modificationId);

      if (error) {
        toast.error('Failed to approve modification');
        return false;
      }

      toast.success('Order modification approved');
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

      // Get the modification details
      const { data: modification, error: modError } = await supabase
        .from('order_modifications')
        .select('*')
        .eq('id', modificationId)
        .single();

      if (modError || !modification) {
        toast.error('Modification not found');
        return false;
      }

      if (modification.status !== 'approved') {
        toast.error('Modification must be approved first');
        return false;
      }

      // Apply the modification based on type
      let updateData: any = {};
      
      switch (modification.modification_type) {
        case 'address_change':
          updateData.delivery_address = modification.new_data.delivery_address;
          break;
        case 'delivery_time_change':
          updateData.delivery_preferences = modification.new_data.delivery_preferences;
          break;
        // Add more modification types as needed
      }

      // Update the order
      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', modification.order_id);

      if (updateError) {
        toast.error('Failed to apply modification');
        return false;
      }

      // Mark modification as applied
      const { error: statusError } = await supabase
        .from('order_modifications')
        .update({ 
          status: 'applied',
          applied_at: new Date().toISOString()
        })
        .eq('id', modificationId);

      if (statusError) {
        console.warn('Failed to update modification status:', statusError);
      }

      toast.success('Order modification applied successfully');
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

      const { error } = await supabase
        .from('order_cancellations')
        .insert({
          order_id: orderId,
          reason: reason,
          refund_type: refundType,
          refund_amount_cents: refundAmount,
          status: 'pending'
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
      const { data, error } = await supabase
        .from('order_cancellations')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get order cancellations error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get order cancellations failed:', error);
      return [];
    }
  }, []);

  const processOrderCancellation = useCallback(async (cancellationId: string, approved: boolean): Promise<boolean> => {
    try {
      setIsLoading(true);

      const { data: cancellation, error: fetchError } = await supabase
        .from('order_cancellations')
        .select('*')
        .eq('id', cancellationId)
        .single();

      if (fetchError || !cancellation) {
        toast.error('Cancellation request not found');
        return false;
      }

      if (approved) {
        // Update order status to canceled
        await updateOrderStatus(cancellation.order_id, 'canceled', {
          cancellation_reason: cancellation.reason,
          refund_type: cancellation.refund_type
        });

        // Process refund if needed
        if (cancellation.refund_type !== 'none' && cancellation.refund_amount_cents) {
          const { error: refundError } = await supabase.functions.invoke('process-refund', {
            body: {
              order_id: cancellation.order_id,
              amount_cents: cancellation.refund_amount_cents,
              reason: cancellation.reason
            }
          });

          if (refundError) {
            console.error('Refund processing error:', refundError);
            toast.error('Order canceled but refund processing failed');
          }
        }
      }

      // Update cancellation status
      const { error } = await supabase
        .from('order_cancellations')
        .update({ 
          status: approved ? 'processed' : 'rejected',
          processed_at: new Date().toISOString()
        })
        .eq('id', cancellationId);

      if (error) {
        toast.error('Failed to process cancellation');
        return false;
      }

      toast.success(approved ? 'Order cancellation processed' : 'Order cancellation rejected');
      return true;
    } catch (error) {
      console.error('Process order cancellation failed:', error);
      toast.error('Failed to process cancellation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateOrderStatus]);

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

      const scheduledOrderData = {
        buyer_user_id: user.user.id,
        scheduled_for: scheduledFor,
        cart_snapshot: cartData,
        delivery_preferences: deliveryPreferences,
        status: 'scheduled',
        recurring_type: recurring?.type,
        recurring_interval: recurring?.interval,
        end_date: recurring?.endDate,
        next_execution_at: scheduledFor
      };

      const { data, error } = await supabase
        .from('scheduled_orders')
        .insert(scheduledOrderData)
        .select()
        .single();

      if (error) {
        console.error('Schedule order error:', error);
        toast.error('Failed to schedule order');
        return null;
      }

      toast.success('Order scheduled successfully');
      return data.id;
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

      const { data, error } = await supabase
        .from('scheduled_orders')
        .select('*')
        .eq('buyer_user_id', targetUserId)
        .order('next_execution_at', { ascending: true });

      if (error) {
        console.error('Get scheduled orders error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get scheduled orders failed:', error);
      return [];
    }
  }, []);

  const pauseScheduledOrder = useCallback(async (scheduledOrderId: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('scheduled_orders')
        .update({ status: 'paused' })
        .eq('id', scheduledOrderId);

      if (error) {
        toast.error('Failed to pause scheduled order');
        return false;
      }

      toast.success('Scheduled order paused');
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

      const { error } = await supabase
        .from('scheduled_orders')
        .update({ status: 'scheduled' })
        .eq('id', scheduledOrderId);

      if (error) {
        toast.error('Failed to resume scheduled order');
        return false;
      }

      toast.success('Scheduled order resumed');
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

      const { error } = await supabase
        .from('scheduled_orders')
        .update({ status: 'canceled' })
        .eq('id', scheduledOrderId);

      if (error) {
        toast.error('Failed to cancel scheduled order');
        return false;
      }

      toast.success('Scheduled order canceled');
      return true;
    } catch (error) {
      console.error('Cancel scheduled order failed:', error);
      toast.error('Failed to cancel scheduled order');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Analytics Functions
  const getOrderAnalytics = useCallback(async (vendorId?: string, dateRange?: { start: string; end: string }) => {
    try {
      const { data, error } = await supabase.rpc('get_order_analytics', {
        p_vendor_id: vendorId,
        p_start_date: dateRange?.start,
        p_end_date: dateRange?.end
      });

      if (error) {
        console.error('Get order analytics error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get order analytics failed:', error);
      return null;
    }
  }, []);

  const getOrderPerformanceMetrics = useCallback(async (orderId?: string) => {
    try {
      const { data, error } = await supabase.rpc('get_order_performance_metrics', {
        p_order_id: orderId
      });

      if (error) {
        console.error('Get order performance metrics error:', error);
        return null;
      }

      return data;
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