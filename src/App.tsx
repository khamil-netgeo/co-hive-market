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
import Catalog from "./pages/Catalog";
import Orders from "./pages/Orders";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorAnalytics from "./pages/vendor/VendorAnalytics";
import VendorPayouts from "./pages/vendor/VendorPayouts";
import Riders from "./pages/Riders";
import Layout from "@/components/layout/Layout";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import RequireAdmin from "./components/auth/RequireAdmin";
import Finance from "./pages/admin/Finance";
import GettingStarted from "./pages/GettingStarted";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import ProductForm from "./pages/vendor/ProductForm";
import Profile from "./pages/Profile";
import Communities from "./pages/Communities";
import Services from "./pages/Services";
import VendorServices from "./pages/vendor/Services";
import VendorProducts from "./pages/vendor/VendorProducts";
import ServiceForm from "./pages/vendor/ServiceForm";
import Cart from "./pages/Cart";
import StoreSettings from "./pages/vendor/StoreSettings";
import RiderHub from "./pages/rider/Hub";
import { CartProvider } from "@/hooks/useCart";

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
              <Route path="/getting-started" element={<GettingStarted />} />
              <Route path="/auth" element={<Auth />} />
              
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/services" element={<Services />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/riders" element={<Riders />} />
              <Route path="/rider" element={<RiderHub />} />
              
              <Route path="/vendor/services" element={<VendorServices />} />
              <Route path="/vendor/services/new" element={<ServiceForm />} />
              <Route path="/vendor/services/:serviceId/edit" element={<ServiceForm />} />
              <Route path="/vendor/dashboard" element={<VendorDashboard />} />
              <Route path="/vendor/products" element={<VendorProducts />} />
              <Route path="/vendor/products/new" element={<ProductForm />} />
              <Route path="/vendor/products/:productId/edit" element={<ProductForm />} />
              <Route path="/vendor/orders" element={<VendorOrders />} />
              <Route path="/vendor/analytics" element={<VendorAnalytics />} />
              <Route path="/vendor/payouts" element={<VendorPayouts />} />
              <Route path="/vendor/store-settings" element={<StoreSettings />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminLayout>
                      <Dashboard />
                    </AdminLayout>
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/finance"
                element={
                  <RequireAdmin>
                    <AdminLayout>
                      <Finance />
                    </AdminLayout>
                  </RequireAdmin>
                }
              />
              {/* Catch-all inside layout */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    
  </QueryClientProvider>
);

export default App;
