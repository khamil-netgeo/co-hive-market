import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorFallbackProps {
  error?: Error;
  errorId?: string;
  resetError?: () => void;
  showDetails?: boolean;
  title?: string;
  description?: string;
}

/**
 * Reusable error fallback component with multiple recovery options
 */
export function ErrorFallback({ 
  error, 
  errorId, 
  resetError, 
  showDetails = false,
  title = "Something went wrong",
  description = "We encountered an unexpected error. You can try refreshing or go back to the homepage."
}: ErrorFallbackProps) {
  const handleReportError = () => {
    const subject = encodeURIComponent(`Error Report: ${error?.message || 'Unknown Error'}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Error: ${error?.message}
Stack: ${error?.stack}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
`);
    window.open(`mailto:support@coopmarket.com?subject=${subject}&body=${body}`);
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorId && (
            <Alert>
              <AlertDescription className="text-xs font-mono">
                Error ID: {errorId}
              </AlertDescription>
            </Alert>
          )}

          {showDetails && error && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground mb-2">
                Technical Details
              </summary>
              <div className="bg-muted p-3 rounded font-mono text-xs break-all">
                <div className="mb-2"><strong>Message:</strong> {error.message}</div>
                {error.stack && (
                  <div><strong>Stack:</strong><br />{error.stack}</div>
                )}
              </div>
            </details>
          )}

          <div className="flex flex-col gap-2">
            {resetError && (
              <Button onClick={resetError} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button onClick={handleRefresh} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Button onClick={handleReportError} variant="ghost" size="sm" className="w-full">
              <Bug className="w-4 h-4 mr-2" />
              Report Error
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}