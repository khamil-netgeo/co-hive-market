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

  // Fetch notification preferences
  const fetchChannels = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch from actual database table
      const { data: channels, error } = await supabase
        .from('notification_channels')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching channels:', error);
        // If no channels exist, create default ones
        const defaultChannels = [
          {
            user_id: user.id,
            channel_type: 'email',
            is_enabled: true,
            settings: {
              email_orders: true,
              email_payments: true,
              email_reviews: false,
              email_returns: true
            }
          },
          {
            user_id: user.id,
            channel_type: 'push',
            is_enabled: true,
            settings: {
              push_orders: true,
              push_payments: true
            }
          }
        ];

        const { error: insertError } = await supabase
          .from('notification_channels')
          .insert(defaultChannels);

        if (!insertError) {
          // Refetch after creating defaults
          const { data: newChannels } = await supabase
            .from('notification_channels')
            .select('*')
            .eq('user_id', user.id);

          setChannels(newChannels?.map(channel => ({
            id: channel.id,
            user_id: channel.user_id,
            type: channel.channel_type as any,
            address: user.email || '',
            verified: true,
            preferences: (channel.settings as unknown) as NotificationPreferences
          })) || []);
        }
      } else {
        setChannels(channels?.map(channel => ({
          id: channel.id,
          user_id: channel.user_id,
          type: channel.channel_type as any,
          address: user.email || '',
          verified: true,
          preferences: (channel.settings as unknown) as NotificationPreferences
        })) || []);
      }
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
      const { error } = await supabase
        .from('notification_channels')
        .update({ settings: preferences })
        .eq('id', channelId);

      if (error) throw error;

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notification_channels')
        .insert({
          user_id: user.id,
          channel_type: type,
          is_enabled: true,
          settings: {
            email_orders: true,
            email_payments: true,
            email_reviews: false,
            email_returns: true,
            sms_urgent: type === 'sms',
            push_orders: false,
            push_payments: false
          }
        })
        .select()
        .single();

      if (error) throw error;

      const newChannel: NotificationChannel = {
        id: data.id,
        user_id: data.user_id,
        type,
        address,
        verified: false,
        preferences: (data.settings as unknown) as NotificationPreferences
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
      const { error } = await supabase
        .from('notification_channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;
      
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