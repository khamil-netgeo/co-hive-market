import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import Plans from "./pages/Plans";
import VendorPlans from "./pages/VendorPlans";
import Catalog from "./pages/Catalog";
import Orders from "./pages/Orders";
import VendorOrders from "./pages/VendorOrders";
import Riders from "./pages/Riders";
import Layout from "@/components/layout/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Keep the landing page standalone to avoid double header/hero */}
          <Route path="/" element={<Index />} />

          {/* Shared layout for all other routes */}
          <Route element={<Layout />}>
            <Route path="/auth" element={<Auth />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/riders" element={<Riders />} />
            <Route path="/vendor/plans" element={<VendorPlans />} />
            <Route path="/vendor/orders" element={<VendorOrders />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />
            {/* Catch-all inside layout */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
