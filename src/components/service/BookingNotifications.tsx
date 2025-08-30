import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BookingNotificationsProps {
  vendorId: string;
  onNewBooking?: (booking: any) => void;
  onBookingUpdate?: (booking: any) => void;
}

export const BookingNotifications = ({ 
  vendorId, 
  onNewBooking, 
  onBookingUpdate 
}: BookingNotificationsProps) => {
  useEffect(() => {
    if (!vendorId) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.error);
    }

    const channel = supabase
      .channel(`vendor-booking-notifications-${vendorId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'service_bookings',
          filter: `vendor_id=eq.${vendorId}`
        },
        async (payload) => {
          console.log('New booking notification:', payload);
          
          const booking = payload.new as any;
          
          // Show toast notification
          toast.success('New Service Booking!', {
            description: `Booking #${booking.id.slice(0, 8)} received`,
            action: {
              label: 'View',
              onClick: () => window.open('/vendor/bookings', '_blank')
            }
          });

          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('New Service Booking', {
                body: `You have received a new booking for ${booking.service_id}`,
                icon: '/icons/pwa-192.png',
                badge: '/icons/pwa-192.png',
                tag: `booking-${booking.id}`,
                requireInteraction: true
              });
            } catch (error) {
              console.error('Error showing notification:', error);
            }
          }

          // Call callback if provided
          onNewBooking?.(booking);
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
          console.log('Booking updated:', payload);
          
          const booking = payload.new as any;
          const oldBooking = payload.old as any;
          
          // Only notify if status changed
          if (booking.status !== oldBooking.status) {
            toast.info('Booking Status Updated', {
              description: `Booking #${booking.id.slice(0, 8)} is now ${booking.status}`
            });
          }

          // Call callback if provided
          onBookingUpdate?.(booking);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, onNewBooking, onBookingUpdate]);

  return null; // This is a notification-only component
};

export default BookingNotifications;