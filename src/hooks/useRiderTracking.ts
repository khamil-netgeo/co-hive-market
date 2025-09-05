import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProductionLogging } from './useProductionLogging';

export interface RiderAssignmentMetrics {
  id: string;
  delivery_id: string;
  rider_user_id: string;
  created_at: string;
  expires_at: string;
  responded_at?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  response_time_ms?: number;
  viewed_at?: string;
  rider_location?: {
    lat: number;
    lng: number;
  };
}

export interface RiderPerformanceStats {
  total_assignments: number;
  accepted_count: number;
  declined_count: number;
  expired_count: number;
  avg_response_time_ms: number;
  acceptance_rate: number;
  current_streak: number;
}

export function useRiderTracking() {
  const [assignments, setAssignments] = useState<RiderAssignmentMetrics[]>([]);
  const [performance, setPerformance] = useState<RiderPerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { warn } = useProductionLogging();

  // Enhanced assignment acceptance with tracking
  const acceptAssignmentWithTracking = useCallback(async (assignmentId: string) => {
    try {
      // Get current location if available
      let riderLocation: { lat: number; lng: number } | undefined;
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: false
            });
          });
          riderLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (geoError) {
          warn('Could not get location for assignment tracking:', 'rider', geoError);
        }
      }

      // Track assignment viewing (implicit acceptance preparation)
      await supabase.functions.invoke('rider-track-assignment', {
        body: {
          assignment_id: assignmentId,
          action: 'viewed',
          location: riderLocation,
          timestamp: new Date().toISOString()
        }
      });

      // Accept the assignment
      const { data, error } = await supabase.functions.invoke('rider-claim-delivery', {
        body: { 
          assignment_id: assignmentId,
          location: riderLocation
        }
      });

      if (error) throw error;

      toast('Assignment accepted successfully', { 
        description: 'You can now start the delivery process' 
      });

      // Refresh tracking data
      fetchAssignments();
      fetchPerformance();

      return data;
    } catch (error: any) {
      console.error('Accept assignment error:', error);
      toast.error('Failed to accept assignment', { 
        description: error.message
      });
      throw error;
    }
  }, []);

  // Enhanced decline with tracking
  const declineAssignmentWithTracking = useCallback(async (assignmentId: string, reason?: string) => {
    try {
      // Track decline with reason
      await supabase.functions.invoke('rider-track-assignment', {
        body: {
          assignment_id: assignmentId,
          action: 'declined',
          reason: reason || 'No reason provided',
          timestamp: new Date().toISOString()
        }
      });

      const { error } = await supabase
        .from('delivery_assignments')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);

      if (error) throw error;

      toast('Assignment declined', {
        description: 'Looking for other available riders'
      });

      // Refresh tracking data
      fetchAssignments();
      fetchPerformance();
    } catch (error: any) {
      toast.error('Error declining assignment', {
        description: error.message
      });
    }
  }, []);

  // Fetch assignments with enhanced metrics
  const fetchAssignments = useCallback(async () => {
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
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Calculate response times
      const enhancedData = (data || []).map(assignment => ({
        ...assignment,
        response_time_ms: assignment.responded_at 
          ? new Date(assignment.responded_at).getTime() - new Date(assignment.created_at).getTime()
          : undefined
      }));

      setAssignments(enhancedData as any);
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
    }
  }, []);

  // Fetch performance statistics
  const fetchPerformance = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('rider-performance-stats', {
        body: { rider_user_id: user.id }
      });

      if (error) throw error;
      setPerformance(data);
    } catch (error: any) {
      console.error('Error fetching performance:', error);
    }
  }, []);

  // Set up real-time subscription for assignments
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('rider-assignment-tracking')
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
                body: 'You have a new delivery request nearby',
                icon: '/icons/pwa-192.png',
                badge: '/icons/pwa-192.png',
              });
            }
            
            toast('New delivery assignment', {
              description: 'Check your assignments to accept or decline'
            });
            
            fetchAssignments();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'delivery_assignments',
            filter: `rider_user_id=eq.${user.id}`,
          },
          () => {
            fetchAssignments();
            fetchPerformance();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, [fetchAssignments, fetchPerformance]);

  useEffect(() => {
    fetchAssignments();
    fetchPerformance();
    setLoading(false);
  }, [fetchAssignments, fetchPerformance]);

  return {
    assignments,
    performance,
    loading,
    acceptAssignmentWithTracking,
    declineAssignmentWithTracking,
    refetchData: () => {
      fetchAssignments();
      fetchPerformance();
    }
  };
}