import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Zap, Calendar, MessageSquare, BarChart3, Settings } from 'lucide-react';
import { setSEO } from '@/lib/seo';
import { useEffect } from 'react';
import BookingNotifications from '@/components/service/BookingNotifications';
import ServiceBookingWorkflow from '@/components/service/ServiceBookingWorkflow';
import { ServiceAnalytics } from '@/components/service/ServiceAnalytics';
import { supabase } from '@/integrations/supabase/client';

export default function ServiceAutomation() {
  const [user, setUser] = useState<any>(null);
  const [activeAutomations, setActiveAutomations] = useState([
    {
      id: '1',
      name: 'Booking Confirmation',
      type: 'notification',
      status: 'active',
      triggers: 142,
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: '24h Reminder',
      type: 'notification', 
      status: 'active',
      triggers: 89,
      lastRun: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: '3',
      name: 'Follow-up Survey',
      type: 'workflow',
      status: 'paused',
      triggers: 67,
      lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  ]);

  useEffect(() => {
    setSEO(
      "Service Automation | CoopMarket",
      "Automate your service business with smart workflows, notifications, and analytics."
    );
    
    // Load user
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    loadUser();
  }, []);

  // Mock vendor ID - in real app this would come from auth/route params
  const vendorId = user?.id || 'mock-vendor-id';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'notification': return <MessageSquare className="h-4 w-4" />;
      case 'workflow': return <Zap className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Automation</h1>
          <p className="text-muted-foreground mt-2">
            Streamline your service business with automated workflows and smart notifications
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          {activeAutomations.filter(a => a.status === 'active').length} Active
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Automation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Automations</p>
                    <p className="text-2xl font-bold">
                      {activeAutomations.filter(a => a.status === 'active').length}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Triggers</p>
                    <p className="text-2xl font-bold">
                      {activeAutomations.reduce((sum, a) => sum + a.triggers, 0)}
                    </p>
                  </div>
                  <Bot className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">298</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">94.2%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Automations */}
          <Card>
            <CardHeader>
              <CardTitle>Active Automations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeAutomations.map((automation) => (
                  <div key={automation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        {getTypeIcon(automation.type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{automation.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {automation.triggers} triggers • Last run {automation.lastRun.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(automation.status)}>
                        {automation.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Booking Reminders
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  Auto-scheduling
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Performance Reports
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Bot className="h-6 w-6 mb-2" />
                  AI Assistant
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Zap className="h-6 w-6 mb-2" />
                  Follow-up Workflows
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Settings className="h-6 w-6 mb-2" />
                  Custom Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow">
          <ServiceBookingWorkflow vendorId={vendorId} />
        </TabsContent>

        <TabsContent value="notifications">
          <BookingNotifications vendorId={vendorId} />
        </TabsContent>

        <TabsContent value="analytics">
          <ServiceAnalytics vendorId={vendorId} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automation Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">General Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Enable All Automations</p>
                        <p className="text-sm text-muted-foreground">Master switch for all automated processes</p>
                      </div>
                      <Button variant="outline">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Timezone Settings</p>
                        <p className="text-sm text-muted-foreground">Set your business timezone for automations</p>
                      </div>
                      <Button variant="outline">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Error Notifications</p>
                        <p className="text-sm text-muted-foreground">Get notified when automations fail</p>
                      </div>
                      <Button variant="outline">Configure</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Integration Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Calendar Integration</p>
                        <p className="text-sm text-muted-foreground">Connect with Google Calendar, Outlook</p>
                      </div>
                      <Button variant="outline">Setup</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Provider</p>
                        <p className="text-sm text-muted-foreground">Configure email service for notifications</p>
                      </div>
                      <Button variant="outline">Setup</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">SMS Provider</p>
                        <p className="text-sm text-muted-foreground">Setup SMS notifications</p>
                      </div>
                      <Button variant="outline">Setup</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Data & Privacy</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Data Retention</p>
                        <p className="text-sm text-muted-foreground">How long to keep automation logs</p>
                      </div>
                      <Button variant="outline">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Export Data</p>
                        <p className="text-sm text-muted-foreground">Download automation history and settings</p>
                      </div>
                      <Button variant="outline">Export</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}