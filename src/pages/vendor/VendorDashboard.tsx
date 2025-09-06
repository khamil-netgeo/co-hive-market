import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { setSEO } from "@/lib/seo";
import { Package, ListOrdered, BarChart3, Wallet, Plus, Eye, Pencil, TrendingUp, TrendingDown, AlertTriangle, Clock } from "lucide-react";
import MediaGallery from "@/components/common/MediaGallery";
import { useVendorAnalytics } from "@/hooks/useVendorAnalytics";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  status: string;
  image_urls?: string[] | null;
}

interface Service {
  id: string;
  name: string;
  subtitle?: string | null;
  description: string | null;
  price_cents: number;
  status: string;
  image_urls?: string[] | null;
}

interface Vendor {
  id: string;
  display_name: string | null;
  community_id: string;
}

export default function VendorDashboard() {
  const { user } = useAuthRoles();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use the enhanced analytics hook
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useVendorAnalytics(vendor?.id || null);

  useEffect(() => {
    setSEO("Vendor Dashboard — Overview", "Manage your listings and track performance");
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchVendorData();
    }
  }, [user?.id]);

  const fetchVendorData = async () => {
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select("id, display_name, community_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (vendorError) throw vendorError;
      
      if (!vendorData) {
        toast.error("No vendor profile found. Please complete vendor onboarding.");
        return;
      }

      setVendor(vendorData as Vendor);

      // Fetch products and services in parallel
      const [productsRes, servicesRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, description, price_cents, status, image_urls")
          .eq("vendor_id", vendorData.id)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("vendor_services")
          .select("id, name, subtitle, description, price_cents, status, image_urls")
          .eq("vendor_id", vendorData.id)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (servicesRes.error) throw servicesRes.error;

      setProducts(productsRes.data as Product[]);
      setServices(servicesRes.data as Service[]);
    } catch (error: any) {
      console.error("Error fetching vendor data:", error);
      toast.error("Failed to load vendor data");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number, currency = "MYR") => {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  if (!user) {
    return (
      <main className="container py-8">
        <p>Please log in to access the vendor dashboard.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!vendor) {
    return (
      <main className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No Vendor Profile Found</h2>
            <p className="text-muted-foreground mb-4">
              You need to complete vendor onboarding to access the dashboard.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const activeProducts = products.filter((p) => p.status === "active").length;
  const activeServices = services.filter((s) => s.status === "active").length;

  // Format percentage with sign and color
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    const color = value >= 0 ? 'text-green-600' : 'text-red-600';
    return (
      <span className={color}>
        {sign}{value.toFixed(1)}%
      </span>
    );
  };

  return (
    <main className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-brand">Vendor Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {vendor.display_name || "Vendor"}!
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="tiktok">
            <Link to="/vendor/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
          <Button asChild variant="hero">
            <Link to="/vendor/services/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Link>
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : formatPrice(stats?.totalRevenue || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats?.weekOverWeekGrowth !== undefined && (
                <>
                  {stats.weekOverWeekGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                  )}
                  {formatPercentage(stats.weekOverWeekGrowth)} vs last week
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ListOrdered className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingOrders || 0} pending • {stats?.completedOrders || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeProducts} active
              {stats?.lowStockCount && stats.lowStockCount > 0 && (
                <span className="text-orange-600 ml-2">
                  • {stats.lowStockCount} low stock
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeServices} active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(stats?.lowStockCount && stats.lowStockCount > 0) || (stats?.pendingOrders && stats.pendingOrders > 0) ? (
        <div className="space-y-4">
          {stats.lowStockCount > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{stats.lowStockCount} products</strong> are running low on stock.{' '}
                <Link to="/vendor/inventory" className="underline">
                  Manage inventory
                </Link>
              </AlertDescription>
            </Alert>
          )}
          
          {stats.pendingOrders > 0 && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                You have <strong>{stats.pendingOrders} pending orders</strong> that need attention.{' '}
                <Link to="/vendor/orders" className="underline">
                  View orders
                </Link>
              </AlertDescription>
            </Alert>
          )}
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <>
                {stats.recentOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs">
                      {order.id.slice(0, 8)}...
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/vendor/orders">View All Orders</Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No recent orders</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : stats?.topProducts && stats.topProducts.length > 0 ? (
              <>
                {stats.topProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{product.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {product.total_sales} sold
                    </span>
                  </div>
                ))}
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/vendor/analytics">View Analytics</Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No sales data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
              <>
                {stats.lowStockProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{product.name}</span>
                        <span className="text-xs text-orange-600 ml-2">
                          {product.stock_qty} left
                        </span>
                  </div>
                ))}
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/vendor/inventory">Manage Stock</Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">All products in stock</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Products */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Products</h2>
          <Button variant="outline" asChild>
            <Link to="/vendor/listings?type=products">View All</Link>
          </Button>
        </div>
        
        {products.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first product to begin selling.
              </p>
              <Button asChild>
                <Link to="/vendor/products/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Product
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-video">
                  <MediaGallery 
                    images={product.image_urls || []} 
                    videos={[]} 
                    alt={product.name} 
                    aspect="video" 
                    showThumbnails={false} 
                  />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-1">{product.name}</CardTitle>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">
                      {formatPrice(product.price_cents)}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/vendor/products/${product.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/product/${product.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recent Services */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Services</h2>
          <Button variant="outline" asChild>
            <Link to="/vendor/listings?type=services">View All</Link>
          </Button>
        </div>
        
        {services.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No services yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first service to expand your offerings.
              </p>
              <Button asChild>
                <Link to="/vendor/services/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Service
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="overflow-hidden">
                <div className="aspect-video">
                  <MediaGallery 
                    images={service.image_urls || []} 
                    videos={[]} 
                    alt={service.name} 
                    aspect="video" 
                    showThumbnails={false} 
                  />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-1">{service.name}</CardTitle>
                    <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                      {service.status}
                    </Badge>
                  </div>
                  {service.subtitle && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {service.subtitle}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">
                      {formatPrice(service.price_cents)}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/vendor/services/${service.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/service/${service.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}