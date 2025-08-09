import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface DeliveryAssignment {
  id: string;
  delivery_id: string;
  rider_user_id: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  notified_at: string;
  responded_at?: string;
  // Delivery details (joined)
  delivery?: {
    id: string;
    order_id: string;
    pickup_address?: string;
    dropoff_address?: string;
    pickup_lat?: number;
    pickup_lng?: number;
    dropoff_lat?: number;
    dropoff_lng?: number;
    notes?: string;
    scheduled_pickup_at?: string;
    scheduled_dropoff_at?: string;
  };
}

export function useDeliveryAssignments() {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssignments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          delivery:deliveries(
            id,
            order_id,
            pickup_address,
            dropoff_address,
            pickup_lat,
            pickup_lng,
            dropoff_lat,
            dropoff_lng,
            notes,
            scheduled_pickup_at,
            scheduled_dropoff_at
          )
        `)
        .eq('rider_user_id', user.id)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAssignments((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch delivery assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_assignments')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);

      if (error) throw error;

      // Mark other pending assignments for the same delivery as expired
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment) {
        await supabase
          .from('delivery_assignments')
          .update({ status: 'expired' })
          .eq('delivery_id', assignment.delivery_id)
          .neq('id', assignmentId)
          .eq('status', 'pending');
      }

      toast({
        title: "Success",
        description: "Delivery accepted successfully",
      });

      fetchAssignments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const declineAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_assignments')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Assignment Declined",
        description: "You have declined this delivery",
      });

      fetchAssignments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Set up real-time subscription for new assignments
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('delivery-assignments')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'delivery_assignments',
            filter: `rider_user_id=eq.${user.id}`,
          },
          (payload) => {
            // Show notification for new assignment
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New Delivery Assignment', {
                body: 'You have a new delivery request',
                icon: '/icons/pwa-192.png',
                badge: '/icons/pwa-192.png',
              });
            }
            
            fetchAssignments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, []);

  return {
    assignments,
    loading,
    acceptAssignment,
    declineAssignment,
    refetch: fetchAssignments,
  };
}