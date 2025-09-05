import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
  persistToLocalStorage?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Advanced caching hook with TTL, local storage persistence, and stale-while-revalidate
 */
export function useCaching() {
  const queryClient = useQueryClient();

  const setCache = useCallback(<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ) => {
    const { ttl = 300000, persistToLocalStorage = false } = options; // Default 5 minutes TTL
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Set in React Query cache
    queryClient.setQueryData([key], data);

    // Optionally persist to localStorage
    if (persistToLocalStorage) {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      } catch (error) {
        console.warn('Failed to persist cache to localStorage:', error);
      }
    }
  }, [queryClient]);

  const getCache = useCallback(<T>(
    key: string,
    options: CacheOptions = {}
  ): T | null => {
    const { persistToLocalStorage = false, staleWhileRevalidate = false } = options;

    // Try React Query cache first
    const queryData = queryClient.getQueryData<T>([key]);
    if (queryData) return queryData;

    // Try localStorage if enabled
    if (persistToLocalStorage) {
      try {
        const cached = localStorage.getItem(`cache_${key}`);
        if (cached) {
          const entry: CacheEntry<T> = JSON.parse(cached);
          const isExpired = Date.now() - entry.timestamp > entry.ttl;
          
          if (!isExpired || staleWhileRevalidate) {
            return entry.data;
          }
          
          if (isExpired) {
            localStorage.removeItem(`cache_${key}`);
          }
        }
      } catch (error) {
        console.warn('Failed to retrieve cache from localStorage:', error);
      }
    }

    return null;
  }, [queryClient]);

  const invalidateCache = useCallback((key: string) => {
    queryClient.invalidateQueries({ queryKey: [key] });
    localStorage.removeItem(`cache_${key}`);
  }, [queryClient]);

  const clearAllCache = useCallback(() => {
    queryClient.clear();
    
    // Clear localStorage cache entries
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }, [queryClient]);

  return {
    setCache,
    getCache,
    invalidateCache,
    clearAllCache,
  };
}

/**
 * Hook for cached API calls with automatic retry and error recovery
 */
export function useCachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: CacheOptions & {
    refetchInterval?: number;
    enabled?: boolean;
  } = {}
) {
  const {
    ttl = 300000,
    staleWhileRevalidate = true,
    persistToLocalStorage = false,
    refetchInterval,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: [key],
    queryFn,
    staleTime: staleWhileRevalidate ? ttl : 0,
    gcTime: ttl * 2, // Keep in cache for twice the TTL
    refetchInterval,
    enabled,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}