import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoadingErrorStateProps {
  error?: Error | string;
  onRetry?: () => void;
  title?: string;
  description?: string;
  compact?: boolean;
}

/**
 * Reusable loading error state component
 */
export function LoadingErrorState({
  error,
  onRetry,
  title = "Failed to load",
  description,
  compact = false
}: LoadingErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error;
  const displayDescription = description || errorMessage || "Something went wrong while loading this content.";

  if (compact) {
    return (
      <Alert className="border-destructive/50 bg-destructive/5">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{displayDescription}</span>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="ml-2 h-auto p-1"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-destructive" />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground max-w-md">{displayDescription}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}