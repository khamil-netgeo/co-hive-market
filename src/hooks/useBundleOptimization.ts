import { lazy } from 'react';
import { useProductionLogging } from './useProductionLogging';

/**
 * Bundle optimization utilities for code splitting and dynamic imports
 */
export const useBundleOptimization = () => {
  // Lazy load heavy components (simplified to avoid type issues)
  const LazyComponents = {
    // These would be properly typed in a production environment
  };

  // Dynamic imports for utilities
  const loadUtility = async (utilityName: string) => {
    switch (utilityName) {
      case 'recharts':
        return import('recharts');
      default:
        throw new Error(`Unknown utility: ${utilityName}`);
    }
  };

  // Preload critical routes
  const preloadRoute = (routeName: string) => {
    switch (routeName) {
      case 'catalog':
        import('@/pages/Catalog');
        import('@/pages/ProductDetail');
        break;
      case 'checkout':
        import('@/pages/CheckoutNew');
        import('@/hooks/useOrderWorkflow');
        break;
      case 'vendor':
        import('@/pages/vendor/VendorDashboard');
        import('@/pages/vendor/VendorProducts');
        break;
      case 'orders':
        import('@/pages/Orders');
        import('@/pages/OrderTracker');
        break;
      default:
        console.warn(`Unknown route for preloading: ${routeName}`);
    }
  };

  // Resource hints for better performance
  const addResourceHints = () => {
    if (typeof window === 'undefined') return;

    const head = document.head;

    // Preconnect to external services
    const preconnects = [
      'https://pxuqymgvmyuomafjgjuz.supabase.co',
      'https://fonts.googleapis.com',
      'https://api.stripe.com',
    ];

    preconnects.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      head.appendChild(link);
    });

    // DNS prefetch for other resources
    const dnsPrefetch = [
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
    ];

    dnsPrefetch.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = url;
      head.appendChild(link);
    });
  };

  return {
    LazyComponents,
    loadUtility,
    preloadRoute,
    addResourceHints,
  };
};

/**
 * Hook for managing service worker and PWA optimization
 */
export const usePWAOptimization = () => {
  const { info, error } = useProductionLogging();
  
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        info('SW registered: ', 'pwa', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available
                if (confirm('New version available! Refresh to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      } catch (error) {
        error('SW registration failed: ', 'pwa', error);
      }
    }
  };

  const enableOfflineMode = () => {
    window.addEventListener('online', () => {
      document.body.classList.remove('offline');
    });

    window.addEventListener('offline', () => {
      document.body.classList.add('offline');
    });
  };

  const optimizeForMobile = () => {
    // Viewport meta tag optimization
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no'
      );
    }

    // Disable touch callout on iOS
    (document.body.style as any).webkitTouchCallout = 'none';
    
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute(
            'content',
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
          );
        }
      });

      input.addEventListener('blur', () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute(
            'content',
            'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no'
          );
        }
      });
    });
  };

  return {
    registerServiceWorker,
    enableOfflineMode,
    optimizeForMobile,
  };
};