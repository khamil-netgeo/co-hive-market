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
import RequireSuperadmin from "./components/auth/RequireSuperadmin";
import SuperAdminLayout from "./pages/superadmin/SuperAdminLayout";
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import UsersRoles from "./pages/superadmin/UsersRoles";
import GlobalSettings from "./pages/superadmin/GlobalSettings";
import FeatureFlags from "./pages/superadmin/FeatureFlags";
import Announcements from "./pages/superadmin/Announcements";
import AuditLogs from "./pages/superadmin/AuditLogs";
import ContentReports from "./pages/superadmin/ContentReports";
import Categories from "./pages/superadmin/Categories";
import Finance from "./pages/admin/Finance";
import AdminKYC from "./pages/admin/KYC";
import AdminKYCRequirements from "./pages/admin/KYCRequirements";
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
import RiderDashboard from "./pages/rider/Dashboard";
import RiderAssignments from "./pages/rider/Assignments";
import RiderDeliveries from "./pages/rider/Deliveries";
import RiderProfile from "./pages/rider/Profile";
import RiderPayouts from "./pages/rider/Payouts";
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
              <Route path="/rider" element={<RiderDashboard />} />
              <Route path="/rider/assignments" element={<RiderAssignments />} />
              <Route path="/rider/deliveries" element={<RiderDeliveries />} />
              <Route path="/rider/profile" element={<RiderProfile />} />
              <Route path="/rider/payouts" element={<RiderPayouts />} />
              
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
              <Route
                path="/admin/kyc"
                element={
                  <RequireAdmin>
                    <AdminLayout>
                      <AdminKYC />
                    </AdminLayout>
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/kyc-requirements"
                element={
                  <RequireAdmin>
                    <AdminLayout>
                      <AdminKYCRequirements />
                    </AdminLayout>
                  </RequireAdmin>
                }
              />

              {/* Super Admin routes */}
              <Route
                path="/superadmin"
                element={
                  <RequireSuperadmin>
                    <SuperAdminLayout>
                      <SuperAdminDashboard />
                    </SuperAdminLayout>
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/users"
                element={
                  <RequireSuperadmin>
                    <SuperAdminLayout>
                      <UsersRoles />
                    </SuperAdminLayout>
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/settings"
                element={
                  <RequireSuperadmin>
                    <SuperAdminLayout>
                      <GlobalSettings />
                    </SuperAdminLayout>
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/feature-flags"
                element={
                  <RequireSuperadmin>
                    <SuperAdminLayout>
                      <FeatureFlags />
                    </SuperAdminLayout>
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/announcements"
                element={
                  <RequireSuperadmin>
                    <SuperAdminLayout>
                      <Announcements />
                    </SuperAdminLayout>
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/audit-logs"
                element={
                  <RequireSuperadmin>
                    <SuperAdminLayout>
                      <AuditLogs />
                    </SuperAdminLayout>
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/reports"
                element={
                  <RequireSuperadmin>
                    <SuperAdminLayout>
                      <ContentReports />
                    </SuperAdminLayout>
                  </RequireSuperadmin>
                }
              />
              <Route
                path="/superadmin/categories"
                element={
                  <RequireSuperadmin>
                    <SuperAdminLayout>
                      <Categories />
                    </SuperAdminLayout>
                  </RequireSuperadmin>
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
