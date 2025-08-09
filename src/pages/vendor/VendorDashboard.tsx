import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Edit, Trash2, Eye } from "lucide-react";
import { setSEO } from "@/lib/seo";
import useAuthRoles from "@/hooks/useAuthRoles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  status: string;
  created_at: string;
}

interface Vendor {
  id: string;
  display_name: string;
  community_id: string;
}

const VendorDashboard = () => {
  const { user, loading } = useAuthRoles();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    setSEO(
      "Vendor Dashboard — CoopMarket",
      "Manage your products and services in the community marketplace."
    );
    
    if (user && !loading) {
      fetchVendorData();
    }
  }, [user, loading]);

  const fetchVendorData = async () => {
    if (!user) return;

    try {
      // Get vendor profile
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

      // Get vendor's products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", vendorData.id)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

    } catch (error) {
      console.error("Error fetching vendor data:", error);
      toast.error("Failed to load vendor data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  if (loading || loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (!vendor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Vendor Profile Found</CardTitle>
            <CardDescription>
              You need to join as a vendor to access this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/getting-started">Join as Vendor</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient-brand">
            Vendor Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {vendor.display_name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/vendor/products/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/vendor/services" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Services
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/vendor/plans" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Service Plans
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Active Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.status === 'inactive').length}
                </p>
                <p className="text-sm text-muted-foreground">Inactive Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Orders This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Products</CardTitle>
          <CardDescription>
            Manage your product listings and inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first product listing
              </p>
              <Button asChild>
                <Link to="/vendor/products/new">Create Product</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge 
                        variant={product.status === 'active' ? 'default' : 'secondary'}
                      >
                        {product.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {product.description}
                    </p>
                    <p className="font-semibold text-primary">
                      {formatPrice(product.price_cents, product.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/vendor/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorDashboard;