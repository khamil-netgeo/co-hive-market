import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './mobile.css'
import { registerSW } from 'virtual:pwa-register'
import { CartProvider } from '@/hooks/useCart'
import { CommunityProvider } from '@/context/CommunityContext'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"

// Initialize global error handling
import "@/lib/globalErrorHandler"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

// Remove forced dark mode - now handled by ThemeProvider

// Register PWA service worker (auto updates)
registerSW({ immediate: true })

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <CommunityProvider>
          <App />
          <Toaster />
        </CommunityProvider>
      </CartProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
