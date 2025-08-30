import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  Calendar,
  CreditCard,
  UserCheck,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WorkflowSettings {
  id?: string;
  vendor_id: string;
  auto_approve_bookings: boolean;
  require_payment_upfront: boolean;
  require_deposit: boolean;
  deposit_percentage: number;
  allow_cancellation: boolean;
  cancellation_window_hours: number;
  require_customer_info: string[];
  booking_lead_time_hours: number;
  max_advance_booking_days: number;
  buffer_time_minutes: number;
}

interface ServiceBookingWorkflowProps {
  vendorId: string;
}

export default function ServiceBookingWorkflow({ vendorId }: ServiceBookingWorkflowProps) {
  const [settings, setSettings] = useState<WorkflowSettings>({
    vendor_id: vendorId,
    auto_approve_bookings: false,
    require_payment_upfront: false,
    require_deposit: true,
    deposit_percentage: 50,
    allow_cancellation: true,
    cancellation_window_hours: 24,
    require_customer_info: ['phone', 'email'],
    booking_lead_time_hours: 2,
    max_advance_booking_days: 30,
    buffer_time_minutes: 15
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  const customerInfoOptions = [
    { value: 'phone', label: 'Phone Number' },
    { value: 'email', label: 'Email Address' },
    { value: 'address', label: 'Home Address' },
    { value: 'emergency_contact', label: 'Emergency Contact' },
    { value: 'special_requests', label: 'Special Requests' }
  ];

  useEffect(() => {
    loadSettings();
    loadRecentBookings();
  }, [vendorId]);

  const loadSettings = async () => {
    try {
      // Mock loading - in real implementation would load from database
      setTimeout(() => setLoading(false), 500);
    } catch (error: any) {
      console.error('Error loading workflow settings:', error);
      toast.error('Failed to load workflow settings');
    }
  };

  const loadRecentBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          *,
          vendor_services(name),
          profiles!service_bookings_buyer_user_id_fkey(display_name)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentBookings(data || []);
    } catch (error: any) {
      console.error('Error loading recent bookings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Mock save - in real implementation would save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Workflow settings saved');
    } catch (error: any) {
      console.error('Error saving workflow settings:', error);
      toast.error('Failed to save workflow settings');
    } finally {
      setSaving(false);
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
      <Tabs defaultValue="workflow" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workflow">Booking Workflow</TabsTrigger>
          <TabsTrigger value="recent">Recent Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-6">
          {/* Booking Approval */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Booking Approval
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-approve Bookings</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve bookings without manual review
                  </p>
                </div>
                <Switch
                  checked={settings.auto_approve_bookings}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, auto_approve_bookings: checked }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Lead Time (hours)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.booking_lead_time_hours}
                    onChange={(e) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        booking_lead_time_hours: parseInt(e.target.value) || 0 
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Advance Booking (days)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.max_advance_booking_days}
                    onChange={(e) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        max_advance_booking_days: parseInt(e.target.value) || 30 
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Buffer Time Between Bookings (minutes)</Label>
                <Input
                  type="number"
                  min="0"
                  max="120"
                  value={settings.buffer_time_minutes}
                  onChange={(e) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      buffer_time_minutes: parseInt(e.target.value) || 0 
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Payment Upfront</Label>
                  <p className="text-sm text-muted-foreground">
                    Require full payment when booking
                  </p>
                </div>
                <Switch
                  checked={settings.require_payment_upfront}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, require_payment_upfront: checked }))
                  }
                />
              </div>

              {!settings.require_payment_upfront && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Deposit</Label>
                      <p className="text-sm text-muted-foreground">
                        Require a deposit to secure the booking
                      </p>
                    </div>
                    <Switch
                      checked={settings.require_deposit}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, require_deposit: checked }))
                      }
                    />
                  </div>

                  {settings.require_deposit && (
                    <div className="space-y-2">
                      <Label>Deposit Percentage</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={settings.deposit_percentage}
                        onChange={(e) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            deposit_percentage: parseInt(e.target.value) || 50 
                          }))
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Cancellation Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Cancellation Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Cancellations</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to cancel their bookings
                  </p>
                </div>
                <Switch
                  checked={settings.allow_cancellation}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, allow_cancellation: checked }))
                  }
                />
              </div>

              {settings.allow_cancellation && (
                <div className="space-y-2">
                  <Label>Cancellation Window (hours before appointment)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.cancellation_window_hours}
                    onChange={(e) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        cancellation_window_hours: parseInt(e.target.value) || 24 
                      }))
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Required Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {customerInfoOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={option.value}
                      checked={settings.require_customer_info.includes(option.value)}
                      onChange={(e) => {
                        const newInfo = e.target.checked
                          ? [...settings.require_customer_info, option.value]
                          : settings.require_customer_info.filter(info => info !== option.value);
                        setSettings(prev => ({ ...prev, require_customer_info: newInfo }));
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={option.value}>{option.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Workflow Settings'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <p className="text-muted-foreground">No recent bookings</p>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {booking.profiles?.display_name || 'Unknown Customer'}
                          </span>
                          <Badge variant="outline">
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.vendor_services?.name || 'Service'} - {' '}
                          {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString() : 'No time set'}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        Booked: {new Date(booking.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}