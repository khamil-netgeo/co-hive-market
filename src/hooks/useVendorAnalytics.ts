import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VendorStats {
  totalProducts: number;
  activeProducts: number;
  totalServices: number;
  activeServices: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  weeklyRevenue: number;
  lowStockCount: number;
  weekOverWeekGrowth: number;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock_qty: number;
  }>;
  recentOrders: Array<{
    id: string;
    created_at: string;
    status: string;
    total_amount_cents: number;
    buyer_user_id: string;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    total_sales: number;
    revenue: number;
  }>;
}

export const useVendorAnalytics = (vendorId: string | null) => {
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      return;
    }
    
    fetchVendorStats();
  }, [vendorId]);

  const fetchVendorStats = async () => {
    if (!vendorId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        productsResult,
        servicesResult,
        ordersResult,
        recentOrdersResult
      ] = await Promise.all([
        // Products stats
        supabase
          .from('products')
          .select('id, name, status, stock_qty')
          .eq('vendor_id', vendorId),

        // Services stats  
        supabase
          .from('vendor_services')
          .select('id, status')
          .eq('vendor_id', vendorId),

        // Orders stats
        supabase
          .from('orders')
          .select(`
            id,
            created_at,
            status,
            total_amount_cents,
            buyer_user_id,
            order_items (
              quantity,
              unit_price_cents,
              product_id,
              products (name)
            )
          `)
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false }),

        // Recent orders (last 5)
        supabase
          .from('orders')
          .select('id, created_at, status, total_amount_cents, buyer_user_id')
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      if (productsResult.error) throw productsResult.error;
      if (servicesResult.error) throw servicesResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (recentOrdersResult.error) throw recentOrdersResult.error;

      const products = productsResult.data || [];
      const services = servicesResult.data || [];
      const orders = ordersResult.data || [];

      // Calculate weekly revenue (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const thisWeekOrders = orders.filter(
        order => new Date(order.created_at) >= weekAgo && order.status === 'fulfilled'
      );
      
      const prevWeekStart = new Date();
      prevWeekStart.setDate(prevWeekStart.getDate() - 14);
      const prevWeekEnd = new Date();
      prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
      
      const lastWeekOrders = orders.filter(
        order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= prevWeekStart && orderDate < prevWeekEnd && order.status === 'fulfilled';
        }
      );

      const thisWeekRevenue = thisWeekOrders.reduce((sum, order) => sum + order.total_amount_cents, 0);
      const lastWeekRevenue = lastWeekOrders.reduce((sum, order) => sum + order.total_amount_cents, 0);
      
      const weekOverWeekGrowth = lastWeekRevenue > 0 
        ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
        : thisWeekRevenue > 0 ? 100 : 0;

      // Calculate top products by sales volume
      const productSalesMap = new Map<string, { name: string; sales: number; revenue: number }>();
      
      orders.forEach(order => {
        if (order.status === 'fulfilled' && order.order_items) {
          order.order_items.forEach(item => {
            const productId = item.product_id;
            const productName = item.products?.name || 'Unknown';
            const existing = productSalesMap.get(productId) || { name: productName, sales: 0, revenue: 0 };
            
            productSalesMap.set(productId, {
              name: productName,
              sales: existing.sales + item.quantity,
              revenue: existing.revenue + (item.quantity * item.unit_price_cents)
            });
          });
        }
      });

      const topProducts = Array.from(productSalesMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          total_sales: data.sales,
          revenue: data.revenue
        }))
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 5);

      // Find low stock products (using stock_qty field and threshold of 5)
      const lowStockProducts = products
        .filter(product => product.status === 'active' && (product.stock_qty || 0) <= 5)
        .map(product => ({
          id: product.id,
          name: product.name,
          stock_qty: product.stock_qty || 0
        }));

      const vendorStats: VendorStats = {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        totalServices: services.length,
        activeServices: services.filter(s => s.status === 'active').length,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'fulfilled').length,
        totalRevenue: orders
          .filter(o => o.status === 'fulfilled')
          .reduce((sum, order) => sum + order.total_amount_cents, 0),
        weeklyRevenue: thisWeekRevenue,
        weekOverWeekGrowth,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        recentOrders: recentOrdersResult.data || [],
        topProducts
      };

      setStats(vendorStats);
    } catch (err: any) {
      console.error('Error fetching vendor stats:', err);
      setError(err.message || 'Failed to fetch vendor analytics');
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    error,
    refetch: fetchVendorStats
  };
};