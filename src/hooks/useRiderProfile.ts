import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export interface RiderProfile {
  id: string;
  user_id: string;
  vehicle_type: 'bicycle' | 'motorcycle' | 'car' | 'scooter';
  license_number?: string;
  service_radius_km: number;
  current_lat?: number;
  current_lng?: number;
  last_location_update?: string;
  is_available: boolean;
  is_verified: boolean;
  rating: number;
  total_deliveries: number;
  created_at: string;
  updated_at: string;
}

export function useRiderProfile() {
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('rider_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile(data as any);
        setIsOnline(data.is_available);
      }
    } catch (error: any) {
      toast("Error loading profile", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: Partial<RiderProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('rider_profiles')
        .insert([{ ...profileData, user_id: user.id } as any])
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data as any);
      toast("Success", { description: "Rider profile created successfully" });
    } catch (error: any) {
      toast("Error creating profile", { description: error.message });
    }
  };

  const updateProfile = async (updates: Partial<RiderProfile>) => {
    try {
      if (!profile) return;

      const { data, error } = await supabase
        .from('rider_profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data as any);
      toast("Profile updated", { description: "Your rider profile has been updated successfully" });
    } catch (error: any) {
      toast("Error updating profile", { description: error.message });
    }
  };

  const toggleOnlineStatus = async () => {
    if (!profile) return;

    const newAvailability = !isOnline;
    
    try {
      await updateProfile({ is_available: newAvailability });
      setIsOnline(newAvailability);
      
      toast(
        newAvailability ? "Going Online" : "Going Offline", 
        { description: `You are now ${newAvailability ? 'available' : 'offline'}` }
      );
    } catch (error: any) {
      toast("Error updating status", { description: "Failed to update status" });
    }
  };

  const updateLocation = async (lat: number, lng: number) => {
    if (!profile) return;
    
    await updateProfile({
      current_lat: lat,
      current_lng: lng,
    });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    isOnline,
    createProfile,
    updateProfile,
    toggleOnlineStatus,
    updateLocation,
    refetch: fetchProfile,
  };
}