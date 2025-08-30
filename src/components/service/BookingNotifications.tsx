import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, Mail, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationSettings {
  id?: string;
  vendor_id: string;
  booking_confirmation: boolean;
  reminder_24h: boolean;
  reminder_1h: boolean;
  follow_up_enabled: boolean;
  follow_up_delay_hours: number;
  email_templates: {
    confirmation: string;
    reminder: string;
    follow_up: string;
  };
  sms_enabled: boolean;
  email_enabled: boolean;
}

interface BookingNotificationsProps {
  vendorId: string;
}

export default function BookingNotifications({ vendorId }: BookingNotificationsProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    vendor_id: vendorId,
    booking_confirmation: true,
    reminder_24h: true,
    reminder_1h: true,
    follow_up_enabled: true,
    follow_up_delay_hours: 24,
    email_templates: {
      confirmation: "Thank you for booking! Your appointment is confirmed for {date} at {time}.",
      reminder: "Reminder: You have an appointment tomorrow at {time} for {service}.",
      follow_up: "How was your experience? We'd love to hear your feedback!"
    },
    sms_enabled: false,
    email_enabled: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Mock loading - in real implementation would load from database
    setTimeout(() => setLoading(false), 500);
  }, [vendorId]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Mock save - in real implementation would save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Notification settings saved');
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async (type: string) => {
    try {
      toast.success(`Test ${type} notification sent`);
    } catch (error: any) {
      toast.error(`Failed to send test ${type} notification`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Channel Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Channels</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-enabled">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send notifications via email</p>
              </div>
              <Switch
                id="email-enabled"
                checked={settings.email_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, email_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-enabled">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
              </div>
              <Switch
                id="sms-enabled"
                checked={settings.sms_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, sms_enabled: checked }))
                }
              />
            </div>
          </div>

          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Types</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Booking Confirmation</Label>
                  <p className="text-sm text-muted-foreground">Send confirmation when booking is made</p>
                </div>
                <Switch
                  checked={settings.booking_confirmation}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, booking_confirmation: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>24-Hour Reminder</Label>
                  <p className="text-sm text-muted-foreground">Send reminder 24 hours before appointment</p>
                </div>
                <Switch
                  checked={settings.reminder_24h}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, reminder_24h: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>1-Hour Reminder</Label>
                  <p className="text-sm text-muted-foreground">Send reminder 1 hour before appointment</p>
                </div>
                <Switch
                  checked={settings.reminder_1h}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, reminder_1h: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Follow-up Message</Label>
                  <p className="text-sm text-muted-foreground">Send follow-up after service completion</p>
                </div>
                <Switch
                  checked={settings.follow_up_enabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, follow_up_enabled: checked }))
                  }
                />
              </div>

              {settings.follow_up_enabled && (
                <div className="ml-4 space-y-2">
                  <Label>Follow-up Delay (hours)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.follow_up_delay_hours}
                    onChange={(e) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        follow_up_delay_hours: parseInt(e.target.value) || 24 
                      }))
                    }
                    className="w-32"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Confirmation Email</Label>
            <Textarea
              value={settings.email_templates.confirmation}
              onChange={(e) => 
                setSettings(prev => ({
                  ...prev,
                  email_templates: {
                    ...prev.email_templates,
                    confirmation: e.target.value
                  }
                }))
              }
              placeholder="Confirmation message template..."
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Use {'{date}'}, {'{time}'}, {'{service}'}, {'{customer}'} as placeholders
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => testNotification('confirmation')}
            >
              Test Confirmation
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Reminder Email</Label>
            <Textarea
              value={settings.email_templates.reminder}
              onChange={(e) => 
                setSettings(prev => ({
                  ...prev,
                  email_templates: {
                    ...prev.email_templates,
                    reminder: e.target.value
                  }
                }))
              }
              placeholder="Reminder message template..."
              rows={3}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => testNotification('reminder')}
            >
              Test Reminder
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Follow-up Email</Label>
            <Textarea
              value={settings.email_templates.follow_up}
              onChange={(e) => 
                setSettings(prev => ({
                  ...prev,
                  email_templates: {
                    ...prev.email_templates,
                    follow_up: e.target.value
                  }
                }))
              }
              placeholder="Follow-up message template..."
              rows={3}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => testNotification('follow-up')}
            >
              Test Follow-up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}