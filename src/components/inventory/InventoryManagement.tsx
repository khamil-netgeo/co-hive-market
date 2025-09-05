import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useInventory } from "@/hooks/useInventory";
import { useState, useEffect } from "react";
import { Package, AlertTriangle, TrendingDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface InventoryManagementProps {
  vendorId?: string;
}

export function InventoryManagement({ vendorId }: InventoryManagementProps) {
  const { getLowStockProducts, updateStock, isLoading } = useInventory();
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadLowStockProducts = async () => {
    setRefreshing(true);
    try {
      const products = await getLowStockProducts(vendorId);
      setLowStockProducts(products);
    } catch (error) {
      console.error('Failed to load low stock products:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLowStockProducts();
  }, [vendorId]);

  const handleStockUpdate = async (productId: string, newStock: number, threshold?: number) => {
    const success = await updateStock(productId, newStock, threshold);
    if (success) {
      await loadLowStockProducts(); // Refresh the list
    }
  };

  const getStockLevel = (current: number, threshold: number) => {
    if (current === 0) return 'out-of-stock';
    if (current <= threshold) return 'low';
    if (current <= threshold * 2) return 'medium';
    return 'high';
  };

  const getStockColor = (level: string) => {
    switch (level) {
      case 'out-of-stock': return 'destructive';
      case 'low': return 'destructive';
      case 'medium': return 'secondary';
      case 'high': return 'default';
      default: return 'default';
    }
  };

  const getProgressValue = (current: number, threshold: number) => {
    const maxDisplay = threshold * 3; // Show progress up to 3x threshold
    return Math.min((current / maxDisplay) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Inventory Management
          </h2>
          <p className="text-muted-foreground">
            Monitor and manage your product inventory levels
          </p>
        </div>
        <Button
          onClick={loadLowStockProducts}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium">Low Stock Items</p>
                <p className="text-2xl font-bold">{lowStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium">Out of Stock</p>
                <p className="text-2xl font-bold">
                  {lowStockProducts.filter(p => p.stock_quantity === 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Needs Attention</p>
                <p className="text-2xl font-bold">
                  {lowStockProducts.filter(p => p.stock_quantity <= p.low_stock_threshold).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Products Requiring Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          {refreshing ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading inventory data...</p>
            </div>
          ) : lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">All Good!</h3>
              <p className="text-muted-foreground">
                No products currently require inventory attention.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockProducts.map((product) => {
                const stockLevel = getStockLevel(product.stock_quantity, product.low_stock_threshold);
                const progressValue = getProgressValue(product.stock_quantity, product.low_stock_threshold);
                
                return (
                  <div
                    key={product.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{product.products?.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStockColor(stockLevel) as any}>
                            {stockLevel === 'out-of-stock' ? 'Out of Stock' : 
                             stockLevel === 'low' ? 'Low Stock' : 
                             stockLevel === 'medium' ? 'Medium Stock' : 'In Stock'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {product.stock_quantity} / {product.low_stock_threshold} threshold
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Reserved</p>
                        <p className="font-semibold">{product.reserved_quantity}</p>
                      </div>
                    </div>

                    {/* Stock Level Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Stock Level</span>
                        <span>{product.stock_quantity} units</span>
                      </div>
                      <Progress value={progressValue} className="h-2" />
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStockUpdate(
                          product.product_id,
                          product.stock_quantity + 10
                        )}
                        disabled={isLoading}
                      >
                        +10 Stock
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStockUpdate(
                          product.product_id,
                          product.stock_quantity + 50
                        )}
                        disabled={isLoading}
                      >
                        +50 Stock
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newStock = prompt(
                            `Set new stock level for ${product.products?.name}:`,
                            product.stock_quantity.toString()
                          );
                          if (newStock && !isNaN(Number(newStock))) {
                            handleStockUpdate(product.product_id, Number(newStock));
                          }
                        }}
                        disabled={isLoading}
                      >
                        Set Custom
                      </Button>
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