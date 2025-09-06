import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { toast } from "sonner";
import { setSEO } from "@/lib/seo";
import StandardDashboardLayout from "@/components/layout/StandardDashboardLayout";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, ListOrdered, BarChart3, Wallet, Plus, Eye, Pencil, AlertTriangle } from "lucide-react";
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
    setSEO(
      "Vendor Dashboard — CoopMarket",
      "Manage your products, services, orders, and analytics from your vendor dashboard."
    );
  }, []);

  useEffect(() => {
    if (user) {
      fetchVendorData();
    }
  }, [user]);

  const fetchVendorData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch vendor info
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (vendorError) throw vendorError;
      
      if (!vendorData) {
        console.log("No vendor profile found");
        setLoading(false);
        return;
      }

      setVendor(vendorData);

      // Fetch products and services in parallel
      const [productsResult, servicesResult] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("vendor_id", vendorData.id)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("vendor_services")
          .select("*")
          .eq("vendor_id", vendorData.id)
          .order("created_at", { ascending: false })
          .limit(6)
      ]);

      if (productsResult.error) throw productsResult.error;
      if (servicesResult.error) throw servicesResult.error;

      setProducts(productsResult.data || []);
      setServices(servicesResult.data || []);

    } catch (error) {
      console.error("Failed to fetch vendor data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number, currency = "myr") => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  if (!user) {
    return (
      <StandardDashboardLayout title="Vendor Dashboard" subtitle="Please log in to access your dashboard">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Please log in to access the vendor dashboard.</p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </StandardDashboardLayout>
    );
  }

  if (loading) {
    return <DashboardSkeleton showStats showHeader showActions statCount={4} cardCount={3} />;
  }

  if (!vendor) {
    return (
      <StandardDashboardLayout title="Vendor Dashboard" subtitle="Complete vendor onboarding to access your dashboard">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No Vendor Profile Found</h2>
            <p className="text-muted-foreground mb-4">
              You need to complete vendor onboarding to access the dashboard.
            </p>
            <Button asChild>
              <Link to="/getting-started">Get Started</Link>
            </Button>
          </CardContent>
        </Card>
      </StandardDashboardLayout>
    );
  }

  const activeProducts = products.filter((p) => p.status === "active").length;
  const activeServices = services.filter((s) => s.status === "active").length;

  // Prepare stats for StandardDashboardLayout
  const vendorStats = [
    {
      title: "Total Revenue",
      value: statsLoading ? "..." : formatPrice(stats?.totalRevenue || 0),
      description: stats?.weekOverWeekGrowth !== undefined ? 
        `${stats.weekOverWeekGrowth >= 0 ? '+' : ''}${stats.weekOverWeekGrowth.toFixed(1)}% vs last week` : 
        "This month",
      icon: <Wallet className="h-4 w-4" />
    },
    {
      title: "Total Orders",
      value: statsLoading ? "..." : (stats?.totalOrders || 0).toString(),
      description: `${stats?.pendingOrders || 0} pending • ${stats?.completedOrders || 0} completed`,
      icon: <ListOrdered className="h-4 w-4" />
    },
    {
      title: "Products",
      value: products.length.toString(),
      description: `${activeProducts} active${stats?.lowStockCount && stats.lowStockCount > 0 ? ` • ${stats.lowStockCount} low stock` : ''}`,
      icon: <Package className="h-4 w-4" />
    },
    {
      title: "Services",
      value: services.length.toString(),
      description: `${activeServices} active`,
      icon: <BarChart3 className="h-4 w-4" />
    }
  ];

  const actions = (
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
  );

  return (
    <StandardDashboardLayout
      title="Vendor Dashboard"
      subtitle={`Welcome back, ${vendor.display_name || "Vendor"}!`}
      stats={vendorStats}
      actions={actions}
    >
      {/* Stock Alert */}
      {stats?.lowStockCount && stats.lowStockCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {stats.lowStockCount} products with low stock levels. 
            <Link to="/vendor/inventory" className="ml-1 underline">
              Review inventory
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Products</CardTitle>
            <Button variant="outline" asChild>
              <Link to="/vendor/products">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first product to your catalog.
              </p>
              <Button asChild>
                <Link to="/vendor/products/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Product
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square">
                    <MediaGallery 
                      images={product.image_urls || []} 
                      videos={[]} 
                      alt={product.name} 
                      aspect="square" 
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
                      <span className="text-lg font-semibold">
                        {formatPrice(product.price_cents)}
                      </span>
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
        </CardContent>
      </Card>

      {/* Recent Services */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Services</CardTitle>
            <Button variant="outline" asChild>
              <Link to="/vendor/services">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="py-8 text-center">
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
            </div>
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
                      <span className="text-lg font-semibold">
                        {formatPrice(service.price_cents)}
                      </span>
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
        </CardContent>
      </Card>
    </StandardDashboardLayout>
  );
}