import React, { Component, ReactNode } from "react";
import { ErrorFallback } from "./ErrorFallback";
import { useProductionLogging } from "@/hooks/useProductionLogging";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

/**
 * Section-specific error boundary for handling errors in specific app sections
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `section_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with section context
    this.logSectionError(error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  private async logSectionError(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      await supabase.functions.invoke('log-audit', {
        body: {
          action: 'SECTION_ERROR_BOUNDARY',
          entity_type: 'react_section_error',
          entity_id: this.state.errorId,
          metadata: {
            section_name: this.props.sectionName,
            error_message: error.message,
            error_stack: error.stack,
            component_stack: errorInfo.componentStack,
            url: window.location.href,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (loggingError) {
      console.error('Failed to log section error:', loggingError);
    }
  }

  private resetError = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error || undefined}
          errorId={this.state.errorId || undefined}
          resetError={this.resetError}
          showDetails={this.props.showDetails}
          title={`Error in ${this.props.sectionName || 'Section'}`}
          description="This section encountered an error. You can try reloading it or continue using other parts of the app."
        />
      );
    }

    return this.props.children;
  }
}

// Hook wrapper for easier use in functional components
export function withSectionErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  sectionName?: string,
  showDetails?: boolean
) {
  return function WrappedComponent(props: P) {
    return (
      <SectionErrorBoundary sectionName={sectionName} showDetails={showDetails}>
        <Component {...props} />
      </SectionErrorBoundary>
    );
  };
}