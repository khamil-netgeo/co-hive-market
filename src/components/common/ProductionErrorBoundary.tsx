import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

/**
 * Production-ready error boundary with enhanced error reporting and recovery
 */
export class ProductionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to production logging service
    this.logErrorToService(error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  private async logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Send to audit logging function
      await supabase.functions.invoke('log-audit', {
        body: {
          action: 'ERROR_BOUNDARY_TRIGGERED',
          entity_type: 'react_error',
          entity_id: this.state.errorId,
          metadata: {
            error_message: error.message,
            error_stack: error.stack,
            component_stack: errorInfo.componentStack,
            user_agent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            user_id: user?.id,
          }
        }
      });
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportError = () => {
    // In production, this could open a support ticket or feedback form
    const subject = encodeURIComponent(`Error Report: ${this.state.error?.message || 'Unknown Error'}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
URL: ${window.location.href}
Time: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
    `);
    
    window.open(`mailto:support@coopmart.local?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-lg">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. Our team has been automatically notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Development Details:</p>
                  <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-x-auto">
                    {this.state.error?.message}
                  </pre>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground text-center">
                Error ID: {this.state.errorId}
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  className="w-full"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                
                <Button 
                  onClick={this.handleReportError}
                  className="w-full"
                  variant="ghost"
                  size="sm"
                >
                  Report Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}