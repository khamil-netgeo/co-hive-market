import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationPreferences {
  email_orders: boolean;
  email_payments: boolean;
  email_reviews: boolean;
  email_returns: boolean;
  sms_urgent: boolean;
  push_orders: boolean;
  push_payments: boolean;
}

interface NotificationChannel {
  id: string;
  user_id: string;
  type: 'email' | 'sms' | 'push';
  address: string;
  verified: boolean;
  preferences: NotificationPreferences;
}

export function useAdvancedNotifications() {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notification preferences (mock data for now)
  const fetchChannels = useCallback(async () => {
    try {
      setIsLoading(true);
      // Mock notification channels until table is created
      const mockChannels: NotificationChannel[] = [
        {
          id: '1',
          user_id: 'current-user',
          type: 'email',
          address: 'vendor@example.com',
          verified: true,
          preferences: {
            email_orders: true,
            email_payments: true,
            email_reviews: false,
            email_returns: true,
            sms_urgent: false,
            push_orders: false,
            push_payments: false
          }
        }
      ];
      setChannels(mockChannels);
    } catch (error) {
      console.error('Failed to fetch notification channels:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update notification preferences
  const updatePreferences = useCallback(async (channelId: string, preferences: Partial<NotificationPreferences>) => {
    try {
      // Mock update for now
      setChannels(prev => prev.map(channel => 
        channel.id === channelId 
          ? { ...channel, preferences: { ...channel.preferences, ...preferences } }
          : channel
      ));
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update notification preferences');
    }
  }, []);

  // Send email notification
  const sendEmailNotification = useCallback(async (
    to: string,
    subject: string,
    template: string,
    variables: Record<string, any>
  ) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'email',
          to,
          subject,
          template,
          variables
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }, []);

  // Send SMS notification
  const sendSMSNotification = useCallback(async (
    to: string,
    message: string
  ) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'sms',
          to,
          message
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      return false;
    }
  }, []);

  // Add notification channel
  const addChannel = useCallback(async (type: 'email' | 'sms', address: string) => {
    try {
      // Mock add for now
      const newChannel: NotificationChannel = {
        id: Date.now().toString(),
        user_id: 'current-user',
        type,
        address,
        verified: false,
        preferences: {
          email_orders: true,
          email_payments: true,
          email_reviews: false,
          email_returns: true,
          sms_urgent: type === 'sms',
          push_orders: false,
          push_payments: false
        }
      };
      setChannels(prev => [...prev, newChannel]);
      toast.success(`${type === 'email' ? 'Email' : 'SMS'} channel added`);
    } catch (error) {
      console.error('Failed to add channel:', error);
      toast.error('Failed to add notification channel');
    }
  }, []);

  // Remove notification channel
  const removeChannel = useCallback(async (channelId: string) => {
    try {
      // Mock remove for now
      setChannels(prev => prev.filter(channel => channel.id !== channelId));
      toast.success('Notification channel removed');
    } catch (error) {
      console.error('Failed to remove channel:', error);
      toast.error('Failed to remove notification channel');
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    channels,
    isLoading,
    updatePreferences,
    sendEmailNotification,
    sendSMSNotification,
    addChannel,
    removeChannel,
    refreshChannels: fetchChannels
  };
}