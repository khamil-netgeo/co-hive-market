import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { CartProvider } from '@/hooks/useCart'

// Remove forced dark mode - now handled by ThemeProvider

// Register PWA service worker (auto updates)
registerSW({ immediate: true })

createRoot(document.getElementById("root")!).render(
  <CartProvider>
    <App />
  </CartProvider>
);
