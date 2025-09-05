import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProductionLogging } from '@/hooks/useProductionLogging';
import { supabase } from '@/integrations/supabase/client';
import { Activity, AlertTriangle, CheckCircle, Clock, Database, Globe, Server, Users } from 'lucide-react';

interface SystemMetric {
  name: string;
  value: string;
  status: 'healthy' | 'warning' | 'error';
  lastUpdated: string;
}

interface ErrorLog {
  id: string;
  level: string;
  message: string;
  context?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { info, warn } = useProductionLogging();

  useEffect(() => {
    fetchSystemMetrics();
    fetchErrorLogs();
    
    // Set up real-time monitoring
    const interval = setInterval(fetchSystemMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemMetrics = async () => {
    try {
      info('Fetching system metrics', 'monitoring');
      
      // Mock metrics - in production, these would come from actual monitoring services
      const mockMetrics: SystemMetric[] = [
        {
          name: 'Database Connection',
          value: 'Connected',
          status: 'healthy',
          lastUpdated: new Date().toISOString()
        },
        {
          name: 'API Response Time',
          value: '120ms',
          status: 'healthy',
          lastUpdated: new Date().toISOString()
        },
        {
          name: 'Active Users',
          value: '47',
          status: 'healthy',
          lastUpdated: new Date().toISOString()
        },
        {
          name: 'Error Rate',
          value: '0.02%',
          status: 'healthy',
          lastUpdated: new Date().toISOString()
        },
        {
          name: 'Storage Usage',
          value: '68%',
          status: 'warning',
          lastUpdated: new Date().toISOString()
        }
      ];

      setMetrics(mockMetrics);
    } catch (error) {
      warn('Failed to fetch system metrics', 'monitoring', error);
    }
  };

  const fetchErrorLogs = async () => {
    try {
      // Fetch recent audit logs that represent errors
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .or('action.like.LOG_ERROR,action.like.LOG_WARN')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedLogs: ErrorLog[] = (data || []).map(log => ({
        id: log.id,
        level: log.action.includes('ERROR') ? 'error' : 'warn',
        message: (log.metadata as any)?.message || 'No message',
        context: (log.metadata as any)?.context,
        timestamp: log.created_at,
        metadata: log.metadata as Record<string, any>
      }));

      setErrorLogs(formattedLogs);
    } catch (error) {
      warn('Failed to fetch error logs', 'monitoring', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: SystemMetric['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: SystemMetric['status']) => {
    const variants = {
      healthy: 'default',
      warning: 'secondary',
      error: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 animate-pulse" />
            <span>Loading monitoring data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time monitoring and performance metrics
          </p>
        </div>
        <Button onClick={fetchSystemMetrics} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.name}
                  </CardTitle>
                  {getStatusIcon(metric.status)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="flex items-center justify-between mt-2">
                    {getStatusBadge(metric.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(metric.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="h-4 w-4 mr-2" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Database</span>
                  <Badge variant="default">Online</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Edge Functions</span>
                  <Badge variant="default">Online</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Storage</span>
                  <Badge variant="default">Online</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Auth Service</span>
                  <Badge variant="default">Online</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  User Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Active Sessions</span>
                  <span className="font-medium">47</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Page Views (24h)</span>
                  <span className="font-medium">1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>API Calls (1h)</span>
                  <span className="font-medium">834</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg. Response Time</span>
                  <span className="font-medium">120ms</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Core Web Vitals Score</span>
                    <span className="font-medium text-green-600">92/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>First Contentful Paint</span>
                    <span className="font-medium">1.2s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Largest Contentful Paint</span>
                    <span className="font-medium">2.1s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cumulative Layout Shift</span>
                    <span className="font-medium">0.05</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>
                  Current resource consumption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Database Storage</span>
                    <span className="font-medium">342 MB / 500 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File Storage</span>
                    <span className="font-medium">1.2 GB / 2 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bandwidth (24h)</span>
                    <span className="font-medium">12.4 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Function Invocations</span>
                    <span className="font-medium">2,847</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Error Logs</CardTitle>
              <CardDescription>
                Latest errors and warnings from the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No recent errors found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {errorLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                      <div className="flex-shrink-0">
                        {log.level === 'error' ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{log.message}</p>
                        {log.context && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Context: {log.context}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={log.level === 'error' ? 'destructive' : 'secondary'}>
                        {log.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Traffic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Unique Visitors</span>
                    <span className="font-medium">324</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Page Views</span>
                    <span className="font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bounce Rate</span>
                    <span className="font-medium">32%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Records</span>
                    <span className="font-medium">15,642</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Queries/min</span>
                    <span className="font-medium">47</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Query Time</span>
                    <span className="font-medium">12ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Active Orders</span>
                    <span className="font-medium">23</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Revenue</span>
                    <span className="font-medium">RM 4,567</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion Rate</span>
                    <span className="font-medium">3.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}