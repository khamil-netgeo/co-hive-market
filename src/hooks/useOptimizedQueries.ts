import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCaching } from './useCaching';
import { usePerformanceOptimization } from './usePerformanceOptimization';

/**
 * Optimized queries with caching, pagination, and performance enhancements
 */
export function useOptimizedQueries() {
  const { getCache, setCache } = useCaching();
  const { createDebounced } = usePerformanceOptimization();

  // Optimized products query with search and filtering
  const useOptimizedProducts = (
    filters: {
      search?: string;
      category?: string;
      vendorId?: string;
      priceRange?: [number, number];
      inStock?: boolean;
    } = {},
    options: { enabled?: boolean; pageSize?: number } = {}
  ) => {
    const { enabled = true, pageSize = 20 } = options;

    return useInfiniteQuery({
      queryKey: ['optimized-products', filters],
      initialPageParam: 0,
      queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
        let query = supabase
          .from('products')
          .select(`
            *,
            vendors (name, user_id),
            product_inventory (quantity_available),
            product_rating_summary (avg_rating, review_count)
          `)
          .eq('status', 'active')
          .range(pageParam * pageSize, ((pageParam + 1) * pageSize) - 1)
          .order('created_at', { ascending: false });

        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        if (filters.category) {
          query = query.eq('category', filters.category);
        }

        if (filters.vendorId) {
          query = query.eq('vendor_id', filters.vendorId);
        }

        if (filters.priceRange) {
          query = query
            .gte('price_cents', filters.priceRange[0] * 100)
            .lte('price_cents', filters.priceRange[1] * 100);
        }

        if (filters.inStock) {
          query = query.gt('product_inventory.quantity_available', 0);
        }

        const { data, error } = await query;
        if (error) throw error;

        return {
          data: data || [],
          nextPage: data?.length === pageSize ? pageParam + 1 : undefined,
        };
      },
      getNextPageParam: (lastPage: { nextPage?: number }) => lastPage.nextPage,
      enabled,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // Optimized orders query with status filtering
  const useOptimizedOrders = (
    userId: string,
    filters: {
      status?: string;
      vendorId?: string;
      dateRange?: [Date, Date];
    } = {},
    options: { enabled?: boolean; pageSize?: number } = {}
  ) => {
    const { enabled = true, pageSize = 10 } = options;

    return useInfiniteQuery({
      queryKey: ['optimized-orders', userId, filters],
      initialPageParam: 0,
      queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
        let query = supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (name, image_urls)
            ),
            vendors (name, logo_url),
            deliveries (status, rider_user_id, scheduled_pickup_at)
          `)
          .or(`buyer_user_id.eq.${userId},vendor_id.in.(select id from vendors where user_id.eq.${userId})`)
          .range(pageParam * pageSize, ((pageParam + 1) * pageSize) - 1)
          .order('created_at', { ascending: false });

        if (filters.status) {
          query = query.eq('status', filters.status as any);
        }

        if (filters.vendorId) {
          query = query.eq('vendor_id', filters.vendorId);
        }

        if (filters.dateRange) {
          query = query
            .gte('created_at', filters.dateRange[0].toISOString())
            .lte('created_at', filters.dateRange[1].toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;

        return {
          data: data || [],
          nextPage: data?.length === pageSize ? pageParam + 1 : undefined,
        };
      },
      getNextPageParam: (lastPage: { nextPage?: number }) => lastPage.nextPage,
      enabled: enabled && !!userId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Optimized vendor analytics query with caching
  const useOptimizedVendorAnalytics = (
    vendorId: string,
    timeRange: string,
    options: { enabled?: boolean } = {}
  ) => {
    const { enabled = true } = options;

    return useQuery({
      queryKey: ['vendor-analytics', vendorId, timeRange],
      queryFn: async () => {
        // Check cache first
        const cacheKey = `vendor-analytics-${vendorId}-${timeRange}`;
        const cached = getCache(cacheKey, { ttl: 10 * 60 * 1000 }); // 10 minutes TTL
        if (cached) return cached;

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
          default:
            startDate.setDate(endDate.getDate() - 30);
        }

        // Parallel queries for better performance
        const [salesData, productData, reviewData] = await Promise.all([
          // Sales analytics
          supabase
            .from('orders')
            .select('total_amount_cents, created_at, status')
            .eq('vendor_id', vendorId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString()),

          // Product performance
          supabase
            .from('order_items')
            .select(`
              quantity,
              unit_price_cents,
              products!inner (name, id),
              orders!inner (created_at, vendor_id)
            `)
            .eq('orders.vendor_id', vendorId)
            .gte('orders.created_at', startDate.toISOString())
            .lte('orders.created_at', endDate.toISOString()),

          // Reviews data
          supabase
            .from('reviews')
            .select(`
              rating,
              created_at,
              products!inner (vendor_id)
            `)
            .eq('products.vendor_id', vendorId)
            .eq('status', 'approved')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
        ]);

        const analytics = {
          sales: salesData.data || [],
          products: productData.data || [],
          reviews: reviewData.data || [],
          timeRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        };

        // Cache the result
        setCache(cacheKey, analytics, { ttl: 10 * 60 * 1000 });

        return analytics;
      },
      enabled: enabled && !!vendorId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
    });
  };

  return {
    useOptimizedProducts,
    useOptimizedOrders,
    useOptimizedVendorAnalytics,
  };
}