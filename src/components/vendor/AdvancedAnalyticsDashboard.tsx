import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package, Star, Eye } from "lucide-react";

interface AnalyticsData {
  revenue: any[];
  orders: any[];
  products: any[];
  customers: any[];
  reviews: {
    avgRating: number;
    distribution: { rating: number; count: number; }[];
    total: number;
  };
  traffic: any[];
}

interface VendorAnalyticsProps {
  vendorId: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function AdvancedAnalyticsDashboard({ vendorId }: VendorAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Fetch comprehensive analytics data
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["vendor-advanced-analytics", vendorId, timeRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch revenue analytics
      const { data: orders } = await supabase
        .from('orders')
        .select('created_at, total_amount_cents, status, buyer_user_id')
        .eq('vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Fetch product performance
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          quantity,
          unit_price_cents,
          products (name, id),
          orders!inner (
            created_at,
            status,
            vendor_id
          )
        `)
        .eq('orders.vendor_id', vendorId)
        .gte('orders.created_at', startDate.toISOString());

      // Fetch reviews analytics
      const { data: reviews } = await supabase
        .from('reviews')
        .select(`
          rating,
          created_at,
          products!inner (vendor_id)
        `)
        .eq('products.vendor_id', vendorId)
        .gte('created_at', startDate.toISOString());

      // Process data for charts
      const revenueData = processRevenueData(orders || []);
      const productData = processProductData(orderItems || []);
      const customerData = processCustomerData(orders || []);
      const reviewData = processReviewData(reviews || []);

      return {
        revenue: revenueData,
        orders: orders || [],
        products: productData,
        customers: customerData,
        reviews: reviewData,
        traffic: [] // Would come from analytics service
      };
    },
  });

  const processRevenueData = (orders: any[]) => {
    const grouped = orders.reduce((acc: any, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, orders: 0 };
      }
      acc[date].orders += 1;
      if (['paid', 'fulfilled'].includes(order.status)) {
        acc[date].revenue += order.total_amount_cents / 100;
      }
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const processProductData = (orderItems: any[]) => {
    const grouped = orderItems.reduce((acc: any, item) => {
      const productName = item.products?.name || 'Unknown';
      if (!acc[productName]) {
        acc[productName] = { name: productName, sales: 0, revenue: 0 };
      }
      acc[productName].sales += item.quantity;
      acc[productName].revenue += (item.quantity * item.unit_price_cents) / 100;
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);
  };

  const processCustomerData = (orders: any[]) => {
    const uniqueCustomers = new Set(orders.map(o => o.buyer_user_id));
    const repeatCustomers = orders.reduce((acc: any, order) => {
      const customerId = order.buyer_user_id;
      acc[customerId] = (acc[customerId] || 0) + 1;
      return acc;
    }, {});

    const newCustomers = Object.values(repeatCustomers).filter((count: any) => count === 1).length;
    const returningCustomers = uniqueCustomers.size - newCustomers;

    return [
      { name: 'New Customers', value: newCustomers },
      { name: 'Returning Customers', value: returningCustomers }
    ];
  };

  const processReviewData = (reviews: any[]) => {
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length
    }));

    return { avgRating, distribution: ratingDistribution, total: reviews.length };
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    );
  }

  const totalRevenue = analytics?.revenue.reduce((sum: number, item: any) => sum + item.revenue, 0) || 0;
  const totalOrders = analytics?.orders.length || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const conversionRate = analytics?.traffic.length > 0 ? (totalOrders / analytics.traffic.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gradient-brand">Advanced Analytics</h2>
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">RM {totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <ShoppingCart className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xl font-bold">{totalOrders}</p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xl font-bold">RM {avgOrderValue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Avg Order</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted/10">
                <Star className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold">{analytics?.reviews.avgRating.toFixed(1) || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.products}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customer Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.customers}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics?.customers.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Review Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.reviews.distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}