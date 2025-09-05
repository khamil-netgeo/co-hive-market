import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ORDER_STATUS_GROUPS, getStatusDisplay } from "@/lib/orderStatus";

interface OrderNotification {
  id: string;
  orderId: string;
  status: string;
  previousStatus?: string;
  timestamp: string;
  message: string;
}

/**
 * Hook for managing order status notifications
 * Provides real-time notifications when order statuses change
 */
export function useOrderNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Generate notification message based on status change
  const generateNotificationMessage = useCallback((orderId: string, newStatus: string, previousStatus?: string) => {
    const orderRef = `Order ${orderId.slice(0, 8)}`;
    const newStatusDisplay = getStatusDisplay(newStatus);
    
    // Payment related statuses
    if ((ORDER_STATUS_GROUPS.TO_PAY as readonly string[]).includes(newStatus.toLowerCase())) {
      return `${orderRef}: Payment required - ${newStatusDisplay}`;
    }
    
    // Processing statuses
    if ((ORDER_STATUS_GROUPS.TO_SHIP as readonly string[]).includes(newStatus.toLowerCase())) {
      if (newStatus.toLowerCase() === 'paid') {
        return `${orderRef}: Payment confirmed! Your order is being processed`;
      }
      return `${orderRef}: ${newStatusDisplay} - Your order is being prepared`;
    }
    
    // Shipping statuses
    if ((ORDER_STATUS_GROUPS.TO_RECEIVE as readonly string[]).includes(newStatus.toLowerCase())) {
      if (newStatus.toLowerCase() === 'shipped') {
        return `${orderRef}: Your order has been shipped!`;
      }
      return `${orderRef}: ${newStatusDisplay} - Your order is on the way`;
    }
    
    // Completion statuses
    if ((ORDER_STATUS_GROUPS.COMPLETED as readonly string[]).includes(newStatus.toLowerCase())) {
      return `${orderRef}: Order completed - Thank you for your purchase!`;
    }
    
    // Return/cancellation statuses
    if ((ORDER_STATUS_GROUPS.RETURNS as readonly string[]).includes(newStatus.toLowerCase())) {
      return `${orderRef}: ${newStatusDisplay}`;
    }
    
    return `${orderRef}: Status updated to ${newStatusDisplay}`;
  }, []);

  // Show notification toast
  const showNotification = useCallback((notification: OrderNotification) => {
    const isImportant = 
      (ORDER_STATUS_GROUPS.COMPLETED as readonly string[]).includes(notification.status.toLowerCase()) ||
      notification.status.toLowerCase() === 'paid' ||
      notification.status.toLowerCase() === 'shipped';

    if (isImportant) {
      toast.success(notification.message, {
        duration: 5000,
        action: {
          label: "View Order",
          onClick: () => {
            window.location.href = `/orders/${notification.orderId}`;
          },
        },
      });
    } else {
      toast.info(notification.message, {
        duration: 3000,
      });
    }
  }, []);

  // Set up real-time order status monitoring
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`order-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `buyer_user_id=eq.${userId}`,
        },
        (payload) => {
          const newOrder = payload.new as any;
          const oldOrder = payload.old as any;
          
          // Only notify if status actually changed
          if (newOrder.status !== oldOrder.status) {
            const notification: OrderNotification = {
              id: `${newOrder.id}-${Date.now()}`,
              orderId: newOrder.id,
              status: newOrder.status,
              previousStatus: oldOrder.status,
              timestamp: new Date().toISOString(),
              message: generateNotificationMessage(newOrder.id, newOrder.status, oldOrder.status),
            };

            setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
            showNotification(notification);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [userId, generateNotificationMessage, showNotification]);

  // Set up delivery status monitoring
  useEffect(() => {
    if (!userId) return;

    const deliveryChannel = supabase
      .channel(`delivery-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
        },
        async (payload) => {
          const delivery = payload.new as any;
          
          // Check if this delivery belongs to the user's order
          const { data: order } = await supabase
            .from('orders')
            .select('id, buyer_user_id')
            .eq('id', delivery.order_id)
            .eq('buyer_user_id', userId)
            .maybeSingle();

          if (order) {
            let message = '';
            switch (delivery.status?.toLowerCase()) {
              case 'assigned':
                message = `Rider assigned to your order ${order.id.slice(0, 8)}`;
                break;
              case 'picked_up':
                message = `Your order ${order.id.slice(0, 8)} has been picked up`;
                break;
              case 'out_for_delivery':
                message = `Your order ${order.id.slice(0, 8)} is out for delivery`;
                break;
              case 'delivered':
                message = `Your order ${order.id.slice(0, 8)} has been delivered!`;
                break;
              default:
                return; // Don't notify for other delivery statuses
            }

            const notification: OrderNotification = {
              id: `delivery-${delivery.id}-${Date.now()}`,
              orderId: order.id,
              status: `delivery_${delivery.status}`,
              timestamp: new Date().toISOString(),
              message,
            };

            setNotifications(prev => [notification, ...prev.slice(0, 49)]);
            
            if (delivery.status?.toLowerCase() === 'delivered') {
              toast.success(message, {
                duration: 5000,
                action: {
                  label: "View Order",
                  onClick: () => {
                    window.location.href = `/orders/${order.id}`;
                  },
                },
              });
            } else {
              toast.info(message);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deliveryChannel);
    };
  }, [userId]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  }, []);

  return {
    notifications,
    isConnected,
    clearNotifications,
    markAsRead,
  };
}