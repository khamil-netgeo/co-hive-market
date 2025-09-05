import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useProductionLogging } from './useProductionLogging';

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  retryCondition?: (error: any) => boolean;
}

interface FallbackConfig<T> {
  fallbackValue?: T;
  fallbackFunction?: () => T | Promise<T>;
  showFallbackMessage?: boolean;
}

/**
 * Enhanced error handling with retry logic, fallbacks, and proper logging
 */
export function useEnhancedErrorHandling() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const logger = useProductionLogging();

  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      context?: string;
      retry?: RetryConfig;
      fallback?: FallbackConfig<T>;
      suppressToast?: boolean;
    } = {}
  ): Promise<T | null> => {
    const {
      context = 'Unknown operation',
      retry = {},
      fallback = {},
      suppressToast = false
    } = options;

    const {
      maxRetries = 3,
      retryDelay = 1000,
      exponentialBackoff = true,
      retryCondition = (error: any) => 
        error?.status >= 500 || 
        error?.code === 'NETWORK_ERROR' ||
        error?.message?.includes('timeout')
    } = retry;

    let currentAttempt = 0;
    
    const executeWithRetry = async (): Promise<T> => {
      try {
        const result = await operation();
        
        // Reset retry count on success
        if (currentAttempt > 0) {
          setRetryCount(0);
          setIsRetrying(false);
          await logger.info(`Operation succeeded after ${currentAttempt} retries`, context);
        }
        
        return result;
      } catch (error: any) {
        currentAttempt++;
        
        await logger.error(
          `Operation failed (attempt ${currentAttempt}/${maxRetries + 1})`,
          context,
          {
            error: error.message,
            stack: error.stack,
            attempt: currentAttempt
          }
        );

        // Check if we should retry
        const shouldRetry = currentAttempt <= maxRetries && 
                          retryCondition(error);

        if (shouldRetry) {
          setIsRetrying(true);
          setRetryCount(currentAttempt);
          
          const delay = exponentialBackoff 
            ? retryDelay * Math.pow(2, currentAttempt - 1)
            : retryDelay;

          if (!suppressToast) {
            toast.info(`Retrying... (${currentAttempt}/${maxRetries})`, {
              description: `Will retry in ${Math.ceil(delay / 1000)} seconds`,
            });
          }

          await new Promise(resolve => setTimeout(resolve, delay));
          return executeWithRetry();
        }

        // No more retries, handle fallback
        setIsRetrying(false);
        
        if (fallback.fallbackValue !== undefined) {
          await logger.warn(
            'Using fallback value due to operation failure',
            context,
            { fallbackUsed: true }
          );
          
          if (fallback.showFallbackMessage && !suppressToast) {
            toast.warning('Using cached data', {
              description: 'Unable to fetch latest data, showing cached version',
            });
          }
          
          return fallback.fallbackValue;
        }

        if (fallback.fallbackFunction) {
          try {
            const fallbackResult = await fallback.fallbackFunction();
            
            await logger.warn(
              'Used fallback function due to operation failure',
              context,
              { fallbackUsed: true }
            );
            
            if (fallback.showFallbackMessage && !suppressToast) {
              toast.warning('Using alternative method', {
                description: 'Primary method failed, using backup approach',
              });
            }
            
            return fallbackResult;
          } catch (fallbackError: any) {
            await logger.error(
              'Fallback function also failed',
              context,
              { fallbackError: fallbackError.message }
            );
          }
        }

        // Show user-friendly error message
        if (!suppressToast) {
          const userMessage = getUserFriendlyErrorMessage(error);
          toast.error('Operation failed', {
            description: userMessage,
            action: maxRetries > 0 ? {
              label: 'Retry',
              onClick: () => executeWithRetry(),
            } : undefined,
          });
        }

        throw error;
      }
    };

    try {
      return await executeWithRetry();
    } catch (error) {
      return null;
    }
  }, [logger]);

  const getUserFriendlyErrorMessage = (error: any): string => {
    if (error?.message?.includes('Network Error') || error?.code === 'NETWORK_ERROR') {
      return 'Please check your internet connection and try again.';
    }
    
    if (error?.status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    
    if (error?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    
    if (error?.status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (error?.status >= 500) {
      return 'A server error occurred. Our team has been notified.';
    }
    
    if (error?.message?.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }
    
    return error?.message || 'An unexpected error occurred.';
  };

  return {
    withErrorHandling,
    isRetrying,
    retryCount,
    getUserFriendlyErrorMessage
  };
}