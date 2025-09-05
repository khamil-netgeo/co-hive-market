import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProductionLogging } from './useProductionLogging';

interface InventoryAlert {
  id: string;
  product_id: string;
  product_name: string;
  current_stock: number;
  threshold: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstocked';
  created_at: string;
}

interface InventorySettings {
  low_stock_threshold: number;
  out_of_stock_threshold: number;
  overstock_threshold: number;
  email_notifications: boolean;
  dashboard_notifications: boolean;
}

/**
 * Hook for managing inventory alerts and notifications
 */
export function useInventoryAlerts(vendorId?: string) {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [settings, setSettings] = useState<InventorySettings>({
    low_stock_threshold: 10,
    out_of_stock_threshold: 0,
    overstock_threshold: 1000,
    email_notifications: true,
    dashboard_notifications: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const logger = useProductionLogging();

  const checkInventoryLevels = useCallback(async () => {
    if (!vendorId) return;

    setIsLoading(true);
    try {
      // Get products with current inventory levels
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          product_inventory (
            stock_quantity,
            reserved_quantity,
            track_inventory
          )
        `)
        .eq('vendor_id', vendorId)
        .eq('status', 'active');

      if (error) throw error;

      const newAlerts: InventoryAlert[] = [];

      products?.forEach(product => {
        const inventory = product.product_inventory?.[0];
        
        if (!inventory?.track_inventory) return;

        const availableStock = (inventory.stock_quantity || 0) - (inventory.reserved_quantity || 0);
        
        // Check for different alert types
        if (availableStock <= settings.out_of_stock_threshold) {
          newAlerts.push({
            id: `${product.id}_out_of_stock`,
            product_id: product.id,
            product_name: product.name,
            current_stock: availableStock,
            threshold: settings.out_of_stock_threshold,
            alert_type: 'out_of_stock',
            created_at: new Date().toISOString(),
          });
        } else if (availableStock <= settings.low_stock_threshold) {
          newAlerts.push({
            id: `${product.id}_low_stock`,
            product_id: product.id,
            product_name: product.name,
            current_stock: availableStock,
            threshold: settings.low_stock_threshold,
            alert_type: 'low_stock',
            created_at: new Date().toISOString(),
          });
        } else if (availableStock >= settings.overstock_threshold) {
          newAlerts.push({
            id: `${product.id}_overstocked`,
            product_id: product.id,
            product_name: product.name,
            current_stock: availableStock,
            threshold: settings.overstock_threshold,
            alert_type: 'overstocked',
            created_at: new Date().toISOString(),
          });
        }
      });

      setAlerts(newAlerts);

      // Show notifications for critical alerts
      if (settings.dashboard_notifications) {
        const criticalAlerts = newAlerts.filter(alert => alert.alert_type === 'out_of_stock');
        const lowStockAlerts = newAlerts.filter(alert => alert.alert_type === 'low_stock');

        if (criticalAlerts.length > 0) {
          toast.error(`${criticalAlerts.length} products are out of stock!`, {
            description: 'Immediate attention required',
            action: {
              label: 'View Inventory',
              onClick: () => window.location.href = '/vendor/inventory',
            },
          });
        } else if (lowStockAlerts.length > 0) {
          toast.warning(`${lowStockAlerts.length} products are low on stock`, {
            description: 'Consider restocking soon',
            action: {
              label: 'View Inventory',
              onClick: () => window.location.href = '/vendor/inventory',
            },
          });
        }
      }

      // Send email notifications for critical alerts
      if (settings.email_notifications && newAlerts.some(alert => alert.alert_type === 'out_of_stock')) {
        await supabase.functions.invoke('send-notification', {
          body: {
            user_id: vendorId,
            type: 'inventory_alert',
            title: 'Inventory Alert: Products Out of Stock',
            message: `${newAlerts.filter(a => a.alert_type === 'out_of_stock').length} products are out of stock and need immediate attention.`,
            data: {
              alerts: newAlerts.filter(a => a.alert_type === 'out_of_stock').map(a => ({
                product_name: a.product_name,
                current_stock: a.current_stock
              }))
            }
          }
        });
      }

      await logger.info(
        `Inventory check completed: ${newAlerts.length} alerts found`,
        'inventory_monitoring',
        {
          vendor_id: vendorId,
          alerts_by_type: {
            out_of_stock: newAlerts.filter(a => a.alert_type === 'out_of_stock').length,
            low_stock: newAlerts.filter(a => a.alert_type === 'low_stock').length,
            overstocked: newAlerts.filter(a => a.alert_type === 'overstocked').length,
          }
        }
      );

    } catch (error: any) {
      await logger.error(
        'Failed to check inventory levels',
        'inventory_monitoring',
        { error: error.message, vendor_id: vendorId }
      );
      
      toast.error('Failed to check inventory levels', {
        description: 'Please try again or check your connection',
      });
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, settings, logger]);

  const updateSettings = useCallback(async (newSettings: Partial<InventorySettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // In a real app, save settings to database
      localStorage.setItem(`inventory_settings_${vendorId}`, JSON.stringify(updatedSettings));
      
      toast.success('Inventory alert settings updated');
    } catch (error: any) {
      await logger.error(
        'Failed to update inventory settings',
        'inventory_settings',
        { error: error.message, vendor_id: vendorId }
      );
      
      toast.error('Failed to update settings');
    }
  }, [settings, vendorId, logger]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const dismissAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Load settings on mount
  useEffect(() => {
    if (vendorId) {
      const savedSettings = localStorage.getItem(`inventory_settings_${vendorId}`);
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (error) {
          console.warn('Failed to load inventory settings from localStorage');
        }
      }
    }
  }, [vendorId]);

  // Set up periodic inventory checks (every 30 minutes)
  useEffect(() => {
    if (!vendorId) return;

    // Initial check
    checkInventoryLevels();

    // Set up interval for periodic checks
    const interval = setInterval(checkInventoryLevels, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [vendorId, checkInventoryLevels]);

  // Real-time monitoring for inventory changes
  useEffect(() => {
    if (!vendorId) return;

    const channel = supabase
      .channel(`inventory-alerts-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_inventory'
        },
        () => {
          // Recheck inventory levels when changes occur
          checkInventoryLevels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, checkInventoryLevels]);

  return {
    alerts,
    settings,
    isLoading,
    updateSettings,
    dismissAlert,
    dismissAllAlerts,
    recheckInventory: checkInventoryLevels,
  };
}