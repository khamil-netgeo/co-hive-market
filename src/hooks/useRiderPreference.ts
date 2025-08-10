import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type DeliveryPreference = 'auto' | 'prefer_rider' | 'prefer_easyparcel';

interface RiderPreferenceState {
  preference: DeliveryPreference;
  loading: boolean;
  setPreference: (pref: DeliveryPreference) => Promise<void>;
}

export function useRiderPreference(): RiderPreferenceState {
  const [preference, setPreferenceState] = useState<DeliveryPreference>('auto');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreference();
  }, []);

  const loadPreference = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('delivery_preference')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.delivery_preference) {
        setPreferenceState(profile.delivery_preference as DeliveryPreference);
      }
    } catch (error) {
      console.error('Failed to load delivery preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const setPreference = async (pref: DeliveryPreference) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ delivery_preference: pref })
        .eq('id', user.id);

      if (error) throw error;
      
      setPreferenceState(pref);
    } catch (error) {
      console.error('Failed to save delivery preference:', error);
      throw error;
    }
  };

  return {
    preference,
    loading,
    setPreference,
  };
}

// Utility function to determine delivery method based on preference and availability
export function determineDeliveryMethod(
  preference: DeliveryPreference,
  productKind?: string,
  perishable?: boolean,
  allowEasyparcel?: boolean,
  allowRiderDelivery?: boolean,
  nearbyRiders?: boolean
): 'rider' | 'easyparcel' {
  // Force rider delivery for prepared food or perishable grocery
  if (productKind === 'prepared_food' || (productKind === 'grocery' && perishable)) {
    return 'rider';
  }

  // Respect product shipping restrictions
  if (allowEasyparcel === false) return 'rider';
  if (allowRiderDelivery === false) return 'easyparcel';

  // Apply user preference
  switch (preference) {
    case 'prefer_rider':
      return nearbyRiders ? 'rider' : 'easyparcel';
    case 'prefer_easyparcel':
      return 'easyparcel';
    case 'auto':
    default:
      // Auto logic: prefer rider for fresh items if available, else EasyParcel for reliability
      if ((productKind === 'grocery' || perishable) && nearbyRiders) {
        return 'rider';
      }
      return 'easyparcel';
  }
}