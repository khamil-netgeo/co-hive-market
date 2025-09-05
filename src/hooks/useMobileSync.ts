import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MobileSession {
  id: string;
  user_id: string;
  device_id: string;
  platform: 'ios' | 'android';
  app_version: string;
  last_sync: string;
  is_active: boolean;
  push_token?: string;
}

interface SyncData {
  cart_items: any[];
  favorites: any[];
  settings: any;
  last_location?: { lat: number; lng: number };
}

export function useMobileSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingChanges();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register mobile session (mock for now)
  const registerMobileSession = useCallback(async (
    deviceId: string,
    platform: 'ios' | 'android',
    appVersion: string,
    pushToken?: string
  ) => {
    try {
      // Mock session registration
      const session: MobileSession = {
        id: Date.now().toString(),
        user_id: 'current-user',
        device_id: deviceId,
        platform,
        app_version: appVersion,
        last_sync: new Date().toISOString(),
        is_active: true,
        push_token: pushToken
      };
      console.log('Mock mobile session registered:', session);
      return session;
    } catch (error) {
      console.error('Failed to register mobile session:', error);
      return null;
    }
  }, []);

  // Sync data to mobile
  const syncToMobile = useCallback(async (deviceId: string): Promise<SyncData | null> => {
    try {
      setSyncStatus('syncing');

      // Fetch cart items
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name,
            price_cents,
            status,
            images
          )
        `);

      if (cartError) throw cartError;

      // Fetch favorites
      const { data: favorites, error: favError } = await supabase
        .from('vendor_follows')
        .select(`
          vendor_id,
          vendors (
            id,
            display_name,
            logo_url
          )
        `);

      if (favError) throw favError;

      // Fetch user settings
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .single();

      if (profileError) throw profileError;

      const syncData: SyncData = {
        cart_items: cartItems || [],
        favorites: favorites || [],
        settings: profile || {}
      };

      // Mock update last sync time
      console.log('Mock sync time updated for device:', deviceId);

      setSyncStatus('synced');
      return syncData;
    } catch (error) {
      console.error('Failed to sync to mobile:', error);
      setSyncStatus('error');
      return null;
    }
  }, []);

  // Sync data from mobile
  const syncFromMobile = useCallback(async (deviceId: string, data: Partial<SyncData>) => {
    try {
      setSyncStatus('syncing');

      // Sync cart items
      if (data.cart_items) {
        // Clear existing cart
        await supabase
          .from('cart_items')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        // Insert new cart items
        if (data.cart_items.length > 0) {
          const { error } = await supabase
            .from('cart_items')
            .insert(data.cart_items);

          if (error) throw error;
        }
      }

      // Sync favorites
      if (data.favorites) {
        // This would need more complex logic to handle additions/removals
        // For now, just log that favorites sync is needed
        console.log('Favorites sync needed:', data.favorites);
      }

      // Sync settings
      if (data.settings) {
        const { error } = await supabase
          .from('profiles')
          .update(data.settings)
          .eq('id', (await supabase.auth.getUser()).data.user?.id);

        if (error) throw error;
      }

      // Update location if provided
      if (data.last_location) {
        const { error } = await supabase
          .from('rider_profiles')
          .update({
            current_lat: data.last_location.lat,
            current_lng: data.last_location.lng,
            last_location_update: new Date().toISOString()
          })
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        // Ignore error if user is not a rider
      }

      setSyncStatus('synced');
      return true;
    } catch (error) {
      console.error('Failed to sync from mobile:', error);
      setSyncStatus('error');
      return false;
    }
  }, []);

  // Store pending change for offline sync
  const addPendingChange = useCallback((change: any) => {
    setPendingChanges(prev => [...prev, {
      ...change,
      timestamp: Date.now()
    }]);
  }, []);

  // Sync pending changes when back online
  const syncPendingChanges = useCallback(async () => {
    if (pendingChanges.length === 0) return;

    try {
      setSyncStatus('syncing');

      for (const change of pendingChanges) {
        // Process each pending change based on type
        switch (change.type) {
          case 'cart_add':
            await supabase
              .from('cart_items')
              .upsert(change.data);
            break;
          case 'cart_remove':
            await supabase
              .from('cart_items')
              .delete()
              .eq('id', change.data.id);
            break;
          case 'profile_update':
            await supabase
              .from('profiles')
              .update(change.data)
              .eq('id', change.user_id);
            break;
          // Add more change types as needed
        }
      }

      setPendingChanges([]);
      setSyncStatus('synced');
      toast.success('Offline changes synced successfully');
    } catch (error) {
      console.error('Failed to sync pending changes:', error);
      setSyncStatus('error');
      toast.error('Failed to sync offline changes');
    }
  }, [pendingChanges]);

  // Send push notification
  const sendPushNotification = useCallback(async (
    userId: string,
    title: string,
    body: string,
    data?: any
  ) => {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: userId,
          title,
          body,
          data
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }, []);

  return {
    isOnline,
    syncStatus,
    pendingChanges: pendingChanges.length,
    registerMobileSession,
    syncToMobile,
    syncFromMobile,
    addPendingChange,
    syncPendingChanges,
    sendPushNotification
  };
}