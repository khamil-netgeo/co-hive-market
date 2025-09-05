import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProductionLogging } from './useProductionLogging';

interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  category: string;
  timestamp: string;
  resolved?: boolean;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  threshold: number;
}

export function useSystemMonitoring() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { info, warn, error } = useProductionLogging();

  // Performance monitoring
  const measurePerformance = useCallback(async () => {
    try {
      const startTime = performance.now();
      
      // Test database connectivity and performance
      const dbStart = performance.now();
      const { error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      const dbEnd = performance.now();
      
      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Test storage connectivity
      const storageStart = performance.now();
      const { error: storageError } = await supabase.storage
        .from('avatars')
        .list('', { limit: 1 });
      const storageEnd = performance.now();

      if (storageError) {
        warn('Storage connectivity issue detected', 'monitoring', storageError);
      }

      // Calculate metrics
      const newMetrics: PerformanceMetric[] = [
        {
          name: 'Database Response Time',
          value: Math.round(dbEnd - dbStart),
          unit: 'ms',
          status: (dbEnd - dbStart) < 100 ? 'good' : (dbEnd - dbStart) < 500 ? 'warning' : 'critical',
          threshold: 100
        },
        {
          name: 'Storage Response Time',
          value: Math.round(storageEnd - storageStart),
          unit: 'ms',
          status: (storageEnd - storageStart) < 200 ? 'good' : (storageEnd - storageStart) < 1000 ? 'warning' : 'critical',
          threshold: 200
        },
        {
          name: 'Memory Usage',
          value: Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0),
          unit: 'MB',
          status: 'good', // Simple check for now
          threshold: 100
        }
      ];

      // Web Vitals (if available)
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (entry.entryType === 'largest-contentful-paint') {
                newMetrics.push({
                  name: 'Largest Contentful Paint',
                  value: Math.round(entry.startTime),
                  unit: 'ms',
                  status: entry.startTime < 2500 ? 'good' : entry.startTime < 4000 ? 'warning' : 'critical',
                  threshold: 2500
                });
              }
            });
          });

          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Disconnect after 5 seconds
          setTimeout(() => observer.disconnect(), 5000);
        } catch (observerError) {
          // Observer not available in this browser
        }
      }

      setMetrics(newMetrics);

      // Generate alerts for critical metrics
      const criticalMetrics = newMetrics.filter(m => m.status === 'critical');
      if (criticalMetrics.length > 0) {
        const newAlerts = criticalMetrics.map(metric => ({
          id: Date.now().toString() + metric.name,
          level: 'error' as const,
          message: `${metric.name} is critical: ${metric.value}${metric.unit} (threshold: ${metric.threshold}${metric.unit})`,
          category: 'performance',
          timestamp: new Date().toISOString(),
          resolved: false
        }));
        
        setAlerts(prev => [...prev, ...newAlerts]);
        
        // Log critical performance issues
        criticalMetrics.forEach(metric => {
          error(`Critical performance issue: ${metric.name}`, 'monitoring', {
            value: metric.value,
            threshold: metric.threshold,
            unit: metric.unit
          });
        });
      }

      info('Performance monitoring completed', 'monitoring', {
        metrics: newMetrics.length,
        alerts: criticalMetrics.length
      });

    } catch (error) {
      const alert: SystemAlert = {
        id: Date.now().toString(),
        level: 'error',
        message: `System monitoring failed: ${error.message}`,
        category: 'system',
        timestamp: new Date().toISOString(),
        resolved: false
      };
      
      setAlerts(prev => [...prev, alert]);
      error('System monitoring failed', 'monitoring', error);
    }
  }, [info, warn, error]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    info('System monitoring started', 'monitoring');

    // Initial measurement
    measurePerformance();

    // Set up periodic monitoring
    const interval = setInterval(measurePerformance, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
      info('System monitoring stopped', 'monitoring');
    };
  }, [isMonitoring, measurePerformance, info]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    info('System monitoring stopped manually', 'monitoring');
  }, [info]);

  // Resolve alert
  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
    info('Alert resolved', 'monitoring', { alertId });
  }, [info]);

  // Clear all resolved alerts
  const clearResolvedAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(alert => !alert.resolved));
    info('Cleared resolved alerts', 'monitoring');
  }, [info]);

  // Monitor error rates from production logging
  const checkErrorRates = useCallback(async () => {
    try {
      // Get error logs from last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, created_at')
        .gte('created_at', oneHourAgo)
        .like('action', 'LOG_%');

      if (error) throw error;

      const totalLogs = data?.length || 0;
      const errorLogs = data?.filter(log => log.action.includes('ERROR')).length || 0;
      const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;

      // Alert if error rate is too high
      if (errorRate > 5) { // More than 5% error rate
        const alert: SystemAlert = {
          id: `error-rate-${Date.now()}`,
          level: 'warning',
          message: `High error rate detected: ${errorRate.toFixed(2)}% (${errorLogs}/${totalLogs} logs)`,
          category: 'errors',
          timestamp: new Date().toISOString(),
          resolved: false
        };
        
        setAlerts(prev => [...prev, alert]);
        warn('High error rate detected', 'monitoring', {
          errorRate,
          errorLogs,
          totalLogs
        });
      }

    } catch (error) {
      warn('Failed to check error rates', 'monitoring', error);
    }
  }, [warn]);

  // Auto-start monitoring on component mount
  useEffect(() => {
    const cleanup = startMonitoring();
    const errorCheckInterval = setInterval(checkErrorRates, 60000); // Check every minute

    return () => {
      cleanup?.();
      clearInterval(errorCheckInterval);
    };
  }, []); // Empty dependency array for mount-only effect

  return {
    alerts: alerts.filter(alert => !alert.resolved),
    resolvedAlerts: alerts.filter(alert => alert.resolved),
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resolveAlert,
    clearResolvedAlerts,
    measurePerformance,
    checkErrorRates
  };
}