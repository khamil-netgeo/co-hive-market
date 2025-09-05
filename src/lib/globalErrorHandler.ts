import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GlobalErrorContext {
  source: 'unhandledRejection' | 'error' | 'resource' | 'api' | 'manual';
  url?: string;
  line?: number;
  column?: number;
  filename?: string;
  stack?: string;
  userId?: string;
}

class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private isInitialized = false;

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  initialize() {
    if (this.isInitialized) return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Handle JavaScript errors
    window.addEventListener('error', this.handleError);

    // Handle resource loading errors
    window.addEventListener('error', this.handleResourceError, true);

    this.isInitialized = true;
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    this.logError({
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      source: 'unhandledRejection'
    });

    // Don't show toast for network errors in development
    if (process.env.NODE_ENV === 'production' || !errorMessage.includes('fetch')) {
      toast.error("An unexpected error occurred", {
        description: "The issue has been reported automatically."
      });
    }

    // Prevent the default browser error handling
    event.preventDefault();
  };

  private handleError = (event: ErrorEvent) => {
    this.logError({
      message: event.message,
      stack: event.error?.stack,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      source: 'error'
    });

    if (process.env.NODE_ENV === 'production') {
      toast.error("A JavaScript error occurred", {
        description: "Please refresh the page if issues persist."
      });
    }
  };

  private handleResourceError = (event: Event) => {
    const target = event.target as HTMLElement;
    if (target && target.tagName) {
      const resourceUrl = (target as any).src || (target as any).href;
      
      this.logError({
        message: `Failed to load resource: ${resourceUrl}`,
        source: 'resource',
        url: resourceUrl
      });

      // Don't show toast for resource errors, they're usually handled by the UI
    }
  };

  async logError(context: {
    message: string;
    stack?: string;
    filename?: string;
    line?: number;
    column?: number;
    source: GlobalErrorContext['source'];
    url?: string;
  }) {
    try {
      const errorId = `global_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await supabase.functions.invoke('log-audit', {
        body: {
          action: 'GLOBAL_ERROR',
          entity_type: 'global_error',
          entity_id: errorId,
          metadata: {
            error_message: context.message,
            error_stack: context.stack,
            filename: context.filename,
            line: context.line,
            column: context.column,
            source: context.source,
            resource_url: context.url,
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (loggingError) {
      console.error('Failed to log global error:', loggingError);
    }
  }

  // Manual error reporting method
  reportError(error: Error, context?: Partial<GlobalErrorContext>) {
    this.logError({
      message: error.message,
      stack: error.stack,
      source: context?.source || 'manual',
      ...context
    });
  }

  destroy() {
    if (!this.isInitialized) return;

    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleError);
    window.removeEventListener('error', this.handleResourceError, true);
    
    this.isInitialized = false;
  }
}

// Initialize global error handler
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  globalErrorHandler.initialize();
}