import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RiderLocationSnapshot {
  id: string;
  rider_user_id: string;
  order_id?: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed_kmh?: number;
  accuracy_meters?: number;
  created_at: string;
  metadata: Record<string, any>;
}

export interface DeliveryETA {
  id: string;
  order_id: string;
  delivery_id?: string;
  rider_user_id: string;
  estimated_pickup_at?: string;
  estimated_delivery_at?: string;
  distance_to_pickup_km?: number;
  distance_to_delivery_km?: number;
  traffic_factor: number;
  created_at: string;
  updated_at: string;
}

export function useLiveRiderTracking(orderId: string | null) {
  const [riderLocation, setRiderLocation] = useState<RiderLocationSnapshot | null>(null);
  const [eta, setEta] = useState<DeliveryETA | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Fetch current rider location for order
  const fetchRiderLocation = useCallback(async () => {
    if (!orderId) return;

    try {
      // First get the delivery info to find the rider
      const { data: delivery } = await supabase
        .from('deliveries')
        .select('rider_user_id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (!delivery?.rider_user_id) return;

      // Get the latest location snapshot for this rider and order
      const { data: location, error } = await supabase
        .from('rider_location_snapshots')
        .select('*')
        .eq('rider_user_id', delivery.rider_user_id)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching rider location:', error);
        return;
      }

      if (location) {
        setRiderLocation({
          ...location,
          metadata: location.metadata as Record<string, any>
        });
      }
    } catch (error: any) {
      console.error('Error in fetchRiderLocation:', error);
    }
  }, [orderId]);

  // Fetch ETA information
  const fetchETA = useCallback(async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from('delivery_etas')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching ETA:', error);
        return;
      }

      setEta(data);
    } catch (error: any) {
      console.error('Error in fetchETA:', error);
    }
  }, [orderId]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Calculate ETA based on current location and destination
  const calculateETA = useCallback(async (
    currentLat: number,
    currentLng: number,
    destLat: number,
    destLng: number,
    avgSpeedKmh: number = 25 // Default average speed for urban delivery
  ): Promise<number> => {
    const distance = calculateDistance(currentLat, currentLng, destLat, destLng);
    const baseTimeMinutes = (distance / avgSpeedKmh) * 60;
    
    // Apply traffic factor (1.0 = no traffic, 1.5 = heavy traffic)
    const trafficFactor = eta?.traffic_factor || 1.2;
    return Math.round(baseTimeMinutes * trafficFactor);
  }, [calculateDistance, eta]);

  // Start tracking
  const startTracking = useCallback(() => {
    setIsTracking(true);
    fetchRiderLocation();
    fetchETA();
  }, [fetchRiderLocation, fetchETA]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    if (!orderId || !isTracking) return;

    const locationChannel = supabase
      .channel(`rider-location-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rider_location_snapshots',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const newLocation = {
            ...payload.new,
            metadata: payload.new.metadata as Record<string, any>
          } as RiderLocationSnapshot;
          setRiderLocation(newLocation);
        }
      )
      .subscribe();

    const etaChannel = supabase
      .channel(`delivery-eta-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_etas',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setEta(null);
          } else {
            const newEta = payload.new as DeliveryETA;
            setEta(newEta);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(locationChannel);
      supabase.removeChannel(etaChannel);
    };
  }, [orderId, isTracking]);

  // Auto-start tracking when order ID is available
  useEffect(() => {
    if (orderId) {
      startTracking();
    }
    return () => {
      stopTracking();
    };
  }, [orderId, startTracking, stopTracking]);

  return {
    riderLocation,
    eta,
    isTracking,
    startTracking,
    stopTracking,
    calculateETA,
    calculateDistance,
    refetch: () => {
      fetchRiderLocation();
      fetchETA();
    },
  };
}