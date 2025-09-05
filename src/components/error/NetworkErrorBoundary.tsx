import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NetworkErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

/**
 * Network-aware error boundary that handles connection issues
 */
export function NetworkErrorBoundary({ children, onRetry }: NetworkErrorBoundaryProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show offline message if already offline
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (isOnline && onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  if (showOfflineMessage && !isOnline) {
    return (
      <div className="min-h-[300px] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-muted-foreground" />
            </div>
            <CardTitle>You're Offline</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Please check your internet connection and try again.
            </p>
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {!isOnline && (
        <Alert className="mb-4 border-warning bg-warning/10">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're currently offline. Some features may not work properly.
          </AlertDescription>
        </Alert>
      )}
      <div className={!isOnline ? "opacity-75 pointer-events-none" : ""}>
        {children}
      </div>
    </>
  );
}