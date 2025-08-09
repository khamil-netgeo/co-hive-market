import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { setSEO } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Package, Calendar, TrendingUp, ShoppingCart, Users } from "lucide-react";
import { toast } from "sonner";
import useAuthRoles from "@/hooks/useAuthRoles";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Vendor {
  id: string;
  display_name: string;
  community_id: string;
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

interface ProductSales {
  name: string;
  quantity: number;
  revenue: number;
}

const VendorAnalytics = () => {
  const { user, loading } = useAuthRoles();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loadingVendor, setLoadingVendor] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    setSEO(
      "Vendor Analytics — CoopMarket",
      "View your sales analytics and performance metrics."
    );
    
    if (user && !loading) {
      fetchVendorData();
    }
  }, [user, loading]);

  const fetchVendorData = async () => {
    if (!user) return;

    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (vendorError) throw vendorError;

      if (!vendorData) {
        toast.error("You don't have a vendor profile. Please join as a vendor first.");
        navigate("/getting-started");
        return;
      }

      setVendor(vendorData);
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      toast.error("Failed to load vendor data");
    } finally {
      setLoadingVendor(false);
    }
  };

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  };

  // Fetch sales analytics
  const { data: salesData = [], isLoading: salesLoading } = useQuery<SalesData[]>({
    queryKey: ["vendor-sales-analytics", vendor?.id, timeRange],
    enabled: !!vendor?.id,
    queryFn: async () => {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase
        .from("orders")
        .select("created_at, total_amount_cents, status")
        .eq("vendor_id", vendor!.id)
        .gte("created_at", start)
        .lte("created_at", end);
      
      if (error) throw error;

      // Group by date
      const grouped = data.reduce((acc: Record<string, { revenue: number; orders: number }>, order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { revenue: 0, orders: 0 };
        }
        acc[date].orders += 1;
        if (order.status === 'fulfilled' || order.status === 'paid') {
          acc[date].revenue += order.total_amount_cents;
        }
        return acc;
      }, {});

      return Object.entries(grouped)
        .map(([date, stats]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: stats.revenue / 100, // Convert to dollars
          orders: stats.orders
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
  });

  // Fetch product performance
  const { data: productSales = [], isLoading: productLoading } = useQuery<ProductSales[]>({
    queryKey: ["vendor-product-performance", vendor?.id, timeRange],
    enabled: !!vendor?.id,
    queryFn: async () => {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          quantity,
          unit_price_cents,
          products (name),
          orders!inner (
            created_at,
            status,
            vendor_id
          )
        `)
        .eq("orders.vendor_id", vendor!.id)
        .gte("orders.created_at", start)
        .lte("orders.created_at", end);
      
      if (error) throw error;

      // Group by product
      const grouped = data.reduce((acc: Record<string, { quantity: number; revenue: number }>, item) => {
        const productName = (item as any).products?.name || 'Unknown Product';
        const orderStatus = (item as any).orders?.status;
        
        if (!acc[productName]) {
          acc[productName] = { quantity: 0, revenue: 0 };
        }
        
        acc[productName].quantity += item.quantity;
        if (orderStatus === 'fulfilled' || orderStatus === 'paid') {
          acc[productName].revenue += item.quantity * item.unit_price_cents;
        }
        
        return acc;
      }, {});

      return Object.entries(grouped)
        .map(([name, stats]) => ({
          name,
          quantity: stats.quantity,
          revenue: stats.revenue / 100 // Convert to dollars
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Top 10 products
    },
  });

  // Calculate total stats
  const totalRevenue = salesData.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const topProduct = productSales[0];

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  if (loading || loadingVendor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user || !vendor) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-brand">
            Sales Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your performance and sales trends
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/vendor/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold">{formatPrice(totalRevenue)}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold">{totalOrders}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold">{formatPrice(avgOrderValue)}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Avg Order Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm md:text-base font-bold truncate">{topProduct?.name || 'No sales yet'}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Top Product</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Loading sales data...</p>
              </div>
            ) : salesData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">No sales data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <span>Date</span>
                  <span className="text-right">Orders</span>
                  <span className="text-right">Revenue</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {salesData.slice(-10).reverse().map((day, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 text-sm py-2 border-b">
                      <span>{day.date}</span>
                      <span className="text-right font-medium">{day.orders}</span>
                      <span className="text-right font-semibold">{formatPrice(day.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {productLoading ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Loading product data...</p>
              </div>
            ) : productSales.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">No product sales data</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <span>Product</span>
                  <span className="text-right">Qty Sold</span>
                  <span className="text-right">Revenue</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {productSales.slice(0, 8).map((product, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 text-sm py-2 border-b">
                      <span className="truncate font-medium">{product.name}</span>
                      <span className="text-right">{product.quantity}</span>
                      <span className="text-right font-semibold">{formatPrice(product.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</div>
              <div className="text-sm text-muted-foreground">Total Revenue ({timeRange})</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalOrders}</div>
              <div className="text-sm text-muted-foreground">Total Orders ({timeRange})</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{productSales.length}</div>
              <div className="text-sm text-muted-foreground">Products Sold ({timeRange})</div>
            </div>
          </div>
          
          {totalOrders > 0 && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Key Insights</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Average order value: {formatPrice(avgOrderValue)}</li>
                <li>• Best performing product: {topProduct?.name || 'N/A'}</li>
                <li>• Most active sales period: {salesData.length > 0 ? 'Recent days' : 'No data'}</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorAnalytics;