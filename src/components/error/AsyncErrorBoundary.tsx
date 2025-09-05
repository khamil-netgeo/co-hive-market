import React, { Component, ReactNode } from "react";
import { ErrorFallback } from "./ErrorFallback";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  children: ReactNode;
  loading?: boolean;
  error?: Error | null;
  retry?: () => void;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  title?: string;
  description?: string;
}

/**
 * Error boundary specifically for async operations with loading states
 */
export function AsyncErrorBoundary({
  children,
  loading = false,
  error,
  retry,
  fallback,
  loadingFallback,
  title,
  description
}: Props) {
  if (loading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }

    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <ErrorFallback
        error={error}
        resetError={retry}
        title={title}
        description={description}
      />
    );
  }

  return <>{children}</>;
}