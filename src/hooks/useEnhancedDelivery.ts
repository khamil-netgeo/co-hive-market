import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeliveryAssignment {
  id: string;
  delivery_id: string;
  rider_user_id: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
}

interface DeliveryData {
  id: string;
  order_id: string;
  rider_user_id?: string;
  status: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
  pickup_address?: string;
  dropoff_address?: string;
  assigned_at?: string;
  notes?: string;
}

interface EnhancedDeliveryHook {
  isLoading: boolean;
  createDelivery: (orderId: string, deliveryDetails: Partial<DeliveryData>) => Promise<string | null>;
  assignRiders: (deliveryId: string, pickupLat: number, pickupLng: number) => Promise<boolean>;
  updateDeliveryStatus: (deliveryId: string, status: string, updates?: Partial<DeliveryData>) => Promise<boolean>;
  getDeliveryAssignments: (riderId: string) => Promise<DeliveryAssignment[]>;
  acceptDelivery: (assignmentId: string) => Promise<boolean>;
  addDeliveryProof: (deliveryId: string, proofData: any) => Promise<boolean>;
  getDeliveryTracking: (orderId: string) => Promise<any>;
}

/**
 * Hook for enhanced delivery management
 * Handles delivery creation, rider assignment, status tracking, and proof of delivery
 */
export function useEnhancedDelivery(): EnhancedDeliveryHook {
  const [isLoading, setIsLoading] = useState(false);

  // Create a new delivery record
  const createDelivery = useCallback(async (orderId: string, deliveryDetails: Partial<DeliveryData>): Promise<string | null> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('deliveries')
        .insert({
          order_id: orderId,
          status: 'pending',
          ...deliveryDetails,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Delivery creation error:', error);
        toast.error('Failed to create delivery');
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Create delivery failed:', error);
      toast.error('Delivery creation failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Assign nearby riders to a delivery
  const assignRiders = useCallback(async (deliveryId: string, pickupLat: number, pickupLng: number): Promise<boolean> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.rpc('assign_delivery_to_riders', {
        delivery_id_param: deliveryId,
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
      });

      if (error) {
        console.error('Rider assignment error:', error);
        toast.error('Failed to assign riders');
        return false;
      }

      if (data > 0) {
        toast.success(`Delivery assigned to ${data} nearby riders`);
        return true;
      } else {
        toast.warning('No available riders found in the area');
        return false;
      }
    } catch (error) {
      console.error('Assign riders failed:', error);
      toast.error('Rider assignment failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update delivery status and details
  const updateDeliveryStatus = useCallback(async (deliveryId: string, status: string, updates: Partial<DeliveryData> = {}): Promise<boolean> => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('deliveries')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...updates,
        })
        .eq('id', deliveryId);

      if (error) {
        console.error('Delivery status update error:', error);
        toast.error('Failed to update delivery status');
        return false;
      }

      toast.success('Delivery status updated successfully');
      return true;
    } catch (error) {
      console.error('Update delivery status failed:', error);
      toast.error('Delivery update failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get delivery assignments for a rider
  const getDeliveryAssignments = useCallback(async (riderId: string): Promise<DeliveryAssignment[]> => {
    try {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          deliveries (
            id,
            order_id,
            pickup_address,
            dropoff_address,
            notes,
            orders (
              total_amount_cents,
              currency
            )
          )
        `)
        .eq('rider_user_id', riderId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Delivery assignments fetch error:', error);
        return [];
      }

      return (data || []) as DeliveryAssignment[];
    } catch (error) {
      console.error('Get delivery assignments failed:', error);
      return [];
    }
  }, []);

  // Accept a delivery assignment
  const acceptDelivery = useCallback(async (assignmentId: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Update assignment status
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .update({ status: 'accepted' })
        .eq('id', assignmentId);

      if (assignmentError) {
        console.error('Assignment acceptance error:', assignmentError);
        toast.error('Failed to accept delivery');
        return false;
      }

      // Get assignment details to update delivery
      const { data: assignment, error: fetchError } = await supabase
        .from('delivery_assignments')
        .select('delivery_id, rider_user_id')
        .eq('id', assignmentId)
        .single();

      if (fetchError || !assignment) {
        console.error('Assignment fetch error:', fetchError);
        return false;
      }

      // Update delivery with assigned rider
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .update({
          rider_user_id: assignment.rider_user_id,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', assignment.delivery_id);

      if (deliveryError) {
        console.error('Delivery update error:', deliveryError);
        return false;
      }

      toast.success('Delivery accepted successfully!');
      return true;
    } catch (error) {
      console.error('Accept delivery failed:', error);
      toast.error('Delivery acceptance failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add proof of delivery (photos, signatures, etc.)
  const addDeliveryProof = useCallback(async (deliveryId: string, proofData: any): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Update delivery with proof data
      const { error } = await supabase
        .from('deliveries')
        .update({
          status: 'delivered',
          metadata: {
            proof_of_delivery: proofData,
            delivered_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliveryId);

      if (error) {
        console.error('Delivery proof update error:', error);
        toast.error('Failed to add delivery proof');
        return false;
      }

      toast.success('Delivery completed with proof!');
      return true;
    } catch (error) {
      console.error('Add delivery proof failed:', error);
      toast.error('Delivery proof upload failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get delivery tracking information
  const getDeliveryTracking = useCallback(async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          rider_profiles:rider_user_id (
            vehicle_type,
            rating,
            phone_number,
            profiles:user_id (
              display_name,
              avatar_url
            )
          ),
          delivery_assignments (
            status,
            created_at,
            expires_at
          )
        `)
        .eq('order_id', orderId)
        .maybeSingle();

      if (error) {
        console.error('Delivery tracking fetch error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get delivery tracking failed:', error);
      return null;
    }
  }, []);

  return {
    isLoading,
    createDelivery,
    assignRiders,
    updateDeliveryStatus,
    getDeliveryAssignments,
    acceptDelivery,
    addDeliveryProof,
    getDeliveryTracking,
  };
}