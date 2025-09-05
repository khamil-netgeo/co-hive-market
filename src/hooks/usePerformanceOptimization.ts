import { useCallback, useMemo, useRef, useEffect } from 'react';
import { debounce, throttle } from 'lodash';

/**
 * Performance optimization hook with debouncing, throttling, and memoization utilities
 */
export function usePerformanceOptimization() {
  const debounceRef = useRef<Map<string, any>>(new Map());
  const throttleRef = useRef<Map<string, any>>(new Map());

  const createDebounced = useCallback((
    key: string,
    fn: (...args: any[]) => void,
    delay: number = 300
  ) => {
    if (!debounceRef.current.has(key)) {
      debounceRef.current.set(key, debounce(fn, delay));
    }
    return debounceRef.current.get(key);
  }, []);

  const createThrottled = useCallback((
    key: string,
    fn: (...args: any[]) => void,
    delay: number = 100
  ) => {
    if (!throttleRef.current.has(key)) {
      throttleRef.current.set(key, throttle(fn, delay));
    }
    return throttleRef.current.get(key);
  }, []);

  const memoize = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    deps: React.DependencyList
  ): T => {
    return useMemo(() => fn, deps) as T;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debounceRef.current.forEach(fn => fn.cancel?.());
      throttleRef.current.forEach(fn => fn.cancel?.());
      debounceRef.current.clear();
      throttleRef.current.clear();
    };
  }, []);

  return {
    createDebounced,
    createThrottled,
    memoize,
  };
}

/**
 * Hook for optimizing heavy computations with Web Workers
 */
export function useWebWorker() {
  const workerRef = useRef<Worker | null>(null);

  const runWorker = useCallback(<T, R>(
    workerScript: string,
    data: T
  ): Promise<R> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        try {
          const blob = new Blob([workerScript], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          workerRef.current = new Worker(workerUrl);
          URL.revokeObjectURL(workerUrl);
        } catch (error) {
          reject(error);
          return;
        }
      }

      const handleMessage = (e: MessageEvent) => {
        workerRef.current?.removeEventListener('message', handleMessage);
        workerRef.current?.removeEventListener('error', handleError);
        resolve(e.data);
      };

      const handleError = (error: ErrorEvent) => {
        workerRef.current?.removeEventListener('message', handleMessage);
        workerRef.current?.removeEventListener('error', handleError);
        reject(error);
      };

      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.addEventListener('error', handleError);
      workerRef.current.postMessage(data);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return { runWorker };
}

/**
 * Hook for managing viewport-based optimizations
 */
export function useViewportOptimization() {
  const intersectionRef = useRef<IntersectionObserver | null>(null);

  const observeElement = useCallback((
    element: Element,
    callback: (isVisible: boolean) => void,
    options: IntersectionObserverInit = {}
  ) => {
    if (!intersectionRef.current) {
      intersectionRef.current = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const element = entry.target;
          const callback = (element as any)._visibilityCallback;
          if (callback) {
            callback(entry.isIntersecting);
          }
        });
      }, {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      });
    }

    (element as any)._visibilityCallback = callback;
    intersectionRef.current.observe(element);

    return () => {
      if (intersectionRef.current) {
        intersectionRef.current.unobserve(element);
        delete (element as any)._visibilityCallback;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (intersectionRef.current) {
        intersectionRef.current.disconnect();
        intersectionRef.current = null;
      }
    };
  }, []);

  return { observeElement };
}