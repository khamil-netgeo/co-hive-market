import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InventoryData {
  product_id: string;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  available_quantity: number;
}

/**
 * Hook for managing product inventory
 * Provides functions to check stock, reserve inventory, and manage stock levels
 */
export function useInventory() {
  const [isLoading, setIsLoading] = useState(false);

  // Get inventory data for multiple products
  const getInventoryData = useCallback(async (productIds: string[]): Promise<InventoryData[]> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('product_inventory')
        .select('*')
        .in('product_id', productIds);

      if (error) {
        console.error('Inventory fetch error:', error);
        return [];
      }

      return (data || []).map(item => ({
        ...item,
        available_quantity: item.stock_quantity - item.reserved_quantity,
      }));
    } catch (error) {
      console.error('Get inventory data failed:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if product has sufficient inventory
  const checkAvailability = useCallback(async (productId: string, requestedQuantity: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('product_inventory')
        .select('stock_quantity, reserved_quantity, track_inventory')
        .eq('product_id', productId)
        .maybeSingle();

      if (error) {
        console.error('Inventory check error:', error);
        return false;
      }

      // If no inventory tracking, assume available
      if (!data || !data.track_inventory) {
        return true;
      }

      const available = data.stock_quantity - data.reserved_quantity;
      return available >= requestedQuantity;
    } catch (error) {
      console.error('Check availability failed:', error);
      return false;
    }
  }, []);

  // Reserve inventory for a product
  const reserveInventory = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('reserve_inventory', {
        p_product_id: productId,
        p_quantity: quantity,
      });

      if (error) {
        console.error('Reserve inventory error:', error);
        toast.error('Failed to reserve inventory');
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Reserve inventory failed:', error);
      toast.error('Inventory reservation failed');
      return false;
    }
  }, []);

  // Release reserved inventory
  const releaseInventory = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('release_inventory', {
        p_product_id: productId,
        p_quantity: quantity,
      });

      if (error) {
        console.error('Release inventory error:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Release inventory failed:', error);
      return false;
    }
  }, []);

  // Update stock levels (for vendors/admins)
  const updateStock = useCallback(async (productId: string, stockQuantity: number, lowStockThreshold?: number): Promise<boolean> => {
    try {
      setIsLoading(true);

      const updateData: any = {
        stock_quantity: stockQuantity,
        updated_at: new Date().toISOString(),
      };

      if (lowStockThreshold !== undefined) {
        updateData.low_stock_threshold = lowStockThreshold;
      }

      const { error } = await supabase
        .from('product_inventory')
        .upsert({
          product_id: productId,
          ...updateData,
        });

      if (error) {
        console.error('Update stock error:', error);
        toast.error('Failed to update stock levels');
        return false;
      }

      toast.success('Stock levels updated successfully');
      return true;
    } catch (error) {
      console.error('Update stock failed:', error);
      toast.error('Stock update failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get low stock products for vendor
  const getLowStockProducts = useCallback(async (vendorId?: string) => {
    try {
      let query = supabase
        .from('product_inventory')
        .select(`
          *,
          products!inner (
            id,
            name,
            vendor_id,
            status,
            vendors!inner (
              name
            )
          )
        `)
        .filter('stock_quantity', 'lte', 'low_stock_threshold')
        .eq('track_inventory', true);

      if (vendorId) {
        query = query.eq('products.vendor_id', vendorId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Low stock fetch error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get low stock products failed:', error);
      return [];
    }
  }, []);

  return {
    isLoading,
    getInventoryData,
    checkAvailability,
    reserveInventory,
    releaseInventory,
    updateStock,
    getLowStockProducts,
  };
}