import { useState, useCallback } from "react";
import { toast } from "sonner";

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
}

/**
 * Hook for handling error recovery and retry mechanisms
 * Provides automatic retry with exponential backoff
 */
export function useErrorRecovery() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> => {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      exponentialBackoff = true,
    } = options;

    setIsRetrying(true);
    let currentRetryCount = 0;

    const attemptOperation = async (): Promise<T> => {
      try {
        const result = await operation();
        setRetryCount(0);
        setIsRetrying(false);
        return result;
      } catch (error: any) {
        currentRetryCount++;
        setRetryCount(currentRetryCount);

        if (currentRetryCount >= maxRetries) {
          setIsRetrying(false);
          throw new Error(`Operation failed after ${maxRetries} attempts: ${error.message}`);
        }

        const delay = exponentialBackoff 
          ? retryDelay * Math.pow(2, currentRetryCount - 1)
          : retryDelay;

        toast.info(`Retry ${currentRetryCount}/${maxRetries}`, {
          description: `Retrying in ${delay / 1000} seconds...`,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptOperation();
      }
    };

    return attemptOperation();
  }, []);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
  }, []);

  return {
    retry,
    reset,
    isRetrying,
    retryCount,
  };
}