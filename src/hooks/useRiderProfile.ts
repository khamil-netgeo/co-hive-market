import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();

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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Rider profile created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleOnlineStatus = async () => {
    if (!profile) return;

    const newAvailability = !isOnline;
    
    try {
      await updateProfile({ is_available: newAvailability });
      setIsOnline(newAvailability);
      
      toast({
        title: newAvailability ? "Going Online" : "Going Offline",
        description: `You are now ${newAvailability ? 'available' : 'offline'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
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