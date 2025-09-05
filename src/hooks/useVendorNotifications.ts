import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VendorNotification {
  id: string;
  type: 'new_order' | 'order_update' | 'low_stock' | 'payment_received';
  title: string;
  message: string;
  order_id?: string;
  product_id?: string;
  metadata?: any;
  read: boolean;
  created_at: string;
}

interface VendorNotificationsHook {
  notifications: VendorNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing vendor notifications
 * Provides real-time notifications for new orders, payments, and inventory alerts
 */
export function useVendorNotifications(vendorId?: string): VendorNotificationsHook {
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate notifications from order events
  const generateOrderNotification = useCallback(async (order: any, type: string): Promise<VendorNotification | null> => {
    const orderRef = `Order #${order.id.slice(0, 8)}`;
    
    // Try to get customer name from profiles (simplified)
    let customerName = 'Customer';
    // Note: profiles table structure needs to be established
    // For now, use fallback customer name
    
    switch (type) {
      case 'new_order':
        return {
          id: `new_order_${order.id}_${Date.now()}`,
          type: 'new_order',
          title: 'New Order Received!',
          message: `${orderRef} from ${customerName} - ${order.total_amount_cents / 100} ${order.currency.toUpperCase()}`,
          order_id: order.id,
          metadata: { customer_name: customerName },
          read: false,
          created_at: new Date().toISOString(),
        };
      
      case 'payment_received':
        return {
          id: `payment_${order.id}_${Date.now()}`,
          type: 'payment_received',
          title: 'Payment Received',
          message: `Payment confirmed for ${orderRef} from ${customerName}`,
          order_id: order.id,
          metadata: { amount: order.total_amount_cents, customer_name: customerName },
          read: false,
          created_at: new Date().toISOString(),
        };

      default:
        return null;
    }
  }, []);

  // Load notifications (simulated for now, would be from a notifications table)
  const loadNotifications = useCallback(async () => {
    if (!vendorId) return;

    setIsLoading(true);
    try {
      // For now, generate notifications from recent orders
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, status, total_amount_cents, currency, buyer_user_id, created_at, updated_at')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Failed to load orders for notifications:', error);
        return;
      }

      const generatedNotifications: VendorNotification[] = [];
      
      for (const order of orders || []) {
        // New order notification (if recent)
        const orderAge = Date.now() - new Date(order.created_at).getTime();
        if (orderAge < 24 * 60 * 60 * 1000) { // Less than 24 hours old
          const newOrderNotif = await generateOrderNotification({
            ...order,
            buyer_user_id: order.buyer_user_id
          }, 'new_order');
          
          if (newOrderNotif) {
            generatedNotifications.push(newOrderNotif);
          }
        }

        // Payment notification if paid
        if (order.status === 'paid') {
          const paymentNotif = await generateOrderNotification({
            ...order,
            buyer_user_id: order.buyer_user_id
          }, 'payment_received');
          
          if (paymentNotif) {
            generatedNotifications.push(paymentNotif);
          }
        }
      }

      setNotifications(generatedNotifications);
    } catch (error) {
      console.error('Load notifications failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, generateOrderNotification]);

  // Set up real-time order monitoring for new orders
  useEffect(() => {
    if (!vendorId) return;

    const channel = supabase
      .channel(`vendor-notifications-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorId}`,
        },
        async (payload) => {
          const newOrder = payload.new as any;
          
          // Show toast notification
          toast.success('New Order Received!', {
            description: `Order #${newOrder.id.slice(0, 8)} - ${newOrder.total_amount_cents / 100} ${newOrder.currency.toUpperCase()}`,
            action: {
              label: "View Order",
              onClick: () => {
                window.location.href = `/vendor/orders/${newOrder.id}`;
              },
            },
          });

          // Add to notifications
          const notification = await generateOrderNotification({
            ...newOrder,
            buyer_user_id: newOrder.buyer_user_id
          }, 'new_order');

          if (notification) {
            setNotifications(prev => [notification, ...prev.slice(0, 49)]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorId}`,
        },
        async (payload) => {
          const updatedOrder = payload.new as any;
          const oldOrder = payload.old as any;

          // Check for payment confirmation
          if (oldOrder.status !== 'paid' && updatedOrder.status === 'paid') {
            toast.success('Payment Received!', {
              description: `Payment confirmed for Order #${updatedOrder.id.slice(0, 8)}`,
            });

            const notification = await generateOrderNotification({
              ...updatedOrder,
              buyer_user_id: updatedOrder.buyer_user_id
            }, 'payment_received');
            
            if (notification) {
              setNotifications(prev => [notification, ...prev.slice(0, 49)]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, generateOrderNotification]);

  // Load initial notifications
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  const refresh = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}