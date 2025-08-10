import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Store, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  DollarSign,
  Activity,
  Globe,
  Flag,
  Settings,
  UserCog,
  Megaphone
} from "lucide-react";
import WatchAnalyticsCard from "./components/WatchAnalyticsCard";
interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeFeatureFlags: number;
  pendingReports: number;
  recentSignups: number;
}

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeFeatureFlags: 0,
    pendingReports: 0,
    recentSignups: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    setSEO("Super Admin Dashboard — CoopMarket", "Global platform controls and analytics for super admins.");
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load various statistics in parallel
      const [
        usersRes,
        vendorsRes,
        productsRes,
        ordersRes,
        flagsRes,
        reportsRes,
        activityRes
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("vendors").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total_amount_cents", { count: "exact" }),
        supabase.from("feature_flags").select("id", { count: "exact", head: true }).eq("enabled", true),
        supabase.from("content_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("audit_logs").select("id, action, created_at").order("created_at", { ascending: false }).limit(5)
      ]);

      // Calculate total revenue from orders
      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + (order.total_amount_cents || 0), 0) || 0;

      // Recent signups (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: recentSignups } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo);

      setStats({
        totalUsers: usersRes.count || 0,
        totalVendors: vendorsRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalRevenue,
        activeFeatureFlags: flagsRes.count || 0,
        pendingReports: reportsRes.count || 0,
        recentSignups: recentSignups || 0,
      });

      setRecentActivity(activityRes.data || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(cents / 100);
  };

  const quickActions = [
    { title: "User Management", description: "Manage user roles and permissions", href: "/superadmin/users", icon: UserCog },
    { title: "Global Settings", description: "Configure app-wide settings", href: "/superadmin/settings", icon: Settings },
    { title: "Feature Flags", description: "Toggle platform features", href: "/superadmin/feature-flags", icon: Flag },
    { title: "Announcements", description: "Create global announcements", href: "/superadmin/announcements", icon: Megaphone },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor platform health and manage global settings</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Global Control
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.recentSignups} new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVendors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Marketplace sellers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {stats.totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingReports} pending reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Platform Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Platform Statistics
            </CardTitle>
            <CardDescription>Current platform metrics and growth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Products Listed</span>
              <span className="font-medium">{stats.totalProducts}</span>
            </div>
            <Progress value={Math.min((stats.totalProducts / 1000) * 100, 100)} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Feature Flags Active</span>
              <span className="font-medium">{stats.activeFeatureFlags}</span>
            </div>
            <Progress value={Math.min((stats.activeFeatureFlags / 20) * 100, 100)} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Weekly Signups</span>
              <span className="font-medium">{stats.recentSignups}</span>
            </div>
            <Progress value={Math.min((stats.recentSignups / 50) * 100, 100)} className="h-2" />
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
            <CardDescription>Important notifications and warnings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.pendingReports > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Pending Reports</span>
                </div>
                <Badge variant="outline">{stats.pendingReports}</Badge>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm">Security Status</span>
              </div>
              <Badge variant="outline" className="text-green-600">Good</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm">System Updates</span>
              </div>
              <Badge variant="outline" className="text-blue-600">Current</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Watch Analytics */}
      <WatchAnalyticsCard />

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                variant="outline"
                className="justify-start h-auto p-4"
                asChild
              >
                <Link to={action.href}>
                  <action.icon className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform actions and changes</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 bg-blue-600 rounded-full" />
                    <div className="flex-1">
                      <span className="font-medium">{activity.action}</span>
                      <div className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" asChild className="w-full">
                  <Link to="/superadmin/audit-logs">View All Activity</Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
