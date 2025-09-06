import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";

interface Product {
  id: string;
  name: string;
  stock_qty: number;
  status: string;
}

export default function InventoryManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { user } = useAuthRoles();

  useEffect(() => {
    if (user?.id) {
      fetchInventory();
    }
  }, [user?.id]);

  const fetchInventory = async () => {
    try {
      const { data: vendor, error: vendorError } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (vendorError) throw vendorError;
      if (!vendor) {
        toast.error("Vendor profile not found");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock_qty, status")
        .eq("vendor_id", vendor.id)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId: string, newQuantity: number) => {
    if (newQuantity < 0) {
      toast.error("Stock quantity cannot be negative");
      return;
    }

    setUpdating(productId);
    try {
      const { error } = await supabase
        .from("products")
        .update({ 
          stock_qty: newQuantity,
          status: newQuantity === 0 ? 'inactive' : 'active'
        })
        .eq("id", productId);

      if (error) throw error;

      setProducts(products.map(product => 
        product.id === productId 
          ? { 
              ...product, 
              stock_qty: newQuantity,
              status: newQuantity === 0 ? 'inactive' : 'active'
            }
          : product
      ));

      toast.success("Stock updated successfully");
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock");
    } finally {
      setUpdating(null);
    }
  };

  const quickAdjust = (productId: string, adjustment: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newQuantity = Math.max(0, product.stock_qty + adjustment);
    updateStock(productId, newQuantity);
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_qty <= 0) {
      return { status: 'Out of Stock', variant: 'destructive' as const, color: 'text-red-600' };
    } else if (product.stock_qty <= 5) {
      return { status: 'Low Stock', variant: 'secondary' as const, color: 'text-orange-600' };
    } else {
      return { status: 'In Stock', variant: 'default' as const, color: 'text-green-600' };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading inventory...</div>
      </div>
    );
  }

  const lowStockProducts = products.filter(p => p.stock_qty <= 5 && p.stock_qty > 0);
  const outOfStockProducts = products.filter(p => p.stock_qty <= 0);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-brand">
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Track and manage your product stock levels
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Total inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Unavailable</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              {lowStockProducts.length} products are running low on stock and may need restocking soon.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                Add some products to start tracking inventory.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => {
                const stockStatus = getStockStatus(product);
                
                return (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{product.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{product.stock_qty}</div>
                        <div className="text-sm text-muted-foreground">in stock</div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Current Stock */}
                      <div className="space-y-2">
                        <Label>Current Stock</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => quickAdjust(product.id, -1)}
                            disabled={updating === product.id}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={product.stock_qty}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              updateStock(product.id, value);
                            }}
                            className="text-center"
                            min="0"
                            disabled={updating === product.id}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => quickAdjust(product.id, 1)}
                            disabled={updating === product.id}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="space-y-2">
                        <Label>Quick Restock</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => quickAdjust(product.id, 10)}
                            disabled={updating === product.id}
                          >
                            +10
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => quickAdjust(product.id, 50)}
                            disabled={updating === product.id}
                          >
                            +50
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => quickAdjust(product.id, 100)}
                            disabled={updating === product.id}
                          >
                            +100
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}