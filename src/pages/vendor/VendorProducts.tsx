import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  category: string | null;
  stock_qty: number;
  status: string;
  created_at: string;
}

export default function VendorProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthRoles();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: vendor } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!vendor) {
        toast.error("Vendor profile not found");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", vendor.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      
      const { error } = await supabase
        .from("products")
        .update({ status: newStatus })
        .eq("id", productId);

      if (error) throw error;

      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, status: newStatus }
          : product
      ));

      toast.success(`Product ${newStatus === "active" ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Failed to update product status");
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      setProducts(products.filter(product => product.id !== productId));
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return (cents / 100).toLocaleString('en-MY', {
      style: 'currency',
      currency: currency.toUpperCase()
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-brand">
            My Products
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your product listings and inventory
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/catalog">
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first product to the marketplace
            </p>
            <Button asChild>
              <Link to="/catalog">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {product.description || "No description"}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={product.status === "active" ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {product.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold">
                      {formatPrice(product.price_cents, product.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {product.stock_qty} units
                    </p>
                  </div>
                  {product.category && (
                    <Badge variant="outline">{product.category}</Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleProductStatus(product.id, product.status)}
                    className="flex-1"
                  >
                    {product.status === "active" ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Show
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/catalog?edit=${product.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteProduct(product.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}