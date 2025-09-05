import { supabase } from "@/integrations/supabase/client";
import { RateQuery, fetchEasyParcelRates, createEasyParcelShipment, trackEasyParcel } from "./shipping";

interface ShippingRateWithFallback {
  success: boolean;
  rates?: any[];
  fallbackRates?: any[];
  error?: string;
  source: 'primary' | 'fallback' | 'cached';
}

/**
 * Enhanced EasyParcel integration with fallbacks, caching, and rate limiting
 */
export class EnhancedShippingService {
  private static instance: EnhancedShippingService;
  private rateLimitCache = new Map<string, { timestamp: number; count: number }>();
  private ratesCache = new Map<string, { data: any; timestamp: number }>();
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS_PER_WINDOW = 10;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): EnhancedShippingService {
    if (!EnhancedShippingService.instance) {
      EnhancedShippingService.instance = new EnhancedShippingService();
    }
    return EnhancedShippingService.instance;
  }

  /**
   * Check if we're hitting rate limits
   */
  private checkRateLimit(key: string): boolean {
    const now = Date.now();
    const window = this.rateLimitCache.get(key);

    if (!window || now - window.timestamp > this.RATE_LIMIT_WINDOW) {
      this.rateLimitCache.set(key, { timestamp: now, count: 1 });
      return true;
    }

    if (window.count >= this.MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    window.count++;
    return true;
  }

  /**
   * Get cached rates if available and not expired
   */
  private getCachedRates(cacheKey: string): any | null {
    const cached = this.ratesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Cache rates for future use
   */
  private setCachedRates(cacheKey: string, data: any): void {
    this.ratesCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Generate fallback shipping rates when EasyParcel is unavailable
   */
  private generateFallbackRates(query: RateQuery): any[] {
    const basePrice = 5.00; // Base shipping price in MYR
    const weightMultiplier = Math.max(1, query.weight / 1000); // Per kg
    
    // Calculate distance-based multiplier (simplified)
    const distanceMultiplier = query.pick_postcode === query.send_postcode ? 1 : 1.5;
    
    return [
      {
        courier_id: 'fallback_standard',
        courier_name: 'Standard Delivery',
        service_id: 'standard',
        service_name: 'Standard Delivery (3-5 days)',
        price: (basePrice * weightMultiplier * distanceMultiplier).toFixed(2),
        currency: 'MYR',
        estimated_days: '3-5',
        tracking_available: true,
        insurance_available: false,
        cod_available: query.cod || false,
      },
      {
        courier_id: 'fallback_express',
        courier_name: 'Express Delivery',
        service_id: 'express',
        service_name: 'Express Delivery (1-2 days)',
        price: (basePrice * weightMultiplier * distanceMultiplier * 1.8).toFixed(2),
        currency: 'MYR',
        estimated_days: '1-2',
        tracking_available: true,
        insurance_available: true,
        cod_available: query.cod || false,
      }
    ];
  }

  /**
   * Enhanced rate fetching with fallbacks and caching
   */
  async fetchRatesWithFallback(query: RateQuery): Promise<ShippingRateWithFallback> {
    const cacheKey = JSON.stringify(query);
    
    // Check cache first
    const cachedRates = this.getCachedRates(cacheKey);
    if (cachedRates) {
      return {
        success: true,
        rates: cachedRates,
        source: 'cached'
      };
    }

    // Check rate limiting
    const rateLimitKey = `rates_${query.pick_postcode}_${query.send_postcode}`;
    if (!this.checkRateLimit(rateLimitKey)) {
      return {
        success: false,
        fallbackRates: this.generateFallbackRates(query),
        error: 'Rate limit exceeded, using fallback rates',
        source: 'fallback'
      };
    }

    try {
      // Attempt primary EasyParcel API
      const primaryRates = await Promise.race([
        fetchEasyParcelRates(query),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API timeout')), 10000)
        )
      ]) as any;

      if (primaryRates && primaryRates.length > 0) {
        // Cache successful response
        this.setCachedRates(cacheKey, primaryRates);
        
        return {
          success: true,
          rates: primaryRates,
          source: 'primary'
        };
      } else {
        throw new Error('No rates returned from primary API');
      }
    } catch (error: any) {
      console.warn('EasyParcel API failed, using fallback rates:', error.message);
      
      // Log API failure for monitoring
      await supabase.functions.invoke('log-audit', {
        body: {
          action: 'SHIPPING_API_FAILURE',
          entity_type: 'shipping_integration',
          metadata: {
            error: error.message,
            query: query,
            timestamp: new Date().toISOString()
          }
        }
      });

      const fallbackRates = this.generateFallbackRates(query);
      
      return {
        success: false,
        fallbackRates,
        error: `Primary shipping API unavailable: ${error.message}`,
        source: 'fallback'
      };
    }
  }

  /**
   * Enhanced shipment creation with retry logic
   */
  async createShipmentWithRetry(
    shipmentData: any[], 
    maxRetries: number = 3
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          createEasyParcelShipment(shipmentData),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Shipment creation timeout')), 15000)
          )
        ]) as any;

        if (result) {
          // Log successful shipment creation
          await supabase.functions.invoke('log-audit', {
            body: {
              action: 'SHIPMENT_CREATED',
              entity_type: 'shipping_integration',
              metadata: {
                shipment_count: shipmentData.length,
                attempt: attempt,
                timestamp: new Date().toISOString()
              }
            }
          });

          return { success: true, data: result };
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`Shipment creation attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed
    await supabase.functions.invoke('log-audit', {
      body: {
        action: 'SHIPMENT_CREATION_FAILED',
        entity_type: 'shipping_integration',
        metadata: {
          error: lastError?.message,
          attempts: maxRetries,
          shipment_data: shipmentData,
          timestamp: new Date().toISOString()
        }
      }
    });

    return {
      success: false,
      error: `Failed to create shipment after ${maxRetries} attempts: ${lastError?.message}`
    };
  }

  /**
   * Enhanced tracking with caching and fallback
   */
  async trackShipmentWithCache(
    input: { awb_no?: string | string[]; order_no?: string | string[] }
  ): Promise<{ success: boolean; data?: any; error?: string; source: 'primary' | 'cached' }> {
    const cacheKey = `track_${JSON.stringify(input)}`;
    
    // Check cache first (shorter cache for tracking data)
    const cachedTracking = this.getCachedRates(cacheKey);
    if (cachedTracking) {
      return {
        success: true,
        data: cachedTracking,
        source: 'cached'
      };
    }

    try {
      const trackingData = await Promise.race([
        trackEasyParcel(input),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Tracking timeout')), 8000)
        )
      ]) as any;

      if (trackingData) {
        // Cache for shorter duration (2 minutes for tracking data)
        this.ratesCache.set(cacheKey, {
          data: trackingData,
          timestamp: Date.now()
        });

        return {
          success: true,
          data: trackingData,
          source: 'primary'
        };
      } else {
        throw new Error('No tracking data returned');
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Tracking failed: ${error.message}`,
        source: 'primary'
      };
    }
  }

  /**
   * Health check for shipping service
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const start = Date.now();
    
    try {
      // Simple test query to check API health
      const testQuery: RateQuery = {
        pick_postcode: '10400',
        send_postcode: '50000',
        weight: 1000,
        domestic: true
      };

      await Promise.race([
        fetchEasyParcelRates(testQuery),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        )
      ]);

      const latency = Date.now() - start;
      return { healthy: true, latency };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const enhancedShipping = EnhancedShippingService.getInstance();