import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useProductionLogging } from "./useProductionLogging";

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  retryCondition?: (error: Error) => boolean;
}

interface UseRetryOperationReturn {
  isRetrying: boolean;
  retryCount: number;
  retry: <T>(
    operation: () => Promise<T>,
    config?: RetryConfig
  ) => Promise<T>;
  reset: () => void;
}

/**
 * Hook for handling retry operations with configurable backoff
 */
export function useRetryOperation(): UseRetryOperationReturn {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { info, error: logError } = useProductionLogging();

  const shouldRetry = useCallback((error: Error, config?: RetryConfig): boolean => {
    // Don't retry certain types of errors
    const nonRetryableErrors = [
      'unauthorized',
      'forbidden',
      'not found',
      'validation',
      'bad request'
    ];

    const errorMessage = error.message.toLowerCase();
    if (nonRetryableErrors.some(err => errorMessage.includes(err))) {
      return false;
    }

    // Use custom retry condition if provided
    if (config?.retryCondition) {
      return config.retryCondition(error);
    }

    return true;
  }, []);

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> => {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      exponentialBackoff = true
    } = config;

    setIsRetrying(true);
    let currentRetryCount = 0;
    let lastError: Error;

    const attemptOperation = async (): Promise<T> => {
      try {
        const result = await operation();
        
        if (currentRetryCount > 0) {
          info(
            `Operation succeeded after ${currentRetryCount} retries`,
            'retry_operation',
            { retry_count: currentRetryCount }
          );
        }
        
        setRetryCount(0);
        setIsRetrying(false);
        return result;
      } catch (error) {
        lastError = error as Error;
        currentRetryCount++;
        setRetryCount(currentRetryCount);

        // Check if we should retry
        if (currentRetryCount >= maxRetries || !shouldRetry(lastError, config)) {
          setIsRetrying(false);
          
          logError(
            `Operation failed after ${currentRetryCount} attempts`,
            'retry_operation',
            {
              error_message: lastError.message,
              retry_count: currentRetryCount,
              max_retries: maxRetries
            }
          );
          
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = exponentialBackoff 
          ? retryDelay * Math.pow(2, currentRetryCount - 1)
          : retryDelay;

        info(
          `Retrying operation (${currentRetryCount}/${maxRetries})`,
          'retry_operation',
          {
            retry_count: currentRetryCount,
            delay_ms: delay,
            error_message: lastError.message
          }
        );

        toast.info(`Retrying... (${currentRetryCount}/${maxRetries})`, {
          description: `Retrying in ${delay / 1000} seconds`,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptOperation();
      }
    };

    return attemptOperation();
  }, [shouldRetry, info, logError]);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
  }, []);

  return {
    isRetrying,
    retryCount,
    retry,
    reset
  };
}