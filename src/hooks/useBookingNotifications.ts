import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BookingNotification {
  id: string;
  type: 'new_booking' | 'booking_update' | 'booking_reminder';
  booking_id: string;
  message: string;
  created_at: string;
  read: boolean;
}

export const useBookingNotifications = (vendorId: string) => {
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!vendorId) return;

    // Load existing notifications
    loadNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel(`vendor-notifications-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_bookings',
          filter: `vendor_id=eq.${vendorId}`
        },
        (payload) => {
          const booking = payload.new as any;
          addNotification({
            id: `new-${booking.id}`,
            type: 'new_booking',
            booking_id: booking.id,
            message: `New booking received for service`,
            created_at: new Date().toISOString(),
            read: false
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_bookings',
          filter: `vendor_id=eq.${vendorId}`
        },
        (payload) => {
          const booking = payload.new as any;
          const oldBooking = payload.old as any;
          
          if (booking.status !== oldBooking.status) {
            addNotification({
              id: `update-${booking.id}-${Date.now()}`,
              type: 'booking_update',
              booking_id: booking.id,
              message: `Booking status changed to ${booking.status}`,
              created_at: new Date().toISOString(),
              read: false
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId]);

  const loadNotifications = () => {
    // For now, we'll use localStorage to persist notifications
    // In a real app, you'd want to store these in the database
    const stored = localStorage.getItem(`notifications-${vendorId}`);
    if (stored) {
      const notifications = JSON.parse(stored);
      setNotifications(notifications);
      setUnreadCount(notifications.filter((n: BookingNotification) => !n.read).length);
    }
  };

  const addNotification = (notification: BookingNotification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, 50); // Keep only last 50
      localStorage.setItem(`notifications-${vendorId}`, JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      localStorage.setItem(`notifications-${vendorId}`, JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem(`notifications-${vendorId}`, JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(`notifications-${vendorId}`);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
};