import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useProductionLogging } from "./useProductionLogging";

export interface ErrorContext {
  operation?: string;
  component?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface UseErrorHandlerReturn {
  error: Error | null;
  isError: boolean;
  clearError: () => void;
  handleError: (error: Error, context?: ErrorContext) => void;
  handleAsyncError: <T>(
    asyncOperation: () => Promise<T>,
    context?: ErrorContext
  ) => Promise<T | null>;
}

/**
 * Enhanced error handling hook with logging and user feedback
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<Error | null>(null);
  const { error: logError } = useProductionLogging();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getUserFriendlyMessage = useCallback((error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return "Network error. Please check your connection and try again.";
    }
    if (message.includes('unauthorized') || message.includes('403')) {
      return "You don't have permission to perform this action.";
    }
    if (message.includes('not found') || message.includes('404')) {
      return "The requested resource was not found.";
    }
    if (message.includes('timeout')) {
      return "The request timed out. Please try again.";
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return "Please check your input and try again.";
    }
    if (message.includes('rate limit')) {
      return "Too many requests. Please wait a moment and try again.";
    }
    
    // Default friendly message
    return "Something went wrong. Please try again.";
  }, []);

  const handleError = useCallback((error: Error, context?: ErrorContext) => {
    setError(error);
    
    // Log error for monitoring
    logError(
      `Error in ${context?.operation || 'unknown operation'}`,
      context?.component || 'unknown_component',
      {
        error_message: error.message,
        error_stack: error.stack,
        user_id: context?.userId,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        ...context?.metadata
      }
    );

    // Show user-friendly toast
    const friendlyMessage = getUserFriendlyMessage(error);
    toast.error(friendlyMessage, {
      description: process.env.NODE_ENV === 'development' ? error.message : undefined,
      action: {
        label: "Dismiss",
        onClick: clearError
      }
    });
  }, [logError, getUserFriendlyMessage, clearError]);

  const handleAsyncError = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | null> => {
    try {
      const result = await asyncOperation();
      clearError(); // Clear any previous errors on success
      return result;
    } catch (error) {
      handleError(error as Error, context);
      return null;
    }
  }, [handleError, clearError]);

  return {
    error,
    isError: !!error,
    clearError,
    handleError,
    handleAsyncError
  };
}