import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { SectionErrorBoundary } from "./SectionErrorBoundary";
import { LoadingErrorState } from "./LoadingErrorState";
import { ReactNode } from "react";

interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
}

/**
 * Error boundary specifically for React Query errors with automatic reset capability
 */
export function QueryErrorBoundary({ 
  children, 
  fallback,
  sectionName = "Data Loading"
}: QueryErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <SectionErrorBoundary
      sectionName={sectionName}
      fallback={
        fallback || (
          <LoadingErrorState
            title="Failed to load data"
            description="There was an error loading the requested data."
            onRetry={reset}
          />
        )
      }
      onError={(error, errorInfo) => {
        // Log query-specific errors
        console.error('Query error:', error, errorInfo);
        
        // Reset React Query error boundary on error
        setTimeout(reset, 100);
      }}
    >
      {children}
    </SectionErrorBoundary>
  );
}